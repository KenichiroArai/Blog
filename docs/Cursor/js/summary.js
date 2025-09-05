// グローバル変数
let summaryTable;
let apiCostChart;
let costToYouChart;
let cacheReadChart;
let cacheWriteChart;
let inputChart;
let outputChart;
let totalChart;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing summary page...');
        await loadSummaryData();

        if (summaryData && summaryData.length > 0) {
            console.log('Data loaded successfully, initializing components...');
            initializeSummaryTable();
            updateSummaryStats();
            createSummaryCharts();
        } else {
            console.warn('No summary data found');
            const errorMessage = 'Summaryデータが見つかりませんでした。ExcelファイルにSummaryシートが存在するか確認してください。';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('初期化エラー:', error);
        const errorMessage = 'データの読み込み中にエラーが発生しました: ' + error.message;
        showError(errorMessage);

        // 部分的な初期化を試行
        try {
            if (summaryData && summaryData.length > 0) {
                console.log('Attempting partial initialization...');
                initializeSummaryTable();
                updateSummaryStats();
                createSummaryCharts();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});

// 前日との差を計算する関数
function calculatePreviousDayDifference(currentRecord, previousRecord) {
    if (!previousRecord) {
        return {
            total: null,
            cacheRead: null,
            cacheWrite: null,
            input: null,
            output: null,
            apiCost: null
        };
    }

    return {
        total: currentRecord.total - previousRecord.total,
        cacheRead: currentRecord.cacheRead - previousRecord.cacheRead,
        cacheWrite: currentRecord.cacheWrite - previousRecord.cacheWrite,
        input: currentRecord.input - previousRecord.input,
        output: currentRecord.output - previousRecord.output,
        apiCost: parseFloat(currentRecord.apiCost || 0) - parseFloat(previousRecord.apiCost || 0)
    };
}

// 月ごとのリセットを考慮した前日との差を計算する関数
function calculatePreviousDayDifferenceWithReset(currentRecord, previousRecord) {
    if (!previousRecord) {
        return {
            total: null,
            cacheRead: null,
            cacheWrite: null,
            input: null,
            output: null,
            apiCost: null
        };
    }

    // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
    const isReset =
        currentRecord.total < previousRecord.total ||
        currentRecord.cacheRead < previousRecord.cacheRead ||
        currentRecord.cacheWrite < previousRecord.cacheWrite ||
        currentRecord.input < previousRecord.input ||
        currentRecord.output < previousRecord.output ||
        parseFloat(currentRecord.apiCost || 0) < parseFloat(previousRecord.apiCost || 0);

    if (isReset) {
        // リセットされた場合は、現在の値をそのまま表示（差は0）
        return {
            total: 0,
            cacheRead: 0,
            cacheWrite: 0,
            input: 0,
            output: 0,
            apiCost: 0
        };
    }

    return {
        total: currentRecord.total - previousRecord.total,
        cacheRead: currentRecord.cacheRead - previousRecord.cacheRead,
        cacheWrite: currentRecord.cacheWrite - previousRecord.cacheWrite,
        input: currentRecord.input - previousRecord.input,
        output: currentRecord.output - previousRecord.output,
        apiCost: parseFloat(currentRecord.apiCost || 0) - parseFloat(previousRecord.apiCost || 0)
    };
}

// 差の表示形式を整形する関数
function formatDifference(value, isPercentage = false) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (value === 0) {
        return '±0';
    }

    const sign = value > 0 ? '+' : '';
    const formattedValue = Math.abs(value).toLocaleString();

    if (isPercentage) {
        return `${sign}${value.toFixed(2)}%`;
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

// 月ごとのリセットを考慮した前日との差を計算する関数（グローバル）
function calculateDifferenceWithReset(currentValue, previousValue) {
    if (previousValue === null || previousValue === undefined) {
        return null;
    }

    // 前日より下がっている場合はリセット（差は0）
    if (currentValue < previousValue && previousValue > 0) {
        return 0;
    }

    return currentValue - previousValue;
}

// Summary DataTableの初期化
function initializeSummaryTable() {
    // 前日との差を計算するためのヘルパー関数
    function getPreviousDayRecord(currentRecord) {
        // 同じモデルのデータを日付順にソート
        const sameModelRecords = summaryData
            .filter(record => record.model === currentRecord.model)
            .sort((a, b) => a.date - b.date);

        // 現在のレコードのインデックスを見つける
        const currentIndex = sameModelRecords.findIndex(record =>
            record.date.getTime() === currentRecord.date.getTime()
        );

        // 前日のレコードがない場合はnullを返す
        if (currentIndex <= 0) {
            return null;
        }

        return sameModelRecords[currentIndex - 1];
    }

    summaryTable = $('#summary-table').DataTable({
        data: summaryData,
        columns: [
            {
                data: 'date',
                title: '日付',
                width: '100px',
                render: function(data) {
                    return data.toLocaleDateString('ja-JP');
                }
            },
            {
                data: 'model',
                title: 'モデル',
                width: '80px'
            },
            {
                data: 'cacheRead',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const cacheReadText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.cacheRead);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${cacheReadText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return cacheReadText;
                }
            },
            {
                data: 'cacheWrite',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const cacheWriteText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.cacheWrite);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${cacheWriteText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return cacheWriteText;
                }
            },
            {
                data: 'input',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const inputText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.input);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${inputText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return inputText;
                }
            },
            {
                data: 'output',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const outputText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.output);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${outputText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return outputText;
                }
            },
            {
                data: 'total',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const totalText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.total);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${totalText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return totalText;
                }
            },
            {
                data: 'apiCost',
                className: 'text-end',
                width: '100px',
                render: function(data, type, row) {
                    const apiCostText = data;
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const currentCost = parseFloat(data || 0);
                        const previousCost = parseFloat(previousRecord.apiCost || 0);
                        const diff = calculateDifferenceWithReset(currentCost, previousCost);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${apiCostText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return apiCostText;
                }
            },
            {
                data: 'costToYou',
                className: 'text-end',
                width: '100px',
                render: function(data, type, row) {
                    // Cost to Youが0、空、未定義、またはNaNの場合は何も表示しない
                    if (data === null || data === undefined || data === '' || data === 0 || data === '0') {
                        return '0';
                    }
                    const cost = parseFloat(data);
                    if (cost === 0 || isNaN(cost)) {
                        return '';
                    }

                    const costText = data.toString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const currentCost = parseFloat(data || 0);
                        const previousCost = parseFloat(previousRecord.costToYou || 0);
                        const diff = calculateDifferenceWithReset(currentCost, previousCost);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${costText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return costText;
                }
            }
        ],
        order: [[0, 'desc'], [1, 'asc']], // 日付の降順、次にモデルの昇順
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: false, // レスポンシブを無効にして幅を固定
        scrollX: true, // 横スクロールを有効にする
        scrollCollapse: true,
        pageLength: 25,
        autoWidth: false, // 自動幅調整を無効にする
        columnDefs: [
            {
                targets: '_all',
                className: 'text-nowrap'
            }
        ]
    });
}

// Summary統計の更新
function updateSummaryStats() {
    if (summaryData.length === 0) return;

    // 最新のauto行のデータを取得
    const autoRecords = summaryData
        .filter(record => record.model.toLowerCase() === 'auto')
        .sort((a, b) => b.date - a.date);

    const latestAutoRecord = autoRecords[0];
    const previousAutoRecord = autoRecords[1]; // 前日のデータ

    if (!latestAutoRecord) {
        console.warn('No auto record found for stats');
        return;
    }

    // 月ごとのリセットを考慮した前日との差を計算
    const differences = calculatePreviousDayDifferenceWithReset(latestAutoRecord, previousAutoRecord);

    // 最新使用日の統計を表示
    const latestSummaryDateValue = document.getElementById('latest-summary-date-value');
    if (latestSummaryDateValue) latestSummaryDateValue.textContent = latestAutoRecord.dateStr;

    // Total（前日との差付き）
    const latestTotalValue = document.getElementById('latest-total-value');
    if (latestTotalValue) {
        const totalText = latestAutoRecord.total.toLocaleString();
        const diffText = formatDifference(differences.total);
        const diffClass = getDifferenceClass(differences.total);

        if (differences.total !== null) {
            latestTotalValue.innerHTML = `${totalText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestTotalValue.textContent = totalText;
        }
    }

    // Cache Read（前日との差付き）
    const latestCacheReadValue = document.getElementById('latest-cache-read-value');
    if (latestCacheReadValue) {
        const cacheReadText = latestAutoRecord.cacheRead.toLocaleString();
        const previousCacheRead = previousAutoRecord ? previousAutoRecord.cacheRead : 0;
        const diff = calculateDifferenceWithReset(latestAutoRecord.cacheRead, previousCacheRead);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestCacheReadValue.innerHTML = `${cacheReadText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestCacheReadValue.textContent = cacheReadText;
        }
    }

    // Cache Write（前日との差付き）
    const latestCacheWriteValue = document.getElementById('latest-cache-write-value');
    if (latestCacheWriteValue) {
        const cacheWriteText = latestAutoRecord.cacheWrite.toLocaleString();
        const previousCacheWrite = previousAutoRecord ? previousAutoRecord.cacheWrite : 0;
        const diff = calculateDifferenceWithReset(latestAutoRecord.cacheWrite, previousCacheWrite);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestCacheWriteValue.innerHTML = `${cacheWriteText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestCacheWriteValue.textContent = cacheWriteText;
        }
    }

    // Input（前日との差付き）
    const latestInputValue = document.getElementById('latest-input-value');
    if (latestInputValue) {
        const inputText = latestAutoRecord.input.toLocaleString();
        const diffText = formatDifference(differences.input);
        const diffClass = getDifferenceClass(differences.input);

        if (differences.input !== null) {
            latestInputValue.innerHTML = `${inputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestInputValue.textContent = inputText;
        }
    }

    // Output（前日との差付き）
    const latestOutputValue = document.getElementById('latest-output-value');
    if (latestOutputValue) {
        const outputText = latestAutoRecord.output.toLocaleString();
        const diffText = formatDifference(differences.output);
        const diffClass = getDifferenceClass(differences.output);

        if (differences.output !== null) {
            latestOutputValue.innerHTML = `${outputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestOutputValue.textContent = outputText;
        }
    }

    // API Cost（前日との差付き）
    const latestApiCostValue = document.getElementById('latest-api-cost-value');
    if (latestApiCostValue) {
        const apiCostText = latestAutoRecord.apiCost;
        const diffText = formatDifference(differences.apiCost);
        const diffClass = getDifferenceClass(differences.apiCost);

        if (differences.apiCost !== null) {
            latestApiCostValue.innerHTML = `${apiCostText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestApiCostValue.textContent = apiCostText;
        }
    }

    // Cost to You（前日との差付き）
    const latestCostToYouValue = document.getElementById('latest-cost-to-you-value');
    if (latestCostToYouValue) {
        const costToYou = parseFloat(latestAutoRecord.costToYou) || 0;
        const costToYouText = costToYou === 0 ? '0' : costToYou.toString();
        const previousCostToYou = previousAutoRecord ? (parseFloat(previousAutoRecord.costToYou) || 0) : 0;
        const diff = calculateDifferenceWithReset(costToYou, previousCostToYou);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestCostToYouValue.innerHTML = `${costToYouText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestCostToYouValue.textContent = costToYouText;
        }
    }
}

// Summary グラフの作成
function createSummaryCharts() {
    if (summaryData.length === 0) return;

    // 新しいグラフを作成
    try {
        createApiCostChart();
        createCostToYouChart();
        createCacheReadChart();
        createCacheWriteChart();
        createInputChart();
        createOutputChart();
        createTotalChart();
    } catch (error) {
        console.error('新しいグラフの作成中にエラーが発生しました:', error);
    }
}

// API Cost グラフの作成
function createApiCostChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    apiCost: {}
                };
            }

            if (!modelData[model].apiCost[dateStr]) {
                modelData[model].apiCost[dateStr] = 0;
            }

            // 数値に変換（文字列の場合は0として扱う）
            const apiCost = parseFloat(record.apiCost) || 0;
            modelData[model].apiCost[dateStr] += apiCost;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                apiCost: []
            };
            previousData[model] = {
                apiCost: []
            };

            let cumulativeApiCost = 0;
            let previousMonthApiCost = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentApiCost = modelData[model].apiCost[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousApiCost = previousDate ? (modelData[model].apiCost[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentApiCost < previousApiCost && previousApiCost > 0) {
                    // 新しい月の開始
                    cumulativeApiCost = currentApiCost;
                    previousMonthApiCost = 0;
                } else {
                    // 同じ月の継続
                    cumulativeApiCost = currentApiCost;
                    previousMonthApiCost = previousApiCost;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthApiCost;

                // 当日の増分
                const diffPart = cumulativeApiCost - previousMonthApiCost;

                // データを保存
                currentData[model].apiCost.push(cumulativeApiCost);
                previousData[model].apiCost.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // API Cost データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - API Cost (前日分)`,
                data: previousData[model].apiCost.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_apiCost`
            });

            datasets.push({
                label: `${model} - API Cost (当日増分)`,
                data: previousData[model].apiCost.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_apiCost`
            });
        });

        // グラフを作成
        const apiCostCtx = document.getElementById('api-cost-chart');
        if (!apiCostCtx) {
            console.warn('api-cost-chart canvas not found');
            return;
        }

        apiCostChart = new Chart(apiCostCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'API Cost 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(4)}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: $${modelTotals[model].toFixed(4)}`);
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
                                return `$${value.toFixed(4)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('API Cost chart creation error:', error);
    }
}

// 他のグラフ作成関数（簡略版）
function createCostToYouChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    costToYou: {}
                };
            }

            if (!modelData[model].costToYou[dateStr]) {
                modelData[model].costToYou[dateStr] = 0;
            }

            // 数値に変換（文字列の場合は0として扱う）
            const costToYou = parseFloat(record.costToYou) || 0;
            modelData[model].costToYou[dateStr] += costToYou;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                costToYou: []
            };
            previousData[model] = {
                costToYou: []
            };

            let cumulativeCostToYou = 0;
            let previousMonthCostToYou = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentCostToYou = modelData[model].costToYou[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousCostToYou = previousDate ? (modelData[model].costToYou[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentCostToYou < previousCostToYou && previousCostToYou > 0) {
                    // 新しい月の開始
                    cumulativeCostToYou = currentCostToYou;
                    previousMonthCostToYou = 0;
                } else {
                    // 同じ月の継続
                    cumulativeCostToYou = currentCostToYou;
                    previousMonthCostToYou = previousCostToYou;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthCostToYou;

                // 当日の増分
                const diffPart = cumulativeCostToYou - previousMonthCostToYou;

                // データを保存
                currentData[model].costToYou.push(cumulativeCostToYou);
                previousData[model].costToYou.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Cost to You データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Cost to You (前日分)`,
                data: previousData[model].costToYou.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_costToYou`
            });

            datasets.push({
                label: `${model} - Cost to You (当日増分)`,
                data: previousData[model].costToYou.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_costToYou`
            });
        });

        // グラフを作成
        const costToYouCtx = document.getElementById('cost-to-you-chart');
        if (!costToYouCtx) {
            console.warn('cost-to-you-chart canvas not found');
            return;
        }

        costToYouChart = new Chart(costToYouCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cost to You 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(4)}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: $${modelTotals[model].toFixed(4)}`);
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
                                return `$${value.toFixed(4)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Cost to You chart creation error:', error);
    }
}

function createCacheReadChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    cacheRead: {}
                };
            }

            if (!modelData[model].cacheRead[dateStr]) {
                modelData[model].cacheRead[dateStr] = 0;
            }

            // 数値に変換
            const cacheRead = parseInt(record.cacheRead) || 0;
            modelData[model].cacheRead[dateStr] += cacheRead;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                cacheRead: []
            };
            previousData[model] = {
                cacheRead: []
            };

            let cumulativeCacheRead = 0;
            let previousMonthCacheRead = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentCacheRead = modelData[model].cacheRead[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousCacheRead = previousDate ? (modelData[model].cacheRead[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentCacheRead < previousCacheRead && previousCacheRead > 0) {
                    // 新しい月の開始
                    cumulativeCacheRead = currentCacheRead;
                    previousMonthCacheRead = 0;
                } else {
                    // 同じ月の継続
                    cumulativeCacheRead = currentCacheRead;
                    previousMonthCacheRead = previousCacheRead;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthCacheRead;

                // 当日の増分
                const diffPart = cumulativeCacheRead - previousMonthCacheRead;

                // データを保存
                currentData[model].cacheRead.push(cumulativeCacheRead);
                previousData[model].cacheRead.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Cache Read データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Cache Read (前日分)`,
                data: previousData[model].cacheRead.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_cacheRead`
            });

            datasets.push({
                label: `${model} - Cache Read (当日増分)`,
                data: previousData[model].cacheRead.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_cacheRead`
            });
        });

        // グラフを作成
        const cacheReadCtx = document.getElementById('cache-read-chart');
        if (!cacheReadCtx) {
            console.warn('cache-read-chart canvas not found');
            return;
        }

        cacheReadChart = new Chart(cacheReadCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cache Read 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: ${modelTotals[model].toLocaleString()}`);
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Cache Read chart creation error:', error);
    }
}

function createCacheWriteChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    cacheWrite: {}
                };
            }

            if (!modelData[model].cacheWrite[dateStr]) {
                modelData[model].cacheWrite[dateStr] = 0;
            }

            // 数値に変換
            const cacheWrite = parseInt(record.cacheWrite) || 0;
            modelData[model].cacheWrite[dateStr] += cacheWrite;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                cacheWrite: []
            };
            previousData[model] = {
                cacheWrite: []
            };

            let cumulativeCacheWrite = 0;
            let previousMonthCacheWrite = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentCacheWrite = modelData[model].cacheWrite[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousCacheWrite = previousDate ? (modelData[model].cacheWrite[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentCacheWrite < previousCacheWrite && previousCacheWrite > 0) {
                    // 新しい月の開始
                    cumulativeCacheWrite = currentCacheWrite;
                    previousMonthCacheWrite = 0;
                } else {
                    // 同じ月の継続
                    cumulativeCacheWrite = currentCacheWrite;
                    previousMonthCacheWrite = previousCacheWrite;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthCacheWrite;

                // 当日の増分
                const diffPart = cumulativeCacheWrite - previousMonthCacheWrite;

                // データを保存
                currentData[model].cacheWrite.push(cumulativeCacheWrite);
                previousData[model].cacheWrite.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Cache Write データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Cache Write (前日分)`,
                data: previousData[model].cacheWrite.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_cacheWrite`
            });

            datasets.push({
                label: `${model} - Cache Write (当日増分)`,
                data: previousData[model].cacheWrite.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_cacheWrite`
            });
        });

        // グラフを作成
        const cacheWriteCtx = document.getElementById('cache-write-chart');
        if (!cacheWriteCtx) {
            console.warn('cache-write-chart canvas not found');
            return;
        }

        cacheWriteChart = new Chart(cacheWriteCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cache Write 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: ${modelTotals[model].toLocaleString()}`);
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Cache Write chart creation error:', error);
    }
}

function createInputChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    input: {}
                };
            }

            if (!modelData[model].input[dateStr]) {
                modelData[model].input[dateStr] = 0;
            }

            // 数値に変換
            const input = parseInt(record.input) || 0;
            modelData[model].input[dateStr] += input;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                input: []
            };
            previousData[model] = {
                input: []
            };

            let cumulativeInput = 0;
            let previousMonthInput = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentInput = modelData[model].input[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousInput = previousDate ? (modelData[model].input[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentInput < previousInput && previousInput > 0) {
                    // 新しい月の開始
                    cumulativeInput = currentInput;
                    previousMonthInput = 0;
                } else {
                    // 同じ月の継続
                    cumulativeInput = currentInput;
                    previousMonthInput = previousInput;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthInput;

                // 当日の増分
                const diffPart = cumulativeInput - previousMonthInput;

                // データを保存
                currentData[model].input.push(cumulativeInput);
                previousData[model].input.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Input データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Input (前日分)`,
                data: previousData[model].input.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_input`
            });

            datasets.push({
                label: `${model} - Input (当日増分)`,
                data: previousData[model].input.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_input`
            });
        });

        // グラフを作成
        const inputCtx = document.getElementById('input-chart');
        if (!inputCtx) {
            console.warn('input-chart canvas not found');
            return;
        }

        inputChart = new Chart(inputCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Input 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: ${modelTotals[model].toLocaleString()}`);
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Input chart creation error:', error);
    }
}

function createOutputChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    output: {}
                };
            }

            if (!modelData[model].output[dateStr]) {
                modelData[model].output[dateStr] = 0;
            }

            // 数値に変換
            const output = parseInt(record.output) || 0;
            modelData[model].output[dateStr] += output;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                output: []
            };
            previousData[model] = {
                output: []
            };

            let cumulativeOutput = 0;
            let previousMonthOutput = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentOutput = modelData[model].output[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousOutput = previousDate ? (modelData[model].output[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentOutput < previousOutput && previousOutput > 0) {
                    // 新しい月の開始
                    cumulativeOutput = currentOutput;
                    previousMonthOutput = 0;
                } else {
                    // 同じ月の継続
                    cumulativeOutput = currentOutput;
                    previousMonthOutput = previousOutput;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthOutput;

                // 当日の増分
                const diffPart = cumulativeOutput - previousMonthOutput;

                // データを保存
                currentData[model].output.push(cumulativeOutput);
                previousData[model].output.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Output データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Output (前日分)`,
                data: previousData[model].output.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_output`
            });

            datasets.push({
                label: `${model} - Output (当日増分)`,
                data: previousData[model].output.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_output`
            });
        });

        // グラフを作成
        const outputCtx = document.getElementById('output-chart');
        if (!outputCtx) {
            console.warn('output-chart canvas not found');
            return;
        }

        outputChart = new Chart(outputCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Output 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: ${modelTotals[model].toLocaleString()}`);
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Output chart creation error:', error);
    }
}

function createTotalChart() {
    try {
        if (summaryData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        summaryData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    total: {}
                };
            }

            if (!modelData[model].total[dateStr]) {
                modelData[model].total[dateStr] = 0;
            }

            // 数値に変換
            const total = parseInt(record.total) || 0;
            modelData[model].total[dateStr] += total;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                total: []
            };
            previousData[model] = {
                total: []
            };

            let cumulativeTotal = 0;
            let previousMonthTotal = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentTotal = modelData[model].total[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousTotal = previousDate ? (modelData[model].total[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentTotal < previousTotal && previousTotal > 0) {
                    // 新しい月の開始
                    cumulativeTotal = currentTotal;
                    previousMonthTotal = 0;
                } else {
                    // 同じ月の継続
                    cumulativeTotal = currentTotal;
                    previousMonthTotal = previousTotal;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthTotal;

                // 当日の増分
                const diffPart = cumulativeTotal - previousMonthTotal;

                // データを保存
                currentData[model].total.push(cumulativeTotal);
                previousData[model].total.push({
                    previous: previousPart,
                    diff: diffPart
                });
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Total データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Total (前日分)`,
                data: previousData[model].total.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_total`
            });

            datasets.push({
                label: `${model} - Total (当日増分)`,
                data: previousData[model].total.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_total`
            });
        });

        // グラフを作成
        const totalCtx = document.getElementById('total-chart');
        if (!totalCtx) {
            console.warn('total-chart canvas not found');
            return;
        }

        totalChart = new Chart(totalCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0]; // stack名からモデル名を抽出
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    totalLines.push(`${model}: ${modelTotals[model].toLocaleString()}`);
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Total chart creation error:', error);
    }
}
