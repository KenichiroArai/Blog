// グローバル変数
let summaryTable;
let apiCostChart;
let costToYouChart;
let cacheReadChart;
let cacheWriteChart;
let inputChart;
let outputChart;
let totalChart;

// 共通のグラフ設定
const CHART_COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6c757d'];
const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
};

// Summaryシート読み込み
async function loadSummaryData() {
    showLoading(true);
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const excelPath = isTopPage ? 'record.xlsx' : '../record.xlsx';

        console.log('Loading Excel file from:', excelPath);
        console.log('Current path:', currentPath);

        const response = await fetch(excelPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        console.log('Available sheets:', workbook.SheetNames);

        // Summaryシートを探す
        let sheetName = null;

        // 1. 完全一致を試行（正確なシート名）
        sheetName = workbook.SheetNames.find(name => name === 'Summary');

        if (sheetName) {
            console.log('Found exact match for sheet:', sheetName);
        } else {
            // 2. 部分一致を試行（フォールバック）
            sheetName = workbook.SheetNames.find(name =>
                name.includes('Summary') ||
                name.toLowerCase().includes('summary')
            );

            if (sheetName) {
                console.log('Found partial match for sheet:', sheetName);
            }
        }

        // 3. 最後の手段：最初のシートを使用（デバッグ用）
        if (!sheetName && workbook.SheetNames.length > 0) {
            console.warn('Summaryシートが見つからないため、最初のシートを使用します:', workbook.SheetNames[0]);
            sheetName = workbook.SheetNames[0];
        }

        if (!sheetName) {
            console.error('Available sheets:', workbook.SheetNames);
            throw new Error('Summaryシートが見つかりません。利用可能なシート: ' + workbook.SheetNames.join(', '));
        }

        console.log('Found sheet:', sheetName);

        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log('Raw data length:', rawData.length);
        console.log('First few rows:', rawData.slice(0, 5));

        // データを処理
        summaryData = processSummaryData(rawData);

        console.log('Summary data loaded:', summaryData.length, 'records');
        console.log('Summary data sample:', summaryData.slice(0, 3));
    } catch (error) {
        console.error('Summaryシートの読み込みに失敗しました:', error);
        throw new Error('Summaryシートの読み込みに失敗しました: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Summaryデータの処理
function processSummaryData(rawData) {
    console.log('Processing summary data, raw data length:', rawData.length);
    console.log('Raw data sample:', rawData.slice(0, 10));

    const processedData = [];

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 2) {
            console.log(`Skipping row ${i}: insufficient data`, row);
            continue;
        }

        const dateStr = row[0];
        const model = row[1];
        const cacheRead = row[2];
        const cacheWrite = row[3];
        const input = row[4];
        const output = row[5];
        const total = row[6];
        const apiCost = row[7];
        const costToYou = row[8];

        // 日付の処理
        let date;
        if (dateStr instanceof Date) {
            date = dateStr;
        } else if (typeof dateStr === 'string') {
            // 日付文字列を解析
            const parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
                console.log(`Skipping row ${i}: invalid date`, dateStr);
                continue;
            }
            date = parsedDate;
        } else if (typeof dateStr === 'number') {
            // Excelの日付数値を変換
            date = new Date((dateStr - 25569) * 86400 * 1000);
        } else {
            console.log(`Skipping row ${i}: invalid date type`, dateStr);
            continue;
        }

        // 数値の処理
        const processedRecord = {
            date: date,
            dateStr: date.toLocaleDateString('ja-JP'),
            model: model || '',
            cacheRead: parseFloat(cacheRead) || 0,
            cacheWrite: parseFloat(cacheWrite) || 0,
            input: parseFloat(input) || 0,
            output: parseFloat(output) || 0,
            total: parseFloat(total) || 0,
            apiCost: apiCost || '$0',
            costToYou: costToYou || '$0'
        };

        processedData.push(processedRecord);
    }

    console.log('Processed summary data:', processedData.length, 'records');
    return processedData;
}

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

// 共通のデータ処理関数
function processModelData(summaryData, fieldName) {
    const modelData = {};

    // 日付の重複を除去してソート
    const uniqueDates = [...new Set(summaryData.map(record => record.dateStr))]
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b)
        .map(date => date.toLocaleDateString('ja-JP'));

    summaryData.forEach(record => {
        const model = record.model;
        const dateStr = record.dateStr;

        if (!modelData[model]) {
            modelData[model] = {};
        }

        if (!modelData[model][dateStr]) {
            modelData[model][dateStr] = 0;
        }

        // 数値に変換
        const value = fieldName === 'apiCost' || fieldName === 'costToYou'
            ? parseFloat(record[fieldName]) || 0
            : parseInt(record[fieldName]) || 0;
        modelData[model][dateStr] += value;
    });

    return { modelData, uniqueDates };
}

// 月ごとのリセットを考慮した差分を計算する共通関数
function calculateCumulativeData(modelData, uniqueDates) {
    const currentData = {};
    const previousData = {};
    const models = Object.keys(modelData);

    models.forEach(model => {
        currentData[model] = [];
        previousData[model] = [];

        let cumulativeValue = 0;
        let previousMonthValue = 0;

        uniqueDates.forEach((dateStr, index) => {
            const currentValue = modelData[model][dateStr] || 0;

            // 前日の値を取得
            const previousDate = index > 0 ? uniqueDates[index - 1] : null;
            const previousValue = previousDate ? (modelData[model][previousDate] || 0) : 0;

            // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
            if (currentValue < previousValue && previousValue > 0) {
                // 新しい月の開始
                cumulativeValue = currentValue;
                previousMonthValue = 0;
            } else {
                // 同じ月の継続
                cumulativeValue = currentValue;
                previousMonthValue = previousValue;
            }

            // 当日の値（前日分）
            const previousPart = previousMonthValue;

            // 当日の増分
            const diffPart = cumulativeValue - previousMonthValue;

            // データを保存
            currentData[model].push(cumulativeValue);
            previousData[model].push({
                previous: previousPart,
                diff: diffPart
            });
        });
    });

    return { currentData, previousData };
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

// 共通のグラフ作成関数
function createCommonChart(canvasId, title, fieldName, isCurrency = false) {
    try {
        if (summaryData.length === 0) return;

        // データ処理
        const { modelData, uniqueDates } = processModelData(summaryData, fieldName);
        const { currentData, previousData } = calculateCumulativeData(modelData, uniqueDates);
        const models = Object.keys(modelData);

        // グラフデータセットを作成
        const datasets = [];

        models.forEach((model, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];

            // 前日分と差分を色分け
            datasets.push({
                label: `${model} - ${title} (前日分)`,
                data: previousData[model].map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_${fieldName}`
            });

            datasets.push({
                label: `${model} - ${title} (当日増分)`,
                data: previousData[model].map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_${fieldName}`
            });
        });

        // グラフを作成
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`${canvasId} canvas not found`);
            return;
        }

        const chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                ...CHART_OPTIONS,
                plugins: {
                    title: {
                        display: true,
                        text: `${title} 積立推移`
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                const formattedValue = isCurrency
                                    ? `$${value.toFixed(4)}`
                                    : value.toLocaleString();
                                return `${label}: ${formattedValue}`;
                            },
                            afterBody: function(context) {
                                // モデルごとの合計を計算
                                const modelTotals = {};

                                context.forEach(item => {
                                    const stack = item.dataset.stack;
                                    const model = stack.split('_')[0];
                                    if (!modelTotals[model]) {
                                        modelTotals[model] = 0;
                                    }
                                    modelTotals[model] += item.parsed.y;
                                });

                                // 合計表示を作成
                                const totalLines = [];
                                Object.keys(modelTotals).forEach(model => {
                                    const formattedTotal = isCurrency
                                        ? `$${modelTotals[model].toFixed(4)}`
                                        : modelTotals[model].toLocaleString();
                                    totalLines.push(`${model}: ${formattedTotal}`);
                                });

                                return totalLines;
                            }
                        }
                    }
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
                                return isCurrency
                                    ? `$${value.toFixed(4)}`
                                    : value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        return chart;
    } catch (error) {
        console.error(`${title} chart creation error:`, error);
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
        apiCostChart = createCommonChart('api-cost-chart', 'API Cost', 'apiCost', true);
        costToYouChart = createCommonChart('cost-to-you-chart', 'Cost to You', 'costToYou', true);
        cacheReadChart = createCommonChart('cache-read-chart', 'Cache Read', 'cacheRead', false);
        cacheWriteChart = createCommonChart('cache-write-chart', 'Cache Write', 'cacheWrite', false);
        inputChart = createCommonChart('input-chart', 'Input', 'input', false);
        outputChart = createCommonChart('output-chart', 'Output', 'output', false);
        totalChart = createCommonChart('total-chart', 'Total', 'total', false);
    } catch (error) {
        console.error('新しいグラフの作成中にエラーが発生しました:', error);
    }
}

// 個別のグラフ作成関数は共通関数に統合されました
