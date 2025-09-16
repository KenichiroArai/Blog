// グローバル変数
let usageEventsTable;
let usageEventsTokensLargeChart;
let usageEventsTokensSmallChart;
let usageEventsCountChart;
let usageEventsAvgMaxChart;

// CSVファイル読み込み
async function loadUsageEventsData() {
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/usage-events.csv' : '../Tool/AllRawEvents/data/usage-events.csv';

        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSVファイルが空またはヘッダーのみです');
        }

        const headers = lines[0].split(',').map(header => header.trim());
        const rawData = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // CSVの値を正しく分割（カンマを含む値に対応）
            const values = parseCSVLine(line);
            if (values.length >= headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] ? values[index].trim() : '';
                });
                rawData.push(record);
            }
        }

        // データの整形
        usageEventsData = rawData.map(record => ({
            ...record,
            Date: new Date(record.Date),
            'Input (w/ Cache Write)': parseInt(record['Input (w/ Cache Write)']) || 0,
            'Input (w/o Cache Write)': parseInt(record['Input (w/o Cache Write)']) || 0,
            'Cache Read': parseInt(record['Cache Read']) || 0,
            'Output Tokens': parseInt(record['Output Tokens']) || 0,
            'Total Tokens': parseInt(record['Total Tokens']) || 0,
            'Cost': record['Cost'] || 'Included'
        })).filter(record => !isNaN(record.Date.getTime())); // 無効な日付を除外

        // 日付順にソート
        usageEventsData.sort((a, b) => a.Date - b.Date);

        console.log('Usage Events data loaded:', usageEventsData.length, 'records');
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
        throw new Error('CSVファイルの読み込みに失敗しました: ' + error.message);
    }
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

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUsageEventsData();
        initializeUsageEventsTable();
        updateUsageEventsStats();
        createUsageEventsCharts();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (usageEventsData.length > 0) {
                initializeUsageEventsTable();
                updateUsageEventsStats();
                createUsageEventsCharts();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});

// Usage Events DataTableの初期化
function initializeUsageEventsTable() {
    usageEventsTable = $('#usage-events-table').DataTable({
        data: usageEventsData,
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
            {
                data: 'Kind',
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
            { data: 'Model' },
            { data: 'Max Mode' },
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
                data: 'Output Tokens',
                render: function(data) {
                    return data ? data.toLocaleString() : '0';
                }
            },
            {
                data: 'Total Tokens',
                render: function(data) {
                    const className = data > 1000000 ? 'tokens-high' : data > 100000 ? 'tokens-medium' : 'tokens-low';
                    return `<span class="${className}">${data.toLocaleString()}</span>`;
                }
            },
            { data: 'Cost' }
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

// Usage Events グラフの作成
function createUsageEventsCharts() {
    // 日別データの集計
    const dailyData = {};
    usageEventsData.forEach(record => {
        const dateStr = record.Date.toLocaleDateString('ja-JP');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total: 0,
                count: 0,
                max: 0,
                inputTotal: 0,
                outputTotal: 0,
                cacheReadTotal: 0,
                successful: 0,
                error: 0
            };
        }
        dailyData[dateStr].total += record['Total Tokens'] || 0;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].max = Math.max(dailyData[dateStr].max, record['Total Tokens'] || 0);
        dailyData[dateStr].inputTotal += (record['Input (w/ Cache Write)'] || 0) + (record['Input (w/o Cache Write)'] || 0);
        dailyData[dateStr].outputTotal += record['Output Tokens'] || 0;
        dailyData[dateStr].cacheReadTotal += record['Cache Read'] || 0;

        if (record.Kind === 'Included') {
            dailyData[dateStr].successful++;
        } else if (record.Kind.includes('Errored')) {
            dailyData[dateStr].error++;
        }
    });

    const dates = Object.keys(dailyData)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b)
        .map(date => date.toLocaleDateString('ja-JP'));
    const dailyTotals = dates.map(date => dailyData[date].total);
    const dailyAverages = dates.map(date => Math.round(dailyData[date].total / dailyData[date].count));
    const dailyMaxs = dates.map(date => dailyData[date].max);
    const dailyInputs = dates.map(date => dailyData[date].inputTotal);
    const dailyOutputs = dates.map(date => dailyData[date].outputTotal);
    const dailyCacheReads = dates.map(date => dailyData[date].cacheReadTotal);
    const dailySuccessful = dates.map(date => dailyData[date].successful);
    const dailyError = dates.map(date => dailyData[date].error);

    // 1. トークン使用量グラフ（大きな値）
    createTokensLargeChart(dates, dailyTotals, dailyInputs, dailyOutputs);

    // 2. トークン使用量グラフ（小さな値）
    createTokensSmallChart(dates, dailyCacheReads);

    // 3. イベント数グラフ
    createCountChart(dates, dailySuccessful, dailyError);

    // 4. 平均・最大値グラフ
    createAvgMaxChart(dates, dailyAverages, dailyMaxs);
}

// トークン使用量グラフ（大きな値）
function createTokensLargeChart(dates, dailyTotals, dailyInputs, dailyOutputs) {
    const ctx = document.getElementById('usage-events-tokens-large-chart').getContext('2d');
    usageEventsTokensLargeChart = new Chart(ctx, {
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
                label: '日別入力トークン数',
                data: dailyInputs,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: false
            }, {
                label: '日別出力トークン数',
                data: dailyOutputs,
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
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
                    text: 'トークン使用量（大きな値）'
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
                    display: true,
                    title: {
                        display: true,
                        text: 'トークン数'
                    },
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

// トークン使用量グラフ（小さな値）
function createTokensSmallChart(dates, dailyCacheReads) {
    const ctx = document.getElementById('usage-events-tokens-small-chart').getContext('2d');
    usageEventsTokensSmallChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '日別キャッシュ読み取り数',
                data: dailyCacheReads,
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'トークン使用量（小さな値）'
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
                    display: true,
                    title: {
                        display: true,
                        text: 'トークン数'
                    },
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

// イベント数グラフ
function createCountChart(dates, dailySuccessful, dailyError) {
    const ctx = document.getElementById('usage-events-count-chart').getContext('2d');
    usageEventsCountChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: '日別成功イベント数',
                data: dailySuccessful,
                backgroundColor: 'rgba(32, 201, 151, 0.8)',
                borderColor: '#20c997',
                borderWidth: 1
            }, {
                label: '日別エラーイベント数',
                data: dailyError,
                backgroundColor: 'rgba(232, 62, 140, 0.8)',
                borderColor: '#e83e8c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'イベント数'
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
                    display: true,
                    title: {
                        display: true,
                        text: 'イベント数'
                    },
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

// 平均・最大値グラフ
function createAvgMaxChart(dates, dailyAverages, dailyMaxs) {
    const ctx = document.getElementById('usage-events-avg-max-chart').getContext('2d');
    usageEventsAvgMaxChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '日別平均トークン数',
                data: dailyAverages,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
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
                    text: '平均・最大値'
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
                    display: true,
                    title: {
                        display: true,
                        text: 'トークン数'
                    },
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

// 統計情報の更新（usage-events.js専用）
function updateUsageEventsStats() {
    if (usageEventsData.length === 0) return;

    // 日別データの集計
    const dailyData = {};
    usageEventsData.forEach(record => {
        const dateStr = record.Date.toLocaleDateString('ja-JP');
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                total: 0,
                count: 0,
                max: 0,
                inputTotal: 0,
                outputTotal: 0,
                cacheReadTotal: 0,
                successful: 0,
                error: 0
            };
        }
        dailyData[dateStr].total += record['Total Tokens'] || 0;
        dailyData[dateStr].count += 1;
        dailyData[dateStr].max = Math.max(dailyData[dateStr].max, record['Total Tokens'] || 0);
        dailyData[dateStr].inputTotal += (record['Input (w/ Cache Write)'] || 0) + (record['Input (w/o Cache Write)'] || 0);
        dailyData[dateStr].outputTotal += record['Output Tokens'] || 0;
        dailyData[dateStr].cacheReadTotal += record['Cache Read'] || 0;

        if (record.Kind === 'Included') {
            dailyData[dateStr].successful++;
        } else if (record.Kind.includes('Errored')) {
            dailyData[dateStr].error++;
        }
    });

    // 最新使用日のデータを取得
    const dates = Object.keys(dailyData)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b)
        .map(date => date.toLocaleDateString('ja-JP'));
    const latestDate = dates[dates.length - 1];
    const latestDailyData = dailyData[latestDate];

    if (latestDailyData) {
        const dailyTotalTokens = latestDailyData.total;
        const dailyAvgTokens = Math.round(latestDailyData.total / latestDailyData.count);
        const dailyMaxTokens = latestDailyData.max;
        const dailyInputTokens = latestDailyData.inputTotal;
        const dailyOutputTokens = latestDailyData.outputTotal;
        const dailyCacheReadTokens = latestDailyData.cacheReadTotal;
        const totalEvents = usageEventsData.length;
        const successfulEvents = usageEventsData.filter(row => row.Kind === 'Included').length;
        const errorEvents = usageEventsData.filter(row => row.Kind.includes('Errored')).length;
        const totalTokens = usageEventsData.reduce((sum, row) => {
            const tokens = parseInt(row['Total Tokens']) || 0;
            return sum + tokens;
        }, 0);

        // 最新使用日の統計を表示
        const latestUsageDateValue = document.getElementById('latest-usage-date-value');
        if (latestUsageDateValue) latestUsageDateValue.textContent = latestDate;

        const totalEventsValue = document.getElementById('total-events-value');
        if (totalEventsValue) totalEventsValue.textContent = totalEvents.toLocaleString();

        const successfulEventsValue = document.getElementById('successful-events-value');
        if (successfulEventsValue) successfulEventsValue.textContent = successfulEvents.toLocaleString();

        const errorEventsValue = document.getElementById('error-events-value');
        if (errorEventsValue) errorEventsValue.textContent = errorEvents.toLocaleString();

        const totalTokensValue = document.getElementById('total-tokens-value');
        if (totalTokensValue) totalTokensValue.textContent = totalTokens.toLocaleString();

        const latestInputWithCacheValue = document.getElementById('latest-input-with-cache-value');
        if (latestInputWithCacheValue) latestInputWithCacheValue.textContent = dailyInputTokens.toLocaleString();

        const latestInputWithoutCacheValue = document.getElementById('latest-input-without-cache-value');
        if (latestInputWithoutCacheValue) latestInputWithoutCacheValue.textContent = '0';

        const latestCacheReadValue = document.getElementById('latest-cache-read-value');
        if (latestCacheReadValue) latestCacheReadValue.textContent = dailyCacheReadTokens.toLocaleString();

        const latestOutputTokensValue = document.getElementById('latest-output-tokens-value');
        if (latestOutputTokensValue) latestOutputTokensValue.textContent = dailyOutputTokens.toLocaleString();

        const latestCostValue = document.getElementById('latest-cost-value');
        if (latestCostValue) latestCostValue.textContent = 'Included';
    }
}

