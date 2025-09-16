// Usage Events ページのJavaScript
$(document).ready(function() {
    let usageEventsData = [];
    let dailyEventsChart = null;
    let dailyTokensChart = null;
    let inputWithCacheChart = null;
    let inputWithoutCacheChart = null;
    let cacheReadChart = null;
    let outputChart = null;
    let costChart = null;
    let modelUsageChart = null;

    // 共通の色パレット
    const CHART_COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

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

    // データをテーブルに表示
    function displayUsageEventsData() {
        const tableBody = $('#usage-events-table tbody');
        tableBody.empty();

        usageEventsData.forEach((row, index) => {
            const tr = $('<tr>');

            // 日時のフォーマット
            const date = new Date(row.Date);
            const formattedDate = date.toLocaleString('ja-JP');

            // 種別の色分け
            let kindClass = '';
            if (row.Kind === 'Included') {
                kindClass = 'text-success';
            } else if (row.Kind.includes('Errored')) {
                kindClass = 'text-danger';
            }

            tr.append(`<td>${formattedDate}</td>`);
            tr.append(`<td><span class="${kindClass}">${row.Kind}</span></td>`);
            tr.append(`<td>${row.Model}</td>`);
            tr.append(`<td>${row['Max Mode']}</td>`);
            tr.append(`<td>${formatNumber(row['Input (w/ Cache Write)'])}</td>`);
            tr.append(`<td>${formatNumber(row['Input (w/o Cache Write)'])}</td>`);
            tr.append(`<td>${formatNumber(row['Cache Read'])}</td>`);
            tr.append(`<td>${formatNumber(row['Output Tokens'])}</td>`);
            tr.append(`<td>${formatNumber(row['Total Tokens'])}</td>`);
            tr.append(`<td>${row.Cost}</td>`);

            tableBody.append(tr);
        });

        // DataTablesを初期化
        $('#usage-events-table').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
            },
            pageLength: 25,
            order: [[0, 'desc']], // 日時で降順ソート
            columnDefs: [
                { targets: [4, 5, 6, 7, 8], className: 'text-end' } // 数値列を右寄せ
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
    }

    // グラフを作成
    function createCharts() {
        createDailyEventsChart();
        createDailyTokensChart();
        createInputWithCacheChart();
        createInputWithoutCacheChart();
        createCacheReadChart();
        createOutputChart();
        createCostChart();
        createModelUsageChart();
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

    // 日別トークン使用量グラフ
    function createDailyTokensChart() {
        const ctx = document.getElementById('daily-tokens-chart').getContext('2d');

        // 日別トークン数を集計
        const dailyTokens = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const tokens = parseInt(row['Total Tokens']) || 0;
            if (!dailyTokens[date]) {
                dailyTokens[date] = 0;
            }
            dailyTokens[date] += tokens;
        });

        const dates = Object.keys(dailyTokens).sort();
        const tokenData = dates.map(date => dailyTokens[date]);

        if (dailyTokensChart) {
            dailyTokensChart.destroy();
        }

        dailyTokensChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: '総トークン数',
                    data: tokenData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
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
        const ctx = document.getElementById('input-with-cache-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const value = parseInt(row['Input (w/ Cache Write)']) || 0;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += value;
        });

        const dates = Object.keys(dailyData).sort();
        const data = dates.map(date => dailyData[date]);

        if (inputWithCacheChart) {
            inputWithCacheChart.destroy();
        }

        inputWithCacheChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Input (w/ Cache Write)',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
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

    // Input W/O CACHE WRITE グラフ
    function createInputWithoutCacheChart() {
        const ctx = document.getElementById('input-without-cache-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const value = parseInt(row['Input (w/o Cache Write)']) || 0;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += value;
        });

        const dates = Object.keys(dailyData).sort();
        const data = dates.map(date => dailyData[date]);

        if (inputWithoutCacheChart) {
            inputWithoutCacheChart.destroy();
        }

        inputWithoutCacheChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Input (w/o Cache Write)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
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

    // Cache Read グラフ
    function createCacheReadChart() {
        const ctx = document.getElementById('cache-read-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const value = parseInt(row['Cache Read']) || 0;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += value;
        });

        const dates = Object.keys(dailyData).sort();
        const data = dates.map(date => dailyData[date]);

        if (cacheReadChart) {
            cacheReadChart.destroy();
        }

        cacheReadChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Cache Read',
                    data: data,
                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                    borderColor: 'rgb(255, 206, 86)',
                    borderWidth: 1
                }]
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

    // Output グラフ
    function createOutputChart() {
        const ctx = document.getElementById('output-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const value = parseInt(row['Output Tokens']) || 0;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += value;
        });

        const dates = Object.keys(dailyData).sort();
        const data = dates.map(date => dailyData[date]);

        if (outputChart) {
            outputChart.destroy();
        }

        outputChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Output Tokens',
                    data: data,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }]
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

    // コスト グラフ
    function createCostChart() {
        const ctx = document.getElementById('cost-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const cost = parseFloat(row.Cost) || 0;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += cost;
        });

        const dates = Object.keys(dailyData).sort();
        const data = dates.map(date => dailyData[date]);

        if (costChart) {
            costChart.destroy();
        }

        costChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'コスト',
                    data: data,
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(4);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(4);
                            }
                        }
                    }
                }
            }
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
