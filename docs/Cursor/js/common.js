// グローバル変数
let recordsData = [];
let tokensData = [];
let includedUsageData = [];

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
        const input = parseInt(row[2]?.toString().replace(/,/g, '')) || 0;
        const output = parseInt(row[3]?.toString().replace(/,/g, '')) || 0;
        const cacheWrite = parseInt(row[4]?.toString().replace(/,/g, '')) || 0;
        const cacheRead = parseInt(row[5]?.toString().replace(/,/g, '')) || 0;
        const totalTokens = parseInt(row[6]?.toString().replace(/,/g, '')) || 0;
        const apiCost = row[7] || '';
        const costToYou = row[8] || '';

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

        // auto行のみをデータとして追加（Total行は除外）
        if (currentDate && model && model.toString().trim().toLowerCase() === 'auto') {
            const processedRecord = {
                date: currentDate,
                dateStr: currentDate.toLocaleDateString('ja-JP'),
                model: model.toString().trim(),
                input: input,
                output: output,
                cacheWrite: cacheWrite,
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

    // 日付順にソート
    processedData.sort((a, b) => a.date - b.date);

    console.log('Processed data length:', processedData.length);
    console.log('Processed data sample:', processedData.slice(0, 3));
    return processedData;
}

// 日付文字列をDateオブジェクトに変換
function parseDate(dateStr) {
    if (!dateStr) return null;

    console.log('Parsing date:', dateStr);

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

// CSVファイル読み込み
async function loadTokensData() {
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
    if (tokensData.length === 0) return;

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

    // 最新使用日のデータを取得
    const dates = Object.keys(dailyData).sort();
    const latestDate = dates[dates.length - 1];
    const latestDailyData = dailyData[latestDate];

    if (latestDailyData) {
        const dailyTotalTokens = latestDailyData.total;
        const dailyAvgTokens = Math.round(latestDailyData.total / latestDailyData.count);
        const dailyMaxTokens = latestDailyData.max;

        // 最新使用日の統計を表示（最新使用日の日付を含める）
        const latestUsageDateValue = document.getElementById('latest-usage-date-value');
        if (latestUsageDateValue) latestUsageDateValue.textContent = latestDate;
        const dailyTotalTokensValue = document.getElementById('daily-total-tokens-value');
        if (dailyTotalTokensValue) dailyTotalTokensValue.textContent = dailyTotalTokens.toLocaleString();
        const dailyAvgTokensValue = document.getElementById('daily-avg-tokens-value');
        if (dailyAvgTokensValue) dailyAvgTokensValue.textContent = dailyAvgTokens.toLocaleString();
        const dailyMaxTokensValue = document.getElementById('daily-max-tokens-value');
        if (dailyMaxTokensValue) dailyMaxTokensValue.textContent = dailyMaxTokens.toLocaleString();

        // 最新使用日の日付を統計に含める（latest-tokens-infoは空にする）
        const latestTokensInfo = document.getElementById('latest-tokens-info');
        if (latestTokensInfo) latestTokensInfo.textContent = '';
    }
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
