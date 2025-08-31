// グローバル変数
let recordsData = [];
let usageData = [];
let includedUsageData = [];
let usageDetailsData = []; // 追加：usage-details.csvのデータ

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

// Excelファイル読み込み
async function loadExcelFile() {
    showLoading(true);
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const excelPath = isTopPage ? 'record.xlsx' : '../record.xlsx';

        const response = await fetch(excelPath);
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

// 日付文字列をDateオブジェクトに変換
function parseDate(dateStr) {
    if (!dateStr) return null;

    console.log('Parsing date:', dateStr);

    // Excelのシリアル番号形式を処理（例：45878）
    const serialNumber = parseFloat(dateStr);
    if (!isNaN(serialNumber) && serialNumber > 1) {
        // Excelのシリアル番号は1900年1月1日からの日数
        // 25569は1970年1月1日のExcelシリアル番号
        const date = new Date((serialNumber - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
            console.log('Parsed date (Excel serial):', date);
            return date;
        }
    }

    // 2025/7/17 形式を処理（YYYY/M/D）
    const match = dateStr.toString().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // 月は0ベース
        const day = parseInt(match[3]);
        const date = new Date(year, month, day);
        console.log('Parsed date (YYYY/M/D):', date);
        return date;
    }

    // 2025-7-17 形式を処理（YYYY-M-D）
    const match2 = dateStr.toString().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match2) {
        const year = parseInt(match2[1]);
        const month = parseInt(match2[2]) - 1;
        const day = parseInt(match2[3]);
        const date = new Date(year, month, day);
        console.log('Parsed date (YYYY-M-D):', date);
        return date;
    }

    // その他の形式も試行
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        console.log('Parsed date (other format):', date);
        return date;
    }

    console.log('Failed to parse date:', dateStr);
    return null;
}

// Usage Details CSVファイル読み込み
async function loadUsageDetailsData() {
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/usage-details.csv' : '../Tool/AllRawEvents/data/usage-details.csv';

        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('Usage Details CSVファイルが空またはヘッダーのみです');
        }

        const headers = lines[0].split(',').map(header => header.trim());
        usageDetailsData = [];

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
                usageDetailsData.push(record);
            }
        }

        // データの整形
        usageDetailsData = usageDetailsData.map(record => ({
            ...record,
            Date: new Date(record.Date),
            Tokens: parseInt(record.Tokens) || 0,
            'Cost ($)': record['Cost ($)'] || 'Included'
        })).filter(record => !isNaN(record.Date.getTime())); // 無効な日付を除外

        // 日付順にソート
        usageDetailsData.sort((a, b) => a.Date - b.Date);

        console.log('Usage Details data loaded:', usageDetailsData.length, 'records');
    } catch (error) {
        console.error('Usage Details CSVファイルの読み込みに失敗しました:', error);
        throw new Error('Usage Details CSVファイルの読み込みに失敗しました: ' + error.message);
    }
}

// CSVファイル読み込み（統合版）
async function loadUsageData() {
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/usage-tokens.csv' : '../Tool/AllRawEvents/data/usage-tokens.csv';

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
        const rawTokensData = [];

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
                rawTokensData.push(record);
            }
        }

        // データの整形
        const processedTokensData = rawTokensData.map(record => ({
            ...record,
            Date: new Date(record.Date),
            'Input (w/ Cache Write)': parseInt(record['Input (w/ Cache Write)']) || 0,
            'Input (w/o Cache Write)': parseInt(record['Input (w/o Cache Write)']) || 0,
            'Cache Read': parseInt(record['Cache Read']) || 0,
            'Output': parseInt(record['Output']) || 0,
            'Total Tokens': parseInt(record['Total Tokens']) || 0,
            'Cost ($)': record['Cost ($)'] || 'Included'
        })).filter(record => !isNaN(record.Date.getTime())); // 無効な日付を除外

        // 日付順にソート
        processedTokensData.sort((a, b) => a.Date - b.Date);

        // Usage Detailsデータと統合
        await loadUsageDetailsData();
        usageData = mergeTokensData(processedTokensData, usageDetailsData);

        console.log('Merged tokens data loaded:', usageData.length, 'records');
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
        throw new Error('CSVファイルの読み込みに失敗しました: ' + error.message);
    }
}

// トークンデータの統合
function mergeTokensData(tokensData, detailsData) {
    const mergedData = [];
    const detailsMap = new Map();

    // Usage Detailsデータをマップに変換（日時をキーとして）
    detailsData.forEach(detail => {
        const key = detail.Date.toISOString();
        detailsMap.set(key, detail);
    });

    // Tokensデータをベースに統合
    tokensData.forEach(token => {
        const key = token.Date.toISOString();
        const detail = detailsMap.get(key);

        if (detail) {
            // 両方のデータが存在する場合、詳細情報を統合
            mergedData.push({
                ...token,
                // Usage Detailsから追加情報を取得
                'Max Mode': detail['Max Mode'] || token['Max Mode'] || 'No',
                'Kind': detail['Kind'] || token['Kind'] || 'Included in Pro'
            });
        } else {
            // Tokensデータのみの場合
            mergedData.push(token);
        }
    });

    // Usage Detailsのみに存在するデータを追加
    detailsData.forEach(detail => {
        const key = detail.Date.toISOString();
        const existingToken = mergedData.find(token => token.Date.toISOString() === key);

        if (!existingToken) {
            // Tokensデータにない場合は、基本的な情報で追加
            mergedData.push({
                Date: detail.Date,
                User: detail.User || 'You',
                Kind: detail.Kind || 'Included in Pro',
                'Max Mode': detail['Max Mode'] || 'No',
                Model: detail.Model || 'auto',
                'Input (w/ Cache Write)': 0,
                'Input (w/o Cache Write)': 0,
                'Cache Read': 0,
                'Output': 0,
                'Total Tokens': detail.Tokens || 0,
                'Cost ($)': detail['Cost ($)'] || 'Included'
            });
        }
    });

    // 日付順にソート
    mergedData.sort((a, b) => a.Date - b.Date);

    return mergedData;
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
    const latestUsageInfo = document.getElementById('latest-usage-info');
    if (latestUsageInfo) latestUsageInfo.textContent = usageInfo;

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

        // 最新使用日の統計を表示（最新使用日の日付を含める）
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

        // 最新使用日の日付を統計に含める（latest-tokens-infoは空にする）
        const latestTokensInfo = document.getElementById('latest-tokens-info');
        if (latestTokensInfo) latestTokensInfo.textContent = '';
    }
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
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.toggle('d-none', !show);
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}
