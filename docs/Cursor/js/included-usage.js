// グローバル変数
let includedUsageTable;
let includedUsageChart;

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
                className: 'text-end',
                render: function(data) {
                    return data.toLocaleDateString('ja-JP');
                }
            },
            {
                data: 'model',
                className: 'text-start'
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
                className: 'text-end'
            },
            {
                data: 'costToYou',
                className: 'text-end',
                render: function(data) {
                    return data || '0';
                }
            }
        ],
        order: [[0, 'desc']],
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

    // 最新のデータを取得
    const latest = includedUsageData[includedUsageData.length - 1];
    if (!latest) return;

    // 最新使用日の統計を表示
    const latestUsageDateValue = document.getElementById('latest-included-usage-date-value');
    if (latestUsageDateValue) latestUsageDateValue.textContent = latest.dateStr;

    const latestTotalTokensValue = document.getElementById('latest-total-tokens-value');
    if (latestTotalTokensValue) latestTotalTokensValue.textContent = latest.totalTokens.toLocaleString();

    const latestInputTokensValue = document.getElementById('latest-input-tokens-value');
    if (latestInputTokensValue) latestInputTokensValue.textContent = latest.input.toLocaleString();

    const latestOutputTokensValue = document.getElementById('latest-output-tokens-value');
    if (latestOutputTokensValue) latestOutputTokensValue.textContent = latest.output.toLocaleString();

    const latestApiCostValue = document.getElementById('latest-api-cost-value');
    if (latestApiCostValue) latestApiCostValue.textContent = latest.apiCost;
}

// Included Usage グラフの作成
function createIncludedUsageCharts() {
    if (includedUsageData.length === 0) return;

    // 日別データの集計
    const dailyData = {};
    let currentMonth = null;
    let cumulativeInput = 0;
    let cumulativeOutput = 0;
    let cumulativeTotalTokens = 0;

    includedUsageData.forEach(record => {
        const dateStr = record.dateStr;
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                totalTokens: 0,
                input: 0,
                output: 0,
                cacheWrite: 0,
                cacheRead: 0,
                count: 0,
                cumulativeInput: 0,
                cumulativeOutput: 0,
                cumulativeTotalTokens: 0
            };
        }

        // 月が変わった場合、累積値をリセット
        if (currentMonth !== null && record.month !== currentMonth) {
            cumulativeInput = 0;
            cumulativeOutput = 0;
            cumulativeTotalTokens = 0;
        }

        currentMonth = record.month;

        // 累積値を更新
        cumulativeInput += record.input;
        cumulativeOutput += record.output;
        cumulativeTotalTokens += record.totalTokens;

        dailyData[dateStr].totalTokens += record.totalTokens;
        dailyData[dateStr].input += record.input;
        dailyData[dateStr].output += record.output;
        dailyData[dateStr].cacheWrite += record.cacheWrite;
        dailyData[dateStr].cacheRead += record.cacheRead;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].cumulativeInput = cumulativeInput;
        dailyData[dateStr].cumulativeOutput = cumulativeOutput;
        dailyData[dateStr].cumulativeTotalTokens = cumulativeTotalTokens;
    });

    const dates = Object.keys(dailyData).sort();
    const dailyTotalTokens = dates.map(date => dailyData[date].totalTokens);
    const dailyInput = dates.map(date => dailyData[date].input);
    const dailyOutput = dates.map(date => dailyData[date].output);
    const dailyCacheWrite = dates.map(date => dailyData[date].cacheWrite);
    const dailyCacheRead = dates.map(date => dailyData[date].cacheRead);
    const cumulativeInputData = dates.map(date => dailyData[date].cumulativeInput);
    const cumulativeOutputData = dates.map(date => dailyData[date].cumulativeOutput);

    // Included Usage グラフ
    const includedUsageCtx = document.getElementById('included-usage-chart').getContext('2d');
    includedUsageChart = new Chart(includedUsageCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Total Tokens (日別)',
                data: dailyTotalTokens,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Input (日別)',
                data: dailyInput,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Output (日別)',
                data: dailyOutput,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            }, {
                label: 'Input (累積)',
                data: cumulativeInputData,
                borderColor: '#20c997',
                backgroundColor: 'rgba(32, 201, 151, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
                borderDash: [5, 5]
            }, {
                label: 'Output (累積)',
                data: cumulativeOutputData,
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Included Usage Summary 推移'
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
}
