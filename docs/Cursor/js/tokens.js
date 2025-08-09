// グローバル変数
let tokensTable;
let tokensDailyChart;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadTokensData();
        initializeTokensTable();
        updateTokensStats();
        createTokensCharts();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (tokensData.length > 0) {
                initializeTokensTable();
                updateTokensStats();
                createTokensCharts();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});

// Tokens DataTableの初期化
function initializeTokensTable() {
    tokensTable = $('#tokens-table').DataTable({
        data: tokensData,
        columns: [
            {
                data: 'Date',
                render: function(data) {
                    return data.toLocaleDateString('ja-JP');
                }
            },
            { data: 'User' },
            { data: 'Kind' },
            { data: 'Max Mode' },
            { data: 'Model' },
            {
                data: 'Tokens',
                render: function(data) {
                    const className = data > 1000000 ? 'tokens-high' : data > 100000 ? 'tokens-medium' : 'tokens-low';
                    return `<span class="${className}">${data.toLocaleString()}</span>`;
                }
            },
            { data: 'Cost ($)' }
        ],
        order: [[0, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: true,
        pageLength: 25
    });
}

// Tokens グラフの作成
function createTokensCharts() {
    // 日別データの集計
    const dailyData = {};
    tokensData.forEach(record => {
        const dateStr = record.Date.toLocaleDateString('ja-JP');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total: 0,
                count: 0,
                max: 0
            };
        }
        dailyData[dateStr].total += record.Tokens;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].max = Math.max(dailyData[dateStr].max, record.Tokens);
    });

    const dates = Object.keys(dailyData).sort();
    const dailyTotals = dates.map(date => dailyData[date].total);
    const dailyAverages = dates.map(date => Math.round(dailyData[date].total / dailyData[date].count));
    const dailyMaxs = dates.map(date => dailyData[date].max);

    // 日別トークン使用量グラフ
    const tokensDailyCtx = document.getElementById('tokens-daily-chart').getContext('2d');
    tokensDailyChart = new Chart(tokensDailyCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '日別総トークン数',
                data: dailyTotals,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: '日別平均トークン数',
                data: dailyAverages,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: false
            }, {
                label: '日別最大トークン数',
                data: dailyMaxs,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '日別トークン使用量'
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
