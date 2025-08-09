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

// Included Usage DataTableの初期化
function initializeIncludedUsageTable() {
    includedUsageTable = $('#included-usage-table').DataTable({
        data: includedUsageData,
        columns: [
            {
                data: 'date',
                title: '日付',
                render: function(data) {
                    return data.toLocaleDateString('ja-JP');
                }
            },
            {
                data: 'model',
                title: 'モデル'
            },
            {
                data: 'input',
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleString();
                }
            },
            {
                data: 'output',
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleString();
                }
            },
            {
                data: 'cacheWrite',
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleString();
                }
            },
            {
                data: 'cacheRead',
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleString();
                }
            },
            {
                data: 'totalTokens',
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleString();
                }
            },
            {
                data: 'apiCost',
                className: 'text-end',
                render: function(data) {
                    return data;
                }
            },
            {
                data: 'costToYou',
                className: 'text-end',
                render: function(data) {
                    // Cost to Youが0、空、未定義、またはNaNの場合は何も表示しない
                    if (data === null || data === undefined || data === '' || data === 0 || data === '0') {
                        return '0';
                    }
                    const cost = parseFloat(data);
                    return (cost === 0 || isNaN(cost)) ? '' : data.toString();
                }
            }
        ],
        order: [[0, 'desc'], [1, 'asc']], // 日付の降順、次にモデルの昇順
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: true,
        pageLength: 25
    });
}

// Included Usage統計の更新
function updateIncludedUsageStats() {
    if (includedUsageData.length === 0) return;

    // 最新のauto行のデータを取得
    const latestAutoRecord = includedUsageData
        .filter(record => record.model.toLowerCase() === 'auto')
        .sort((a, b) => b.date - a.date)[0];

    if (!latestAutoRecord) {
        console.warn('No auto record found for stats');
        return;
    }

    // 最新使用日の統計を表示
    const latestUsageDateValue = document.getElementById('latest-included-usage-date-value');
    if (latestUsageDateValue) latestUsageDateValue.textContent = latestAutoRecord.dateStr;

    const latestTotalTokensValue = document.getElementById('latest-total-tokens-value');
    if (latestTotalTokensValue) latestTotalTokensValue.textContent = latestAutoRecord.totalTokens.toLocaleString();

    const latestInputTokensValue = document.getElementById('latest-input-tokens-value');
    if (latestInputTokensValue) latestInputTokensValue.textContent = latestAutoRecord.input.toLocaleString();

    const latestOutputTokensValue = document.getElementById('latest-output-tokens-value');
    if (latestOutputTokensValue) latestOutputTokensValue.textContent = latestAutoRecord.output.toLocaleString();

    const latestApiCostValue = document.getElementById('latest-api-cost-value');
    if (latestApiCostValue) latestApiCostValue.textContent = latestAutoRecord.apiCost;
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

        // 日付の重複を除去してソート
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))].sort();

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

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];
        const models = Object.keys(modelData);

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // API Cost データセット
            const apiCostData = uniqueDates.map(dateStr => modelData[model].apiCost[dateStr] || 0);
            datasets.push({
                label: `${model} - API Cost`,
                data: apiCostData,
                borderColor: color,
                backgroundColor: color + '1a', // 透明度を追加
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            });

            // Cost to You データセット
            const costToYouData = uniqueDates.map(dateStr => modelData[model].costToYou[dateStr] || 0);
            datasets.push({
                label: `${model} - Cost to You`,
                data: costToYouData,
                borderColor: color,
                backgroundColor: color + '1a', // 透明度を追加
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
                borderDash: [5, 5]
            });
        });

        // グラフを作成
        const costCtx = document.getElementById('cost-chart');
        if (!costCtx) {
            console.warn('cost-chart canvas not found');
            return;
        }

        costChart = new Chart(costCtx.getContext('2d'), {
            type: 'line',
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
                        text: 'API Cost と Cost to You 推移'
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
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
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

        // 日付の重複を除去してソート
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))].sort();

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

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];
        const models = Object.keys(modelData);

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            const totalTokensData = uniqueDates.map(dateStr => modelData[model].totalTokens[dateStr] || 0);
            datasets.push({
                label: `${model} - Total Tokens`,
                data: totalTokensData,
                borderColor: color,
                backgroundColor: color + '1a', // 透明度を追加
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            });
        });

        // グラフを作成
        const totalTokensCtx = document.getElementById('total-tokens-chart');
        if (!totalTokensCtx) {
            console.warn('total-tokens-chart canvas not found');
            return;
        }

        totalTokensChart = new Chart(totalTokensCtx.getContext('2d'), {
            type: 'line',
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
                        text: 'Total Tokens 推移'
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
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
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

        // 日付の重複を除去してソート
        const uniqueDates = [...new Set(includedUsageData.map(record => record.dateStr))].sort();

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

        // グラフデータセットを作成
        const datasets = [];
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];
        const models = Object.keys(modelData);

        models.forEach((model, index) => {
            const color = colors[index % colors.length];

            // Input データセット
            const inputData = uniqueDates.map(dateStr => modelData[model].input[dateStr] || 0);
            datasets.push({
                label: `${model} - Input`,
                data: inputData,
                borderColor: color,
                backgroundColor: color + '1a', // 透明度を追加
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            });

            // Output データセット
            const outputData = uniqueDates.map(dateStr => modelData[model].output[dateStr] || 0);
            datasets.push({
                label: `${model} - Output`,
                data: outputData,
                borderColor: color,
                backgroundColor: color + '1a', // 透明度を追加
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
                borderDash: [5, 5]
            });
        });

        // グラフを作成
        const inputOutputCtx = document.getElementById('input-output-chart');
        if (!inputOutputCtx) {
            console.warn('input-output-chart canvas not found');
            return;
        }

        inputOutputChart = new Chart(inputOutputCtx.getContext('2d'), {
            type: 'line',
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
                        text: 'Input と Output 推移'
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
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
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
