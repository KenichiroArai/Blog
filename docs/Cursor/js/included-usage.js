// グローバル変数
let includedUsageTable;
let apiCostChart;
let costToYouChart;
let inputWithCacheChart;
let inputWithoutCacheChart;
let cacheReadChart;
let outputChart;
let totalTokensChart;

// Included Usage Summaryシート読み込み
async function loadIncludedUsageData() {
    showLoading(true);
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
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

        // Included Usage Summaryシートを探す
        let sheetName = null;

        // 1. 完全一致を試行（正確なシート名）
        sheetName = workbook.SheetNames.find(name => name === 'Included Usage Summary');

        if (sheetName) {
            console.log('Found exact match for sheet:', sheetName);
        } else {
            // 2. 部分一致を試行（フォールバック）
            sheetName = workbook.SheetNames.find(name =>
                name.includes('Included Usage Summary') ||
                name.includes('Included') ||
                name.includes('Usage') ||
                name.toLowerCase().includes('included') ||
                name.toLowerCase().includes('usage')
            );

            if (sheetName) {
                console.log('Found partial match for sheet:', sheetName);
            }
        }

        // 3. 最後の手段：最初のシートを使用（デバッグ用）
        if (!sheetName && workbook.SheetNames.length > 0) {
            console.warn('Included Usage Summaryシートが見つからないため、最初のシートを使用します:', workbook.SheetNames[0]);
            sheetName = workbook.SheetNames[0];
        }

        if (!sheetName) {
            console.error('Available sheets:', workbook.SheetNames);
            throw new Error('Included Usage Summaryシートが見つかりません。利用可能なシート: ' + workbook.SheetNames.join(', '));
        }

        console.log('Found sheet:', sheetName);

        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log('Raw data length:', rawData.length);
        console.log('First few rows:', rawData.slice(0, 5));

        // データを処理
        includedUsageData = processIncludedUsageData(rawData);

        console.log('Included Usage data loaded:', includedUsageData.length, 'records');
    } catch (error) {
        console.error('Included Usage Summaryシートの読み込みに失敗しました:', error);
        throw new Error('Included Usage Summaryシートの読み込みに失敗しました: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Included Usage Summaryデータの処理
function processIncludedUsageData(rawData) {
    console.log('Processing included usage data, raw data length:', rawData.length);
    console.log('Raw data sample:', rawData.slice(0, 10));

    const processedData = [];
    let currentDate = null;
    let currentMonth = null;
    let previousInput = 0;
    let monthCleared = false;

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 2) {
            console.log(`Skipping row ${i}: insufficient data`, row);
            continue;
        }

        const dateCell = row[0];
        const model = row[1] || '';
        const inputWithCache = parseInt(row[2]?.toString().replace(/,/g, '')) || 0;
        const inputWithoutCache = parseInt(row[3]?.toString().replace(/,/g, '')) || 0;
        const cacheRead = parseInt(row[4]?.toString().replace(/,/g, '')) || 0;
        const output = parseInt(row[5]?.toString().replace(/,/g, '')) || 0;
        const totalTokens = parseInt(row[6]?.toString().replace(/,/g, '')) || 0;
        const apiCost = row[7] || '';
        const costToYou = row[8] || '';

        // Inputは両方の合計
        const input = inputWithCache + inputWithoutCache;

        console.log(`Row ${i}: dateCell="${dateCell}", model="${model}", input=${input}`);

        // 日付行の場合（日付が入力されている行）
        if (dateCell && dateCell.toString().trim() && !dateCell.toString().includes('Total')) {
            const dateStr = dateCell.toString().trim();
            const date = parseDate(dateStr);
            if (date) {
                currentDate = date;
                const newMonth = date.getMonth();

                // 前のInputより下がっていれば、新しい月としてクリア
                if (input < previousInput && previousInput > 0) {
                    monthCleared = true;
                    console.log(`新しい月の開始: ${dateStr}, Input: ${input}, Previous: ${previousInput}`);
                }

                currentMonth = newMonth;
                previousInput = input;
                console.log(`Processing date: ${dateStr}, model: ${model}, input: ${input}`);
            } else {
                console.log(`Failed to parse date: ${dateStr}`);
            }
        }

        // 有効な日付とモデルがある場合にデータとして追加（auto行とTotal行の両方を含む）
        if (currentDate && model && model.toString().trim()) {
            const modelStr = model.toString().trim();
            const processedRecord = {
                date: currentDate,
                dateStr: currentDate.toLocaleDateString('ja-JP'),
                model: modelStr,
                input: input,
                inputWithCache: inputWithCache,
                inputWithoutCache: inputWithoutCache,
                output: output,
                cacheRead: cacheRead,
                totalTokens: totalTokens,
                apiCost: apiCost,
                costToYou: costToYou,
                month: currentMonth,
                monthCleared: monthCleared
            };
            processedData.push(processedRecord);
            console.log('Added record:', processedRecord);

            // 月クリアフラグをリセット
            monthCleared = false;
        }
    }

    // 日付順にソート（同じ日付の場合はモデル順）
    processedData.sort((a, b) => {
        if (a.date.getTime() === b.date.getTime()) {
            // 同じ日付の場合、Totalを後に、autoを先に
            if (a.model.toLowerCase() === 'total' && b.model.toLowerCase() === 'auto') {
                return 1;
            } else if (a.model.toLowerCase() === 'auto' && b.model.toLowerCase() === 'total') {
                return -1;
            }
            return a.model.localeCompare(b.model);
        }
        return a.date - b.date;
    });

    console.log('Processed data length:', processedData.length);
    console.log('Processed data sample:', processedData.slice(0, 3));
    return processedData;
}

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
        input: (currentRecord.inputWithCache + currentRecord.inputWithoutCache) - (previousRecord.inputWithCache + previousRecord.inputWithoutCache),
        output: currentRecord.output - previousRecord.output,
        apiCost: parseFloat(currentRecord.apiCost || 0) - parseFloat(previousRecord.apiCost || 0)
    };
}

// 月ごとのリセットを考慮した前日との差を計算する関数
function calculatePreviousDayDifferenceWithReset(currentRecord, previousRecord) {
    if (!previousRecord) {
        return {
            totalTokens: null,
            input: null,
            output: null,
            apiCost: null
        };
    }

    // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
    const isReset =
        currentRecord.totalTokens < previousRecord.totalTokens ||
        currentRecord.input < previousRecord.input ||
        currentRecord.output < previousRecord.output ||
        parseFloat(currentRecord.apiCost || 0) < parseFloat(previousRecord.apiCost || 0);

    if (isReset) {
        // リセットされた場合は、現在の値をそのまま表示（差は0）
        return {
            totalTokens: 0,
            input: 0,
            output: 0,
            apiCost: 0
        };
    }

    return {
        totalTokens: currentRecord.totalTokens - previousRecord.totalTokens,
        input: (currentRecord.inputWithCache + currentRecord.inputWithoutCache) - (previousRecord.inputWithCache + previousRecord.inputWithoutCache),
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
                data: 'inputWithCache',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const inputWithCacheText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.inputWithCache);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${inputWithCacheText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return inputWithCacheText;
                }
            },
            {
                data: 'inputWithoutCache',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const inputWithoutCacheText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.inputWithoutCache);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
                            return `${inputWithoutCacheText} <small class="${diffClass}">(${diffText})</small>`;
                        }
                    }

                    return inputWithoutCacheText;
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
                data: 'totalTokens',
                className: 'text-end',
                width: '120px',
                render: function(data, type, row) {
                    const totalTokensText = data.toLocaleString();
                    const previousRecord = getPreviousDayRecord(row);

                    if (previousRecord && type === 'display') {
                        const diff = calculateDifferenceWithReset(data, previousRecord.totalTokens);
                        const diffText = formatDifference(diff);
                        const diffClass = getDifferenceClass(diff);

                        if (diff !== null && diff !== 0) {
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

    // 月ごとのリセットを考慮した前日との差を計算
    const differences = calculatePreviousDayDifferenceWithReset(latestAutoRecord, previousAutoRecord);

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

    // Input (W/CACHE WRITE)（前日との差付き）
    const latestInputWithCacheValue = document.getElementById('latest-input-with-cache-value');
    if (latestInputWithCacheValue) {
        const inputWithCacheText = latestAutoRecord.inputWithCache.toLocaleString();
        const previousInputWithCache = previousAutoRecord ? previousAutoRecord.inputWithCache : 0;
        const diff = calculateDifferenceWithReset(latestAutoRecord.inputWithCache, previousInputWithCache);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestInputWithCacheValue.innerHTML = `${inputWithCacheText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestInputWithCacheValue.textContent = inputWithCacheText;
        }
    }

    // Input (W/O CACHE WRITE)（前日との差付き）
    const latestInputWithoutCacheValue = document.getElementById('latest-input-without-cache-value');
    if (latestInputWithoutCacheValue) {
        const inputWithoutCacheText = latestAutoRecord.inputWithoutCache.toLocaleString();
        const previousInputWithoutCache = previousAutoRecord ? previousAutoRecord.inputWithoutCache : 0;
        const diff = calculateDifferenceWithReset(latestAutoRecord.inputWithoutCache, previousInputWithoutCache);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestInputWithoutCacheValue.innerHTML = `${inputWithoutCacheText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestInputWithoutCacheValue.textContent = inputWithoutCacheText;
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

// Included Usage グラフの作成
function createIncludedUsageCharts() {
    if (includedUsageData.length === 0) return;

    // 新しいグラフを作成
    try {
        createApiCostChart();
        createCostToYouChart();
        createInputWithCacheChart();
        createInputWithoutCacheChart();
        createCacheReadChart();
        createOutputChart();
        createTotalTokensChart();
    } catch (error) {
        console.error('新しいグラフの作成中にエラーが発生しました:', error);
    }
}

// API Cost グラフの作成
function createApiCostChart() {
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

// Cost to You グラフの作成
function createCostToYouChart() {
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
                backgroundColor: color + '20', // より薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_costToYou`
            });

            datasets.push({
                label: `${model} - Cost to You (当日増分)`,
                data: previousData[model].costToYou.map(item => item.diff),
                backgroundColor: color + '60', // 中程度の色（当日増分）
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

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                totalTokens: []
            };
            previousData[model] = {
                totalTokens: []
            };

            let cumulativeTotalTokens = 0;
            let previousMonthTotalTokens = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentTotalTokens = modelData[model].totalTokens[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousTotalTokens = previousDate ? (modelData[model].totalTokens[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentTotalTokens < previousTotalTokens && previousTotalTokens > 0) {
                    // 新しい月の開始
                    cumulativeTotalTokens = currentTotalTokens;
                    previousMonthTotalTokens = 0;
                } else {
                    // 同じ月の継続
                    cumulativeTotalTokens = currentTotalTokens;
                    previousMonthTotalTokens = previousTotalTokens;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthTotalTokens;

                // 当日の増分
                const diffPart = cumulativeTotalTokens - previousMonthTotalTokens;

                // データを保存
                currentData[model].totalTokens.push(cumulativeTotalTokens);
                previousData[model].totalTokens.push({
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

            // Total Tokens データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Total Tokens (前日分)`,
                data: previousData[model].totalTokens.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_totalTokens`
            });

            datasets.push({
                label: `${model} - Total Tokens (当日増分)`,
                data: previousData[model].totalTokens.map(item => item.diff),
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
        console.error('Total Tokens chart creation error:', error);
    }
}

// Input W/CACHE WRITE グラフの作成
function createInputWithCacheChart() {
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
                    inputWithCache: {}
                };
            }

            if (!modelData[model].inputWithCache[dateStr]) {
                modelData[model].inputWithCache[dateStr] = 0;
            }

            modelData[model].inputWithCache[dateStr] += record.inputWithCache || 0;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                inputWithCache: []
            };
            previousData[model] = {
                inputWithCache: []
            };

            let cumulativeInputWithCache = 0;
            let previousMonthInputWithCache = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentInputWithCache = modelData[model].inputWithCache[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousInputWithCache = previousDate ? (modelData[model].inputWithCache[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentInputWithCache < previousInputWithCache && previousInputWithCache > 0) {
                    // 新しい月の開始
                    cumulativeInputWithCache = currentInputWithCache;
                    previousMonthInputWithCache = 0;
                } else {
                    // 同じ月の継続
                    cumulativeInputWithCache = currentInputWithCache;
                    previousMonthInputWithCache = previousInputWithCache;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthInputWithCache;

                // 当日の増分
                const diffPart = cumulativeInputWithCache - previousMonthInputWithCache;

                // データを保存
                currentData[model].inputWithCache.push(cumulativeInputWithCache);
                previousData[model].inputWithCache.push({
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

            // Input W/CACHE WRITE データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Input W/CACHE WRITE (前日分)`,
                data: previousData[model].inputWithCache.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_inputWithCache`
            });

            datasets.push({
                label: `${model} - Input W/CACHE WRITE (当日増分)`,
                data: previousData[model].inputWithCache.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_inputWithCache`
            });
        });

        // グラフを作成
        const inputWithCacheCtx = document.getElementById('input-with-cache-chart');
        if (!inputWithCacheCtx) {
            console.warn('input-with-cache-chart canvas not found');
            return;
        }

        inputWithCacheChart = new Chart(inputWithCacheCtx.getContext('2d'), {
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
                        text: 'Input (W/CACHE WRITE) 積立推移'
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
        console.error('Input W/CACHE WRITE chart creation error:', error);
    }
}

// Input W/O CACHE WRITE グラフの作成
function createInputWithoutCacheChart() {
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
                    inputWithoutCache: {}
                };
            }

            if (!modelData[model].inputWithoutCache[dateStr]) {
                modelData[model].inputWithoutCache[dateStr] = 0;
            }

            modelData[model].inputWithoutCache[dateStr] += record.inputWithoutCache || 0;
        });

        // 月ごとのリセットを考慮した差分を計算
        const currentData = {};
        const previousData = {};
        const models = Object.keys(modelData);

        models.forEach(model => {
            currentData[model] = {
                inputWithoutCache: []
            };
            previousData[model] = {
                inputWithoutCache: []
            };

            let cumulativeInputWithoutCache = 0;
            let previousMonthInputWithoutCache = 0;

            uniqueDates.forEach((dateStr, index) => {
                const currentInputWithoutCache = modelData[model].inputWithoutCache[dateStr] || 0;

                // 前日の値を取得
                const previousDate = index > 0 ? uniqueDates[index - 1] : null;
                const previousInputWithoutCache = previousDate ? (modelData[model].inputWithoutCache[previousDate] || 0) : 0;

                // 月ごとのリセットをチェック（前日より下がっている場合はリセット）
                if (currentInputWithoutCache < previousInputWithoutCache && previousInputWithoutCache > 0) {
                    // 新しい月の開始
                    cumulativeInputWithoutCache = currentInputWithoutCache;
                    previousMonthInputWithoutCache = 0;
                } else {
                    // 同じ月の継続
                    cumulativeInputWithoutCache = currentInputWithoutCache;
                    previousMonthInputWithoutCache = previousInputWithoutCache;
                }

                // 当日の値（前日分）
                const previousPart = previousMonthInputWithoutCache;

                // 当日の増分
                const diffPart = cumulativeInputWithoutCache - previousMonthInputWithoutCache;

                // データを保存
                currentData[model].inputWithoutCache.push(cumulativeInputWithoutCache);
                previousData[model].inputWithoutCache.push({
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

            // Input W/O CACHE WRITE データセット（前日分と差分を色分け）
            datasets.push({
                label: `${model} - Input W/O CACHE WRITE (前日分)`,
                data: previousData[model].inputWithoutCache.map(item => item.previous),
                backgroundColor: color + '40', // 薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_inputWithoutCache`
            });

            datasets.push({
                label: `${model} - Input W/O CACHE WRITE (当日増分)`,
                data: previousData[model].inputWithoutCache.map(item => item.diff),
                backgroundColor: color + '80', // 濃い色（当日増分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_inputWithoutCache`
            });
        });

        // グラフを作成
        const inputWithoutCacheCtx = document.getElementById('input-without-cache-chart');
        if (!inputWithoutCacheCtx) {
            console.warn('input-without-cache-chart canvas not found');
            return;
        }

        inputWithoutCacheChart = new Chart(inputWithoutCacheCtx.getContext('2d'), {
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
                        text: 'Input (W/O CACHE WRITE) 積立推移'
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
        console.error('Input W/O CACHE WRITE chart creation error:', error);
    }
}

// Cache Read グラフの作成
function createCacheReadChart() {
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
                    cacheRead: {}
                };
            }

            if (!modelData[model].cacheRead[dateStr]) {
                modelData[model].cacheRead[dateStr] = 0;
            }

            modelData[model].cacheRead[dateStr] += record.cacheRead || 0;
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
                backgroundColor: color + '30', // より薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_cacheRead`
            });

            datasets.push({
                label: `${model} - Cache Read (当日増分)`,
                data: previousData[model].cacheRead.map(item => item.diff),
                backgroundColor: color + '70', // 中程度の色（当日増分）
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

// Output グラフの作成
function createOutputChart() {
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
                    output: {}
                };
            }

            if (!modelData[model].output[dateStr]) {
                modelData[model].output[dateStr] = 0;
            }

            modelData[model].output[dateStr] += record.output || 0;
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
                backgroundColor: color + '20', // より薄い色（前日分）
                borderColor: color,
                borderWidth: 1,
                type: 'bar',
                stack: `${model}_output`
            });

            datasets.push({
                label: `${model} - Output (当日増分)`,
                data: previousData[model].output.map(item => item.diff),
                backgroundColor: color + '60', // 中程度の色（当日増分）
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
