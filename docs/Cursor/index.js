// グローバル変数
let recordsData = [];
let tokensData = [];
let dataTable;
let tokensTable;
let combinedLinesChart, tabsAcceptedChart;
let tokensDailyChart, tokensCumulativeChart;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadExcelFile();
        await loadTokensData();
        initializeDataTable();
        initializeTokensTable();
        updateLatestRecord();
        updateTokensStats();
        createCharts();
        createTokensCharts();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (recordsData.length > 0) {
                initializeDataTable();
                updateLatestRecord();
                createCharts();
            }
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

// Excelファイル読み込み
async function loadExcelFile() {
    showLoading(true);
    try {
        const response = await fetch('record.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        recordsData = XLSX.utils.sheet_to_json(firstSheet);

        // デバッグ用：最初のレコードの構造を確認
        console.log('最初のレコードの構造:', recordsData[0]);

        // データの整形
        recordsData = recordsData.map(record => ({
            ...record,
            記録日: formatDate(record.記録日),
            日数: parseInt(record.日数) || 0,
            'Fast requests will refresh in X day': parseInt(record['Fast requests will refresh in X day']) || 0,
            'Suggested Lines: X lines': parseInt(record['Suggested Lines: X lines']) || 0,
            'Accepted Lines: X Lines': parseInt(record['Accepted Lines: X Lines']) || 0,
            'Tabs Accepted: X tabs': parseInt(record['Tabs Accepted: X tabs']) || 0
        }));
    } catch (error) {
        throw new Error('Excelファイルの読み込みに失敗しました');
    } finally {
        showLoading(false);
    }
}

// CSVファイル読み込み
async function loadTokensData() {
    try {
        const response = await fetch('Tool/AllRawEvents/data/usage-tokens.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSVファイルが空またはヘッダーのみです');
        }

        const headers = lines[0].split(',').map(header => header.trim());
        tokensData = [];

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
                tokensData.push(record);
            }
        }

        // データの整形
        tokensData = tokensData.map(record => ({
            ...record,
            Date: new Date(record.Date),
            Tokens: parseInt(record.Tokens) || 0,
            'Cost ($)': record['Cost ($)'] || 'Included'
        })).filter(record => !isNaN(record.Date.getTime())); // 無効な日付を除外

        // 日付順にソート
        tokensData.sort((a, b) => a.Date - b.Date);

        console.log('Tokens data loaded:', tokensData.length, 'records');
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
        throw new Error('CSVファイルの読み込みに失敗しました: ' + error.message);
    }
}

// CSV行を正しくパースする関数
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
    return result.map(item => item.replace(/^"|"$/g, '')); // 引用符を除去
}

// DataTablesの初期化
function initializeDataTable() {
    dataTable = $('#records-table').DataTable({
        data: recordsData,
        columns: [
            { data: '番号' },
            { data: '記録日' },
            { data: '日数' },
            { data: 'Fast requests will refresh in X day' },
            { data: 'Suggested Lines: X lines' },
            { data: 'Accepted Lines: X Lines' },
            { data: 'Tabs Accepted: X tabs' }
        ],
        order: [[0, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: true
    });
}

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

// グラフの作成
function createCharts() {
    const labels = recordsData.map(record => record.記録日);
    const suggestedLinesData = recordsData.map(record => record['Suggested Lines: X lines']);
    const acceptedLinesData = recordsData.map(record => record['Accepted Lines: X Lines']);
    const tabsAcceptedData = recordsData.map(record => record['Tabs Accepted: X tabs']);

    // Combined Lines グラフ
    const combinedLinesCtx = document.getElementById('combined-lines-chart').getContext('2d');
    combinedLinesChart = new Chart(combinedLinesCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Suggested Lines',
                data: suggestedLinesData,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Accepted Lines',
                data: acceptedLinesData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
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
                    text: 'Suggested Lines & Accepted Lines 推移'
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
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const element = elements[0];
                    const index = element.index;
                    const datasetIndex = element.datasetIndex;
                    const date = labels[index];
                    const value = element.parsed.y;
                    const label = element.dataset.label;

                    showGraphDetail(date, label, value);
                }
            }
        }
    });

    // Tabs Accepted グラフ
    const tabsAcceptedCtx = document.getElementById('tabs-accepted-chart').getContext('2d');
    tabsAcceptedChart = new Chart(tabsAcceptedCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tabs Accepted',
                data: tabsAcceptedData,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
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
                    text: 'Tabs Accepted 推移'
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
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const element = elements[0];
                    const index = element.index;
                    const datasetIndex = element.datasetIndex;
                    const date = labels[index];
                    const value = element.parsed.y;
                    const label = element.dataset.label;

                    showGraphDetail(date, label, value);
                }
            }
        }
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

    // 累積データの計算
    const cumulativeData = [];
    let cumulative = 0;
    dates.forEach(date => {
        cumulative += dailyData[date].total;
        cumulativeData.push(cumulative);
    });

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

    // 累積トークン使用量グラフ
    const tokensCumulativeCtx = document.getElementById('tokens-cumulative-chart').getContext('2d');
    tokensCumulativeChart = new Chart(tokensCumulativeCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '累積トークン数',
                data: cumulativeData,
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
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
                    text: '累積トークン使用量'
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

// グラフ詳細情報表示
function showGraphDetail(date, label, value) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('graph-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'graph-detail-modal';
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">詳細情報</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p><strong>日付:</strong> ${date}</p>
                    <p><strong>項目:</strong> ${label}</p>
                    <p><strong>値:</strong> ${value.toLocaleString()}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
                </div>
            </div>
        </div>
    `;

    // モーダルを表示
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // モーダルが閉じられたら要素を削除
    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}

// 最新の記録を表示
function updateLatestRecord() {
    const latest = recordsData[recordsData.length - 1];
    if (!latest) return;

    const days = latest.日数;
    const fastRequestsDays = latest['Fast requests will refresh in X day'];
    const suggestedLines = latest['Suggested Lines: X lines'];
    const acceptedLines = latest['Accepted Lines: X Lines'];
    const tabsAccepted = latest['Tabs Accepted: X tabs'];

    // 固定値
    const totalDays = 30;

    // パーセンテージ計算
    const daysPercentage = (days / totalDays * 100).toFixed(2);
    const remainingDays = totalDays - days;

    // プログレスバーの更新
    updateProgressBar('days-progress', daysPercentage, `${days}日 / ${totalDays}日`);

    // 使用情報のテキスト作成
    const usageInfo = `Suggested Lines: ${suggestedLines.toLocaleString()}\nAccepted Lines: ${acceptedLines.toLocaleString()}\nTabs Accepted: ${tabsAccepted}\nFast requests will refresh in ${fastRequestsDays} day`;

    // 表示
    document.getElementById('latest-usage-info').textContent = usageInfo;

    // 使用統計の表示
    const suggestedLinesElem = document.getElementById('suggested-lines-value');
    if (suggestedLinesElem) suggestedLinesElem.textContent = suggestedLines.toLocaleString();
    const acceptedLinesElem = document.getElementById('accepted-lines-value');
    if (acceptedLinesElem) acceptedLinesElem.textContent = acceptedLines.toLocaleString();
    const tabsAcceptedElem = document.getElementById('tabs-accepted-value');
    if (tabsAcceptedElem) tabsAcceptedElem.textContent = String(tabsAccepted);
}

// Tokens統計の更新
function updateTokensStats() {
    if (tokensData.length === 0) return;

    const totalTokens = tokensData.reduce((sum, record) => sum + record.Tokens, 0);
    const avgTokens = Math.round(totalTokens / tokensData.length);
    const maxTokens = Math.max(...tokensData.map(record => record.Tokens));

    // 使用日数の計算
    const uniqueDates = new Set(tokensData.map(record => record.Date.toDateString()));
    const daysCount = uniqueDates.size;

    // 最新の記録
    const latestToken = tokensData[tokensData.length - 1];

    // 統計の表示
    document.getElementById('total-tokens-value').textContent = totalTokens.toLocaleString();
    document.getElementById('avg-tokens-value').textContent = avgTokens.toLocaleString();
    document.getElementById('max-tokens-value').textContent = maxTokens.toLocaleString();
    document.getElementById('tokens-days-value').textContent = daysCount;

    // 最新の使用情報
    const latestTokensInfo = `最新使用日: ${latestToken.Date.toLocaleDateString('ja-JP')}\n最新トークン数: ${latestToken.Tokens.toLocaleString()}\nモデル: ${latestToken.Model}`;
    document.getElementById('latest-tokens-info').textContent = latestTokensInfo;
}

// プログレスバーの更新
function updateProgressBar(elementId, percentage, text) {
    const progressBar = document.getElementById(elementId);
    const label = document.getElementById(`${elementId.replace('-progress', '-label')}`);
    const value = document.getElementById(`${elementId.replace('-progress', '-value')}`);

    if (!progressBar || !label || !value) return;

    // プログレスバーの更新
    progressBar.style.width = `${percentage}%`;
    progressBar.style.backgroundColor = getProgressColor(percentage);
    progressBar.textContent = `${percentage}%`;

    // ラベルと値の更新
    const [current, total] = text.split(' / ');
    label.textContent = '使用状況';
    value.textContent = `${current} / ${total}`;
}

// ユーティリティ関数
function formatDate(serial) {
    if (!serial) return '';
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toLocaleDateString('ja-JP');
}

function getProgressColor(percentage) {
    if (percentage >= 80) return '#28a745'; // 緑
    if (percentage >= 60) return '#17a2b8'; // 青
    if (percentage >= 40) return '#ffc107'; // 黄
    return '#dc3545'; // 赤
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('d-none', !show);
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}
