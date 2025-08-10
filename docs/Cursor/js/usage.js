// グローバル変数
let usageTable;
let usageDailyChart;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUsageData();
        initializeUsageTable();
        updateUsageStats();
        createUsageCharts();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (usageData.length > 0) {
                initializeUsageTable();
                updateUsageStats();
                createUsageCharts();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});

// Usage DataTableの初期化
function initializeUsageTable() {
    usageTable = $('#usage-table').DataTable({
        data: usageData,
        columns: [
            {
                data: 'Date',
                render: function(data) {
                    return data.toLocaleDateString('ja-JP') + ' ' + data.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
            },
            { data: 'User' },
            { data: 'Kind' },
            { data: 'Max Mode' },
            { data: 'Model' },
            {
                data: 'Total Tokens',
                render: function(data) {
                    const className = data > 1000000 ? 'tokens-high' : data > 100000 ? 'tokens-medium' : 'tokens-low';
                    return `<span class="${className}">${data.toLocaleString()}</span>`;
                }
            },
            {
                data: 'Input (w/ Cache Write)',
                render: function(data) {
                    return data ? data.toLocaleString() : '0';
                }
            },
            {
                data: 'Input (w/o Cache Write)',
                render: function(data) {
                    return data ? data.toLocaleString() : '0';
                }
            },
            {
                data: 'Cache Read',
                render: function(data) {
                    return data ? data.toLocaleString() : '0';
                }
            },
            {
                data: 'Output',
                render: function(data) {
                    return data ? data.toLocaleString() : '0';
                }
            },
            { data: 'Cost ($)' }
        ],
        order: [[0, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: true,
        pageLength: 25,
        scrollX: true
    });
}

// Usage グラフの作成
function createUsageCharts() {
    // 日別データの集計
    const dailyData = {};
    usageData.forEach(record => {
        const dateStr = record.Date.toLocaleDateString('ja-JP');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total: 0,
                count: 0,
                max: 0,
                inputTotal: 0,
                outputTotal: 0,
                cacheReadTotal: 0
            };
        }
        dailyData[dateStr].total += record['Total Tokens'] || record.Tokens || 0;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].max = Math.max(dailyData[dateStr].max, record['Total Tokens'] || record.Tokens || 0);
        dailyData[dateStr].inputTotal += (record['Input (w/ Cache Write)'] || 0) + (record['Input (w/o Cache Write)'] || 0);
        dailyData[dateStr].outputTotal += record['Output'] || 0;
        dailyData[dateStr].cacheReadTotal += record['Cache Read'] || 0;
    });

    const dates = Object.keys(dailyData).sort();
    const dailyTotals = dates.map(date => dailyData[date].total);
    const dailyAverages = dates.map(date => Math.round(dailyData[date].total / dailyData[date].count));
    const dailyMaxs = dates.map(date => dailyData[date].max);
    const dailyInputs = dates.map(date => dailyData[date].inputTotal);
    const dailyOutputs = dates.map(date => dailyData[date].outputTotal);
    const dailyCacheReads = dates.map(date => dailyData[date].cacheReadTotal);

    // 日別トークン使用量グラフ
    const usageDailyCtx = document.getElementById('usage-daily-chart').getContext('2d');
    usageDailyChart = new Chart(usageDailyCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '日別総トークン数',
                data: dailyTotals,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            }, {
                label: '日別平均トークン数',
                data: dailyAverages,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            }, {
                label: '日別最大トークン数',
                data: dailyMaxs,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y'
            }, {
                label: '日別入力トークン数',
                data: dailyInputs,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }, {
                label: '日別出力トークン数',
                data: dailyOutputs,
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }, {
                label: '日別キャッシュ読み取り数',
                data: dailyCacheReads,
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '日別トークン使用量（統合データ）'
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
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
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
                    display: true,
                    title: {
                        display: true,
                        text: '日付'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '総トークン数'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '入力/出力/キャッシュトークン数'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// 統計情報の更新（usage.js専用）
function updateUsageStats() {
    if (usageData.length === 0) return;

    // 日別データの集計
    const dailyData = {};
    usageData.forEach(record => {
        const dateStr = record.Date.toLocaleDateString('ja-JP');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total: 0,
                count: 0,
                max: 0,
                inputTotal: 0,
                outputTotal: 0,
                cacheReadTotal: 0
            };
        }
        dailyData[dateStr].total += record['Total Tokens'] || record.Tokens || 0;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].max = Math.max(dailyData[dateStr].max, record['Total Tokens'] || record.Tokens || 0);
        dailyData[dateStr].inputTotal += (record['Input (w/ Cache Write)'] || 0) + (record['Input (w/o Cache Write)'] || 0);
        dailyData[dateStr].outputTotal += record['Output'] || 0;
        dailyData[dateStr].cacheReadTotal += record['Cache Read'] || 0;
    });

    // 最新使用日のデータを取得
    const dates = Object.keys(dailyData).sort();
    const latestDate = dates[dates.length - 1];
    const latestDailyData = dailyData[latestDate];

    if (latestDailyData) {
        const dailyTotalTokens = latestDailyData.total;
        const dailyAvgTokens = Math.round(latestDailyData.total / latestDailyData.count);
        const dailyMaxTokens = latestDailyData.max;
        const dailyInputTokens = latestDailyData.inputTotal;
        const dailyOutputTokens = latestDailyData.outputTotal;
        const dailyCacheReadTokens = latestDailyData.cacheReadTotal;

        // 最新使用日の統計を表示
        const latestUsageDateValue = document.getElementById('latest-usage-date-value');
        if (latestUsageDateValue) latestUsageDateValue.textContent = latestDate;
        const dailyTotalTokensValue = document.getElementById('daily-total-tokens-value');
        if (dailyTotalTokensValue) dailyTotalTokensValue.textContent = dailyTotalTokens.toLocaleString();
        const dailyAvgTokensValue = document.getElementById('daily-avg-tokens-value');
        if (dailyAvgTokensValue) dailyAvgTokensValue.textContent = dailyAvgTokens.toLocaleString();
        const dailyMaxTokensValue = document.getElementById('daily-max-tokens-value');
        if (dailyMaxTokensValue) dailyMaxTokensValue.textContent = dailyMaxTokens.toLocaleString();

        // 新しい統計項目を追加
        const dailyInputTokensValue = document.getElementById('daily-input-tokens-value');
        if (dailyInputTokensValue) dailyInputTokensValue.textContent = dailyInputTokens.toLocaleString();
        const dailyOutputTokensValue = document.getElementById('daily-output-tokens-value');
        if (dailyOutputTokensValue) dailyOutputTokensValue.textContent = dailyOutputTokens.toLocaleString();
        const dailyCacheReadTokensValue = document.getElementById('daily-cache-read-tokens-value');
        if (dailyCacheReadTokensValue) dailyCacheReadTokensValue.textContent = dailyCacheReadTokens.toLocaleString();

        // 総レコード数を表示
        const totalRecordsValue = document.getElementById('total-records-value');
        if (totalRecordsValue) totalRecordsValue.textContent = usageData.length.toLocaleString();
    }
}
