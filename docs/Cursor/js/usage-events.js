// Usage Events ページのJavaScript
$(document).ready(function() {
    let usageEventsData = [];
    let dailyEventsChart = null;
    let totalTokensChart = null;
    let inputWithCacheChart = null;
    let inputWithoutCacheChart = null;
    let cacheReadChart = null;
    let outputChart = null;
    let costChart = null;
    let modelUsageChart = null;

    // 共通の色パレット
    const CHART_COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

    // 前日との差を計算する関数
    function calculatePreviousDayDifference(currentRecord, previousRecord) {
        if (!previousRecord) {
            return {
                totalTokens: null,
                inputWithCache: null,
                inputWithoutCache: null,
                cacheRead: null,
                output: null,
                cost: null
            };
        }

        return {
            totalTokens: currentRecord['Total Tokens'] - previousRecord['Total Tokens'],
            inputWithCache: currentRecord['Input (w/ Cache Write)'] - previousRecord['Input (w/ Cache Write)'],
            inputWithoutCache: currentRecord['Input (w/o Cache Write)'] - previousRecord['Input (w/o Cache Write)'],
            cacheRead: currentRecord['Cache Read'] - previousRecord['Cache Read'],
            output: currentRecord['Output Tokens'] - previousRecord['Output Tokens'],
            cost: parseFloat(currentRecord.Cost || 0) - parseFloat(previousRecord.Cost || 0)
        };
    }

    // 差の表示形式を整形する関数
    function formatDifference(value, isCurrency = false) {
        if (value === null || value === undefined) {
            return '-';
        }

        if (value === 0) {
            return '±0';
        }

        const sign = value > 0 ? '+' : '';
        const formattedValue = Math.abs(value).toLocaleString();

        if (isCurrency) {
            return `${sign}$${value.toFixed(4)}`;
        } else {
            return `${sign}${formattedValue}`;
        }
    }

    // 差の表示クラスを取得する関数
    function getDifferenceClass(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (value > 0) {
            return 'text-success';
        } else if (value < 0) {
            return 'text-danger';
        } else {
            return 'text-muted';
        }
    }

    // 前日との差を計算するためのヘルパー関数
    function getPreviousDayRecord(currentRecord) {
        // 同じモデルのデータを日付順にソート
        const sameModelRecords = usageEventsData
            .filter(record => record.Model === currentRecord.Model)
            .sort((a, b) => new Date(a.Date) - new Date(b.Date));

        // 現在のレコードのインデックスを見つける
        const currentIndex = sameModelRecords.findIndex(record =>
            new Date(record.Date).getTime() === new Date(currentRecord.Date).getTime()
        );

        // 前日のレコードがない場合はnullを返す
        if (currentIndex <= 0) {
            return null;
        }

        return sameModelRecords[currentIndex - 1];
    }

    // CSVファイルを読み込む
    function loadUsageEventsData() {
        showLoading(true);
        hideError();

        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/usage-events.csv' : '../Tool/AllRawEvents/data/usage-events.csv';

        fetch(csvPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(csvText => {
                usageEventsData = parseCSV(csvText);
                displayUsageEventsData();
                updateStatistics();
                createCharts();
                showLoading(false);
            })
            .catch(error => {
                console.error('Error loading usage events data:', error);
                showError('データの読み込みに失敗しました: ' + error.message);
                showLoading(false);
            });
    }

    // CSVをパースする
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index].trim();
                });
                data.push(row);
            }
        }

        return data;
    }

    // CSV行をパースする（カンマ区切り、引用符対応）
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    // 共通のテーブル列レンダリング関数
    function createTableColumnRenderer(fieldName, isCurrency = false) {
        return function(data, type, row) {
            const valueText = isCurrency ? data : formatNumber(data);
            const previousRecord = getPreviousDayRecord(row);

            if (previousRecord && type === 'display') {
                const currentValue = isCurrency ? parseFloat(data || 0) : parseInt(data || 0);
                const previousValue = isCurrency ? parseFloat(previousRecord[fieldName] || 0) : parseInt(previousRecord[fieldName] || 0);
                const diff = currentValue - previousValue;
                const diffText = formatDifference(diff, isCurrency);
                const diffClass = getDifferenceClass(diff);

                if (diff !== null && diff !== 0) {
                    return `${valueText} <small class="${diffClass}">(${diffText})</small>`;
                }
            }

            return valueText;
        };
    }

    // データをテーブルに表示
    function displayUsageEventsData() {
        // DataTablesを初期化
        $('#usage-events-table').DataTable({
            data: usageEventsData,
            columns: [
                {
                    data: 'Date',
                    title: '日時',
                    render: function(data) {
                        const date = new Date(data);
                        return date.toLocaleString('ja-JP');
                    }
                },
                {
                    data: 'Kind',
                    title: '種別',
                    render: function(data) {
                        let kindClass = '';
                        if (data === 'Included') {
                            kindClass = 'text-success';
                        } else if (data.includes('Errored')) {
                            kindClass = 'text-danger';
                        }
                        return `<span class="${kindClass}">${data}</span>`;
                    }
                },
                {
                    data: 'Model',
                    title: 'モデル'
                },
                {
                    data: 'Max Mode',
                    title: 'Max Mode'
                },
                {
                    data: 'Input (w/ Cache Write)',
                    title: 'Input (w/ Cache Write)',
                    className: 'text-end',
                    render: createTableColumnRenderer('Input (w/ Cache Write)')
                },
                {
                    data: 'Input (w/o Cache Write)',
                    title: 'Input (w/o Cache Write)',
                    className: 'text-end',
                    render: createTableColumnRenderer('Input (w/o Cache Write)')
                },
                {
                    data: 'Cache Read',
                    title: 'Cache Read',
                    className: 'text-end',
                    render: createTableColumnRenderer('Cache Read')
                },
                {
                    data: 'Output Tokens',
                    title: 'Output Tokens',
                    className: 'text-end',
                    render: createTableColumnRenderer('Output Tokens')
                },
                {
                    data: 'Total Tokens',
                    title: 'Total Tokens',
                    className: 'text-end',
                    render: createTableColumnRenderer('Total Tokens')
                },
                {
                    data: 'Cost',
                    title: 'コスト',
                    className: 'text-end',
                    render: createTableColumnRenderer('Cost', true)
                }
            ],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
            },
            pageLength: 25,
            order: [[0, 'desc']], // 日時で降順ソート
            columnDefs: [
                { targets: [4, 5, 6, 7, 8, 9], className: 'text-end' } // 数値列を右寄せ
            ]
        });
    }

    // 統計情報を更新
    function updateStatistics() {
        const totalEvents = usageEventsData.length;
        const successfulEvents = usageEventsData.filter(row => row.Kind === 'Included').length;
        const errorEvents = usageEventsData.filter(row => row.Kind.includes('Errored')).length;

        // 総トークン数を計算
        const totalTokens = usageEventsData.reduce((sum, row) => {
            const tokens = parseInt(row['Total Tokens']) || 0;
            return sum + tokens;
        }, 0);

        $('#total-events').text(totalEvents.toLocaleString());
        $('#successful-events').text(successfulEvents.toLocaleString());
        $('#error-events').text(errorEvents.toLocaleString());
        $('#total-tokens').text(totalTokens.toLocaleString());

        // 最新使用日統計を更新
        updateLatestUsageStats();
    }

    // 最新使用日統計を更新
    function updateLatestUsageStats() {
        if (usageEventsData.length === 0) return;

        // 最新のレコードを取得（日付順でソート）
        const sortedData = [...usageEventsData].sort((a, b) => new Date(b.Date) - new Date(a.Date));
        const latestRecord = sortedData[0];
        const previousRecord = sortedData[1]; // 前日のデータ

        if (!latestRecord) {
            console.warn('No latest record found for stats');
            return;
        }

        // 前日との差を計算
        const differences = calculatePreviousDayDifference(latestRecord, previousRecord);

        // 最新使用日を表示
        const latestUsageDateValue = document.getElementById('latest-usage-date-value');
        if (latestUsageDateValue) {
            const date = new Date(latestRecord.Date);
            latestUsageDateValue.textContent = date.toLocaleDateString('ja-JP');
        }

        // Total Tokens（前日との差付き）
        const latestTotalTokensValue = document.getElementById('latest-total-tokens-value');
        if (latestTotalTokensValue) {
            const totalTokensText = parseInt(latestRecord['Total Tokens']).toLocaleString();
            const diffText = formatDifference(differences.totalTokens);
            const diffClass = getDifferenceClass(differences.totalTokens);

            if (differences.totalTokens !== null) {
                latestTotalTokensValue.innerHTML = `${totalTokensText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestTotalTokensValue.textContent = totalTokensText;
            }
        }

        // Input (W/CACHE WRITE)（前日との差付き）
        const latestInputWithCacheValue = document.getElementById('latest-input-with-cache-value');
        if (latestInputWithCacheValue) {
            const inputWithCacheText = parseInt(latestRecord['Input (w/ Cache Write)']).toLocaleString();
            const diffText = formatDifference(differences.inputWithCache);
            const diffClass = getDifferenceClass(differences.inputWithCache);

            if (differences.inputWithCache !== null) {
                latestInputWithCacheValue.innerHTML = `${inputWithCacheText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestInputWithCacheValue.textContent = inputWithCacheText;
            }
        }

        // Input (W/O CACHE WRITE)（前日との差付き）
        const latestInputWithoutCacheValue = document.getElementById('latest-input-without-cache-value');
        if (latestInputWithoutCacheValue) {
            const inputWithoutCacheText = parseInt(latestRecord['Input (w/o Cache Write)']).toLocaleString();
            const diffText = formatDifference(differences.inputWithoutCache);
            const diffClass = getDifferenceClass(differences.inputWithoutCache);

            if (differences.inputWithoutCache !== null) {
                latestInputWithoutCacheValue.innerHTML = `${inputWithoutCacheText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestInputWithoutCacheValue.textContent = inputWithoutCacheText;
            }
        }

        // Cache Read（前日との差付き）
        const latestCacheReadValue = document.getElementById('latest-cache-read-value');
        if (latestCacheReadValue) {
            const cacheReadText = parseInt(latestRecord['Cache Read']).toLocaleString();
            const diffText = formatDifference(differences.cacheRead);
            const diffClass = getDifferenceClass(differences.cacheRead);

            if (differences.cacheRead !== null) {
                latestCacheReadValue.innerHTML = `${cacheReadText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestCacheReadValue.textContent = cacheReadText;
            }
        }

        // Output Tokens（前日との差付き）
        const latestOutputTokensValue = document.getElementById('latest-output-tokens-value');
        if (latestOutputTokensValue) {
            const outputText = parseInt(latestRecord['Output Tokens']).toLocaleString();
            const diffText = formatDifference(differences.output);
            const diffClass = getDifferenceClass(differences.output);

            if (differences.output !== null) {
                latestOutputTokensValue.innerHTML = `${outputText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestOutputTokensValue.textContent = outputText;
            }
        }

        // コスト（前日との差付き）
        const latestCostValue = document.getElementById('latest-cost-value');
        if (latestCostValue) {
            const costText = latestRecord.Cost;
            const diffText = formatDifference(differences.cost, true);
            const diffClass = getDifferenceClass(differences.cost);

            if (differences.cost !== null) {
                latestCostValue.innerHTML = `${costText} <small class="${diffClass}">(${diffText})</small>`;
            } else {
                latestCostValue.textContent = costText;
            }
        }
    }

    // グラフを作成
    function createCharts() {
        createDailyEventsChart();
        createTotalTokensChart();
        createInputWithCacheChart();
        createInputWithoutCacheChart();
        createCacheReadChart();
        createOutputChart();
        createCostChart();
        createModelUsageChart();
    }

    // 共通のグラフデータ作成関数（included-usage.jsスタイル）
    function createChartDataWithReset(data, fieldName, uniqueDates) {
        const modelData = {};
        const currentData = {};
        const previousData = {};

        // データを整理
        data.forEach(record => {
            const model = record.Model;
            const dateStr = new Date(record.Date).toLocaleDateString('ja-JP');

            if (!modelData[model]) {
                modelData[model] = { [fieldName]: {} };
            }

            if (!modelData[model][fieldName][dateStr]) {
                modelData[model][fieldName][dateStr] = 0;
            }

            const value = parseFloat(record[fieldName]) || 0;
            modelData[model][fieldName][dateStr] += value;
        });

        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = { [fieldName]: [] };
            previousData[model] = { [fieldName]: [] };

            let cumulativeValue = 0;
            let previousMonthValue = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentValue = modelData[model][fieldName][dateStr] || 0;
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousValue = previousDate ? (modelData[model][fieldName][previousDate] || 0) : 0;

                // 月ごとのリセットをチェック
                if (currentValue < previousValue && previousValue > 0) {
                    cumulativeValue = currentValue;
                    previousMonthValue = 0;
                } else {
                    cumulativeValue = currentValue;
                    previousMonthValue = previousValue;
                }

                const previousPart = previousMonthValue;
                const diffPart = cumulativeValue - previousMonthValue;

                currentData[model][fieldName].push(cumulativeValue);
                previousData[model][fieldName].push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        return { modelData, currentData, previousData, models };
    }

    // 共通のグラフデータセット作成関数
    function createChartDatasets(models, previousData, fieldName, fieldLabel, previousColorOpacity = '40', diffColorOpacity = '80') {
        const datasets = [];

        models.forEach((model, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];

            datasets.push({
                label: `${model} - ${fieldLabel} (前日分)`,
                data: previousData[model][fieldName].map(item => item.previous),
                backgroundColor: color + previousColorOpacity,
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_${fieldName}`
            });

            datasets.push({
                label: `${model} - ${fieldLabel} (当日増分)`,
                data: previousData[model][fieldName].map(item => item.diff),
                backgroundColor: color + diffColorOpacity,
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_${fieldName}`
            });
        });

        return datasets;
    }

    // 共通のグラフオプション作成関数
    function createChartOptions(title, isCurrency = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return isCurrency ?
                                `${label}: $${value.toFixed(4)}` :
                                `${label}: ${value.toLocaleString()}`;
                        },
                        afterBody: function(context) {
                            const modelTotals = {};

                            context.forEach(item => {
                                const stack = item.dataset.stack;
                                const model = stack.split('_')[0];
                                if (!modelTotals[model]) {
                                    modelTotals[model] = 0;
                                }
                                modelTotals[model] += item.parsed.y;
                            });

                            const totalLines = [];
                            Object.keys(modelTotals).forEach(model => {
                                const formattedValue = isCurrency ?
                                    `$${modelTotals[model].toFixed(4)}` :
                                    modelTotals[model].toLocaleString();
                                totalLines.push(`${model}: ${formattedValue}`);
                            });

                            return totalLines;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    stacked: true,
                    ticks: {
                        callback: function(value) {
                            return isCurrency ?
                                `$${value.toFixed(4)}` :
                                value.toLocaleString();
                        }
                    }
                }
            }
        };
    }

    // 共通のグラフ作成関数（included-usage.jsスタイル）
    function createIncludedUsageChart(config) {
        const {
            fieldName,
            fieldLabel,
            chartId,
            chartTitle,
            isCurrency = false,
            previousColorOpacity = '40',
            diffColorOpacity = '80',
            chartVariable
        } = config;

        try {
            if (usageEventsData.length === 0) return;

            // 日付の重複を除去してソート
            const uniqueDates = [...new Set(usageEventsData.map(record => {
                const date = new Date(record.Date);
                return date.toLocaleDateString('ja-JP');
            }))].sort((a, b) => new Date(a) - new Date(b));

            // 共通のデータ処理関数を使用
            const { previousData, models } = createChartDataWithReset(usageEventsData, fieldName, uniqueDates);

            // 共通のデータセット作成関数を使用
            const datasets = createChartDatasets(models, previousData, fieldName, fieldLabel, previousColorOpacity, diffColorOpacity);

            // グラフを作成
            const ctx = document.getElementById(chartId);
            if (!ctx) {
                console.warn(`${chartId} canvas not found`);
                return;
            }

            if (window[chartVariable]) {
                window[chartVariable].destroy();
            }

            window[chartVariable] = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: uniqueDates,
                    datasets: datasets
                },
                options: createChartOptions(chartTitle, isCurrency)
            });
        } catch (error) {
            console.error(`${fieldLabel} chart creation error:`, error);
        }
    }

    // 日別イベント数グラフ
    function createDailyEventsChart() {
        const ctx = document.getElementById('daily-events-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, successful: 0, error: 0 };
            }
            dailyData[date].total++;
            if (row.Kind === 'Included') {
                dailyData[date].successful++;
            } else if (row.Kind.includes('Errored')) {
                dailyData[date].error++;
            }
        });

        const dates = Object.keys(dailyData).sort();
        const totalData = dates.map(date => dailyData[date].total);
        const successfulData = dates.map(date => dailyData[date].successful);
        const errorData = dates.map(date => dailyData[date].error);

        if (dailyEventsChart) {
            dailyEventsChart.destroy();
        }

        dailyEventsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: '総イベント数',
                        data: totalData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: '成功イベント',
                        data: successfulData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'エラーイベント',
                        data: errorData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    // Total Tokens グラフ
    function createTotalTokensChart() {
        createIncludedUsageChart({
            fieldName: 'Total Tokens',
            fieldLabel: 'Total Tokens',
            chartId: 'total-tokens-chart',
            chartTitle: 'Total Tokens 積立推移',
            isCurrency: false,
            chartVariable: 'totalTokensChart'
        });
    }

    // 数値をフォーマット
    function formatNumber(num) {
        const number = parseInt(num);
        if (isNaN(number)) return num;
        return number.toLocaleString();
    }

    // ローディング表示
    function showLoading(show) {
        if (show) {
            $('#loading').removeClass('d-none');
        } else {
            $('#loading').addClass('d-none');
        }
    }

    // エラー表示
    function showError(message) {
        $('#error-message').text(message).removeClass('d-none');
    }

    // エラー非表示
    function hideError() {
        $('#error-message').addClass('d-none');
    }

    // Input W/CACHE WRITE グラフ
    function createInputWithCacheChart() {
        createIncludedUsageChart({
            fieldName: 'Input (w/ Cache Write)',
            fieldLabel: 'Input W/CACHE WRITE',
            chartId: 'input-with-cache-chart',
            chartTitle: 'Input (W/CACHE WRITE) 積立推移',
            isCurrency: false,
            chartVariable: 'inputWithCacheChart'
        });
    }

    // Input W/O CACHE WRITE グラフ
    function createInputWithoutCacheChart() {
        createIncludedUsageChart({
            fieldName: 'Input (w/o Cache Write)',
            fieldLabel: 'Input W/O CACHE WRITE',
            chartId: 'input-without-cache-chart',
            chartTitle: 'Input (W/O CACHE WRITE) 積立推移',
            isCurrency: false,
            chartVariable: 'inputWithoutCacheChart'
        });
    }

    // Cache Read グラフ
    function createCacheReadChart() {
        createIncludedUsageChart({
            fieldName: 'Cache Read',
            fieldLabel: 'Cache Read',
            chartId: 'cache-read-chart',
            chartTitle: 'Cache Read 積立推移',
            isCurrency: false,
            previousColorOpacity: '30',
            diffColorOpacity: '70',
            chartVariable: 'cacheReadChart'
        });
    }

    // Output グラフ
    function createOutputChart() {
        createIncludedUsageChart({
            fieldName: 'Output Tokens',
            fieldLabel: 'Output',
            chartId: 'output-chart',
            chartTitle: 'Output 積立推移',
            isCurrency: false,
            previousColorOpacity: '20',
            diffColorOpacity: '60',
            chartVariable: 'outputChart'
        });
    }

    // コスト グラフ
    function createCostChart() {
        createIncludedUsageChart({
            fieldName: 'Cost',
            fieldLabel: 'コスト',
            chartId: 'cost-chart',
            chartTitle: 'コスト 積立推移',
            isCurrency: true,
            chartVariable: 'costChart'
        });
    }

    // モデル別使用量グラフ
    function createModelUsageChart() {
        const ctx = document.getElementById('model-usage-chart').getContext('2d');

        // モデル別データを集計
        const modelData = {};
        usageEventsData.forEach(row => {
            const model = row.Model;
            const tokens = parseInt(row['Total Tokens']) || 0;
            if (!modelData[model]) {
                modelData[model] = 0;
            }
            modelData[model] += tokens;
        });

        const models = Object.keys(modelData);
        const data = models.map(model => modelData[model]);

        if (modelUsageChart) {
            modelUsageChart.destroy();
        }

        modelUsageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: models,
                datasets: [{
                    data: data,
                    backgroundColor: CHART_COLORS.slice(0, models.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // データ読み込み開始
    loadUsageEventsData();
});
