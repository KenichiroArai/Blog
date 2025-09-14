// CSVファイル読み込み（統合版）
async function loadUsageData() {
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/old/usage-tokens.csv' : '../Tool/AllRawEvents/data/old/usage-tokens.csv';

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

// Usage Details CSVファイル読み込み
async function loadUsageDetailsData() {
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/old/usage-details.csv' : '../Tool/AllRawEvents/data/old/usage-details.csv';

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

// Usage Events CSVファイル読み込み
async function loadUsageEventsData() {
    showLoading(true);
    try {
        // 現在のページのパスに基づいて相対パスを決定
        const currentPath = window.location.pathname;
        const isTopPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('/Cursor');
        const csvPath = isTopPage ? 'Tool/AllRawEvents/data/usage-events.csv' : '../Tool/AllRawEvents/data/usage-events.csv';

        console.log('Loading Usage Events CSV file from:', csvPath);
        console.log('Current path:', currentPath);

        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        usageEventsData = parseUsageEventsCSV(csvText);

        console.log('Loaded usage events data:', usageEventsData.length, 'records');
        console.log('Usage events data sample:', usageEventsData.slice(0, 3));
    } catch (error) {
        console.error('Usage Events CSVファイルの読み込みエラー:', error);
        throw new Error('Usage Events CSVファイルの読み込みに失敗しました: ' + error.message);
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

// Summaryシート読み込み
async function loadSummaryData() {
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

// Usage Events CSVデータの処理
function parseUsageEventsCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        console.warn('Usage Events CSVファイルが空またはヘッダーのみです');
        return [];
    }

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index].trim();
            });
            data.push(row);
        }
    }

    console.log('Parsed usage events data:', data.length, 'records');
    return data;
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



// Summary統計の更新
function updateSummaryStats() {
    if (summaryData.length === 0) return;

    console.log('Summary data:', summaryData);

    // autoモデルのレコードのみを取得して日付順にソート
    const autoRecords = summaryData
        .filter(record => record.model.toLowerCase() === 'auto')
        .sort((a, b) => b.date - a.date);

    const latestRecord = autoRecords[0];
    const previousRecord = autoRecords[1]; // 前日のautoレコード

    console.log('Auto records:', autoRecords);
    console.log('Latest auto record:', latestRecord);
    console.log('Previous auto record:', previousRecord);

    if (!latestRecord) {
        console.warn('No summary record found for stats');
        return;
    }

    // 最新使用日の統計を表示
    const latestSummaryDateValue = document.getElementById('latest-summary-date-value');
    if (latestSummaryDateValue) latestSummaryDateValue.textContent = latestRecord.dateStr;

    // Total（前日との差付き）
    const latestSummaryTotalValue = document.getElementById('latest-summary-total-value');
    if (latestSummaryTotalValue) {
        const totalText = latestRecord.total.toLocaleString();
        const previousTotal = previousRecord ? previousRecord.total : 0;
        const diff = calculateDifferenceWithReset(latestRecord.total, previousTotal);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryTotalValue.innerHTML = `${totalText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryTotalValue.textContent = totalText;
        }
    }

    // Cache Read（前日との差付き）
    const latestSummaryCacheReadValue = document.getElementById('latest-summary-cache-read-value');
    if (latestSummaryCacheReadValue) {
        const cacheReadText = latestRecord.cacheRead.toLocaleString();
        const previousCacheRead = previousRecord ? previousRecord.cacheRead : 0;
        const diff = calculateDifferenceWithReset(latestRecord.cacheRead, previousCacheRead);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryCacheReadValue.innerHTML = `${cacheReadText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryCacheReadValue.textContent = cacheReadText;
        }
    }

    // Cache Write（前日との差付き）
    const latestSummaryCacheWriteValue = document.getElementById('latest-summary-cache-write-value');
    if (latestSummaryCacheWriteValue) {
        const cacheWriteText = latestRecord.cacheWrite.toLocaleString();
        const previousCacheWrite = previousRecord ? previousRecord.cacheWrite : 0;
        const diff = calculateDifferenceWithReset(latestRecord.cacheWrite, previousCacheWrite);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryCacheWriteValue.innerHTML = `${cacheWriteText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryCacheWriteValue.textContent = cacheWriteText;
        }
    }

    // Input（前日との差付き）
    const latestSummaryInputValue = document.getElementById('latest-summary-input-value');
    if (latestSummaryInputValue) {
        const inputText = latestRecord.input.toLocaleString();
        const previousInput = previousRecord ? previousRecord.input : 0;
        const diff = calculateDifferenceWithReset(latestRecord.input, previousInput);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryInputValue.innerHTML = `${inputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryInputValue.textContent = inputText;
        }
    }

    // Output（前日との差付き）
    const latestSummaryOutputValue = document.getElementById('latest-summary-output-value');
    if (latestSummaryOutputValue) {
        const outputText = latestRecord.output.toLocaleString();
        const previousOutput = previousRecord ? previousRecord.output : 0;
        const diff = calculateDifferenceWithReset(latestRecord.output, previousOutput);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryOutputValue.innerHTML = `${outputText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryOutputValue.textContent = outputText;
        }
    }

    // API Cost（前日との差付き）
    const latestSummaryApiCostValue = document.getElementById('latest-summary-api-cost-value');
    if (latestSummaryApiCostValue) {
        const apiCostText = latestRecord.apiCost;
        const previousApiCost = previousRecord ? (parseFloat(String(previousRecord.apiCost || '').replace('$', '')) || 0) : 0;
        const currentApiCost = parseFloat(String(latestRecord.apiCost || '').replace('$', '')) || 0;
        const diff = calculateDifferenceWithReset(currentApiCost, previousApiCost);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryApiCostValue.innerHTML = `${apiCostText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryApiCostValue.textContent = apiCostText;
        }
    }

    // Cost to You（前日との差付き）
    const latestSummaryCostToYouValue = document.getElementById('latest-summary-cost-to-you-value');
    if (latestSummaryCostToYouValue) {
        const costToYouText = latestRecord.costToYou;
        const previousCostToYou = previousRecord ? (parseFloat(String(previousRecord.costToYou || '').replace('$', '')) || 0) : 0;
        const currentCostToYou = parseFloat(String(latestRecord.costToYou || '').replace('$', '')) || 0;
        const diff = calculateDifferenceWithReset(currentCostToYou, previousCostToYou);
        const diffText = formatDifference(diff);
        const diffClass = getDifferenceClass(diff);

        if (diff !== null) {
            latestSummaryCostToYouValue.innerHTML = `${costToYouText} <small class="${diffClass}">(${diffText})</small>`;
        } else {
            latestSummaryCostToYouValue.textContent = costToYouText;
        }
    }
}

// Usage Events統計の更新
function updateUsageEventsStats() {
    if (usageEventsData.length === 0) return;

    console.log('Usage Events data:', usageEventsData);

    // 統計情報を計算
    const totalEvents = usageEventsData.length;
    const successfulEvents = usageEventsData.filter(row => row.Kind === 'Included').length;
    const errorEvents = usageEventsData.filter(row => row.Kind.includes('Errored')).length;

    // 総トークン数を計算
    const totalTokens = usageEventsData.reduce((sum, row) => {
        const tokens = parseInt(row['Total Tokens']) || 0;
        return sum + tokens;
    }, 0);

    // 統計情報を表示
    const totalEventsValue = document.getElementById('total-events-value');
    if (totalEventsValue) totalEventsValue.textContent = totalEvents.toLocaleString();

    const successfulEventsValue = document.getElementById('successful-events-value');
    if (successfulEventsValue) successfulEventsValue.textContent = successfulEvents.toLocaleString();

    const errorEventsValue = document.getElementById('error-events-value');
    if (errorEventsValue) errorEventsValue.textContent = errorEvents.toLocaleString();

    const totalTokensValue = document.getElementById('total-tokens-value');
    if (totalTokensValue) totalTokensValue.textContent = totalTokens.toLocaleString();

    // 最新の使用情報を表示（他のセクションと統一性を保つため削除）
    const latestUsageEventsInfo = document.getElementById('latest-usage-events-info');
    if (latestUsageEventsInfo) {
        latestUsageEventsInfo.innerHTML = '';
    }
}

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadExcelFile();
        await loadUsageData(); // 統合されたトークンデータを読み込み
        await loadIncludedUsageData();
        await loadSummaryData(); // Summaryデータを読み込み
        await loadUsageEventsData(); // Usage Eventsデータを読み込み
        updateLatestRecord();
        updateSummaryStats(); // Summary統計を更新
        updateUsageEventsStats(); // Usage Events統計を更新
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (recordsData.length > 0) {
                updateLatestRecord();
            }
            if (summaryData.length > 0) {
                updateSummaryStats();
            }
            if (usageEventsData.length > 0) {
                updateUsageEventsStats();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});
