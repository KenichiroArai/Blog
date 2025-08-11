// グローバル変数
let includedUsageTable;
let inputOutputChart;
let costChart;
let totalTokensChart;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing included-usage page...');
        await loadIncludedUsageData();

        if (includedUsageData && includedUsageData.length > 0) {
            console.log('Data loaded successfully, initializing components...');
            initializeIncludedUsageTable();
            updateIncludedUsageStats();
            createIncludedUsageCharts();
        } else {
            console.warn('No included usage data found');
            const errorMessage = 'Included Usageデータが見つかりませんでした。ExcelファイルにIncluded Usage Summaryシートが存在するか確認してください。';
            showError(errorMessage);
        }
    } catch (error) {
        console.error('初期化エラー:', error);
        const errorMessage = 'データの読み込み中にエラーが発生しました: ' + error.message;
        showError(errorMessage);

        // 部分的な初期化を試行
        try {
            if (includedUsageData && includedUsageData.length > 0) {
                console.log('Attempting partial initialization...');
                initializeIncludedUsageTable();
                updateIncludedUsageStats();
                createIncludedUsageCharts();
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
            totalTokens: null,
            input: null,
            output: null,
            apiCost: null
        };
    }

    return {
        totalTokens: currentRecord.totalTokens - previousRecord.totalTokens,
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

// Included Usage DataTableの初期化
function initializeIncludedUsageTable() {
    // 前日との差を計算するためのヘルパー関数
    function getPreviousDayRecord(currentRecord) {
        // 同じモデルのデータを日付順にソート
        const sameModelRecords = includedUsageData
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

    includedUsageTable = $('#included-usage-table').DataTable({
        data: includedUsageData,
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
                data: 'input',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const inputText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = data - previousRecord.input;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
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
                        const diff = data - previousRecord.output;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
                            return `${outputText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return outputText;
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
                        const diff = data - previousRecord.cacheWrite;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
                            return `${cacheWriteText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return cacheWriteText;
                }
            },
            {
                data: 'cacheRead',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const cacheReadText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = data - previousRecord.cacheRead;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
                            return `${cacheReadText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return cacheReadText;
                }
            },
            {
                data: 'totalTokens',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const totalTokensText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = data - previousRecord.totalTokens;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
                            return `${totalTokensText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return totalTokensText;
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
                        const diff = currentCost - previousCost;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
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
                        const diff = currentCost - previousCost;
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== 0) {
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

// Included Usage統計の更新
function updateIncludedUsageStats() {
    if (includedUsageData.length === 0) return;

    // 最新のauto行のデータを取得
    const autoRecords = includedUsageData
        .filter(record => record.model.toLowerCase() === 'auto')
        .sort((a, b) => b.date - a.date);

    const latestAutoRecord = autoRecords[0];
    const previousAutoRecord = autoRecords[1]; // 前日のデータ

    if (!latestAutoRecord) {
        console.warn('No auto record found for stats');
        return;
    }

    // 前日との差を計算
    const differences = calculatePreviousDayDifference(latestAutoRecord, previousAutoRecord);

    // 最新使用日の統計を表示
    const latestUsageDateValue = document.getElementById('latest-included-usage-date-value');
    if (latestUsageDateValue) latestUsageDateValue.textContent = latestAutoRecord.dateStr;

    // Total Tokens（前日との差付き）
    const latestTotalTokensValue = document.getElementById('latest-total-tokens-value');
    if (latestTotalTokensValue) {
        const totalTokensText = latestAutoRecord.totalTokens.toLocaleString();
        const diffText = formatDifference(differences.totalTokens);
        const diffClass = getDifferenceClass(differences.totalTokens);

        if (differences.totalTokens !== null) {
            latestTotalTokensValue.innerHTML = `${totalTokensText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestTotalTokensValue.textContent = totalTokensText;
        }
    }

    // Input Tokens（前日との差付き）
    const latestInputTokensValue = document.getElementById('latest-input-tokens-value');
    if (latestInputTokensValue) {
        const inputText = latestAutoRecord.input.toLocaleString();
        const diffText = formatDifference(differences.input);
        const diffClass = getDifferenceClass(differences.input);

        if (differences.input !== null) {
            latestInputTokensValue.innerHTML = `${inputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestInputTokensValue.textContent = inputText;
        }
    }

    // Output Tokens（前日との差付き）
    const latestOutputTokensValue = document.getElementById('latest-output-tokens-value');
    if (latestOutputTokensValue) {
        const outputText = latestAutoRecord.output.toLocaleString();
        const diffText = formatDifference(differences.output);
        const diffClass = getDifferenceClass(differences.output);

        if (differences.output !== null) {
            latestOutputTokensValue.innerHTML = `${outputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestOutputTokensValue.textContent = outputText;
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
}

// Included Usage グラフの作成
function createIncludedUsageCharts() {
    if (includedUsageData.length === 0) return;

    // 新しいグラフを作成
    try {
        createInputOutputChart();
        createCostChart();
        createTotalTokensChart();
    } catch (error) {
        console.error('新しいグラフの作成中にエラーが発生しました:', error);
    }
}

// API Cost と Cost to You グラフの作成
function createCostChart() {
    try {
        if (includedUsageData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        includedUsageData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    apiCost: {},
                    costToYou: {}
                };
            }

            if (!modelData[model].apiCost[dateStr]) {
                modelData[model].apiCost[dateStr] = 0;
                modelData[model].costToYou[dateStr] = 0;
            }

            // 数値に変換（文字列の場合は0として扱う）
            const apiCost = parseFloat(record.apiCost) || 0;
            const costToYou = parseFloat(record.costToYou) || 0;

            modelData[model].apiCost[dateStr] += apiCost;
            modelData[model].costToYou[dateStr] += costToYou;
        });

        // 積立データと差分データを計算
        const cumulativeData = {};
        const diffData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            cumulativeData[model] = {
                apiCost: [],
                costToYou: []
            };
            diffData[model] = {
                apiCost: [],
                costToYou: []
            };

            let cumulativeApiCost = 0;
            let cumulativeCostToYou = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentApiCost = modelData[model].apiCost[dateStr] || 0;
                const currentCostToYou = modelData[model].costToYou[dateStr] || 0;

                // 前日までの積立値
                const previousCumulativeApiCost = cumulativeApiCost;
                const previousCumulativeCostToYou = cumulativeCostToYou;

                // 当日の増分
                const apiCostDiff = currentApiCost;
                const costToYouDiff = currentCostToYou;

                // 積立値を更新
                cumulativeApiCost += currentApiCost;
                cumulativeCostToYou += currentCostToYou;

                // データを保存
                cumulativeData[model].apiCost.push({
                    previous: previousCumulativeApiCost,
                    current: cumulativeApiCost
                });
                cumulativeData[model].costToYou.push({
                    previous: previousCumulativeCostToYou,
                    current: cumulativeCostToYou
                });

                diffData[model].apiCost.push(apiCostDiff);
                diffData[model].costToYou.push(costToYouDiff);
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
                data: cumulativeData[model].apiCost.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_apiCost`
            });

            datasets.push({
                label: `${model} - API Cost (当日増分)`,
                data: diffData[model].apiCost,
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_apiCost`
            });

            // Cost to You データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Cost to You (前日分)`,
                data: cumulativeData[model].costToYou.map(item => item.previous),
                backgroundColor: color + '20', // より薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_costToYou`
            });

            datasets.push({
                label: `${model} - Cost to You (当日増分)`,
                data: diffData[model].costToYou,
                backgroundColor: color + '60', // 中程度の色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_costToYou`
            });
        });

        // グラフを作成
        const costCtx = document.getElementById('cost-chart');
        if (!costCtx) {
            console.warn('cost-chart canvas not found');
            return;
        }

        costChart = new Chart(costCtx.getContext('2d'), {
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
                        text: 'API Cost と Cost to You 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(4)}`;
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
        console.error('Cost chart creation error:', error);
    }
}

// Total Tokens グラフの作成
function createTotalTokensChart() {
    try {
        if (includedUsageData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        includedUsageData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    totalTokens: {}
                };
            }

            if (!modelData[model].totalTokens[dateStr]) {
                modelData[model].totalTokens[dateStr] = 0;
            }

            modelData[model].totalTokens[dateStr] += record.totalTokens || 0;
        });

        // 積立データと差分データを計算
        const cumulativeData = {};
        const diffData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            cumulativeData[model] = {
                totalTokens: []
            };
            diffData[model] = {
                totalTokens: []
            };

            let cumulativeTotalTokens = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentTotalTokens = modelData[model].totalTokens[dateStr] || 0;

                // 前日までの積立値
                const previousCumulativeTotalTokens = cumulativeTotalTokens;

                // 当日の増分
                const totalTokensDiff = currentTotalTokens;

                // 積立値を更新
                cumulativeTotalTokens += currentTotalTokens;

                // データを保存
                cumulativeData[model].totalTokens.push({
                    previous: previousCumulativeTotalTokens,
                    current: cumulativeTotalTokens
                });

                diffData[model].totalTokens.push(totalTokensDiff);
            });
        });

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Total Tokens データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Total Tokens (前日分)`,
                data: cumulativeData[model].totalTokens.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_totalTokens`
            });

            datasets.push({
                label: `${model} - Total Tokens (当日増分)`,
                data: diffData[model].totalTokens,
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_totalTokens`
            });
        });

        // グラフを作成
        const totalTokensCtx = document.getElementById('total-tokens-chart');
        if (!totalTokensCtx) {
            console.warn('total-tokens-chart canvas not found');
            return;
        }

        totalTokensChart = new Chart(totalTokensCtx.getContext('2d'), {
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
                        text: 'Total Tokens 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
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
        console.error('Total Tokens chart creation error:', error);
    }
}

// Input と Output グラフの作成
function createInputOutputChart() {
    try {
        if (includedUsageData.length === 0) return;

        // 日付とモデルごとのデータを整理
        const modelData = {};

        // 日付の重複を除去してソート（日付オブジェクトに変換してからソート）
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b)
            .map(date => date.toLocaleDateString('ja-JP'));

        includedUsageData.forEach(record => {
            const model = record.model;
            const dateStr = record.dateStr;

            if (!modelData[model]) {
                modelData[model] = {
                    input: {},
                    output: {}
                };
            }

            if (!modelData[model].input[dateStr]) {
                modelData[model].input[dateStr] = 0;
                modelData[model].output[dateStr] = 0;
            }

            modelData[model].input[dateStr] += record.input || 0;
            modelData[model].output[dateStr] += record.output || 0;
        });

        // 積立データと差分データを計算
        const cumulativeData = {};
        const diffData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            cumulativeData[model] = {
                input: [],
                output: []
            };
            diffData[model] = {
                input: [],
                output: []
            };

            let cumulativeInput = 0;
            let cumulativeOutput = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentInput = modelData[model].input[dateStr] || 0;
                const currentOutput = modelData[model].output[dateStr] || 0;

                // 前日までの積立値
                const previousCumulativeInput = cumulativeInput;
                const previousCumulativeOutput = cumulativeOutput;

                // 当日の増分
                const inputDiff = currentInput;
                const outputDiff = currentOutput;

                // 積立値を更新
                cumulativeInput += currentInput;
                cumulativeOutput += currentOutput;

                // データを保存
                cumulativeData[model].input.push({
                    previous: previousCumulativeInput,
                    current: cumulativeInput
                });
                cumulativeData[model].output.push({
                    previous: previousCumulativeOutput,
                    current: cumulativeOutput
                });

                diffData[model].input.push(inputDiff);
                diffData[model].output.push(outputDiff);
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
                data: cumulativeData[model].input.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_input`
            });

            datasets.push({
                label: `${model} - Input (当日増分)`,
                data: diffData[model].input,
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_input`
            });

            // Output データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Output (前日分)`,
                data: cumulativeData[model].output.map(item => item.previous),
                backgroundColor: color + '20', // より薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_output`
            });

            datasets.push({
                label: `${model} - Output (当日増分)`,
                data: diffData[model].output,
                backgroundColor: color + '60', // 中程度の色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_output`
            });
        });

        // グラフを作成
        const inputOutputCtx = document.getElementById('input-output-chart');
        if (!inputOutputCtx) {
            console.warn('input-output-chart canvas not found');
            return;
        }

        inputOutputChart = new Chart(inputOutputCtx.getContext('2d'), {
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
                        text: 'Input と Output 積立推移'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()}`;
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
        console.error('Input/Output chart creation error:', error);
    }
}
