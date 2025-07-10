// グローバル変数
let recordsData = [];
let dataTable;

// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadExcelFile();
        initializeDataTable();
        updateLatestRecord();
    } catch (error) {
        showError('データの読み込み中にエラーが発生しました: ' + error.message);
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
            'Tabs Accpeted: X tabs': parseInt(record['Tabs Accpeted: X tabs']) || 0
        }));
    } catch (error) {
        throw new Error('Excelファイルの読み込みに失敗しました');
    } finally {
        showLoading(false);
    }
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
            { data: 'Tabs Accpeted: X tabs' }
        ],
        order: [[0, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
        },
        responsive: true
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
    const tabsAccepted = latest['Tabs Accpeted: X tabs'];

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

    // 次の日の目安の計算
    const todayDays = days + 1;
    const todayRemainingDays = totalDays - todayDays;

    // 次の日の目安の表示
    const remainingDaysElem = document.getElementById('today-remaining-days');
    if (remainingDaysElem) remainingDaysElem.textContent = `${todayRemainingDays}日`;

    // 使用統計の表示
    const suggestedLinesElem = document.getElementById('suggested-lines-value');
    if (suggestedLinesElem) suggestedLinesElem.textContent = suggestedLines.toLocaleString();
    const acceptedLinesElem = document.getElementById('accepted-lines-value');
    if (acceptedLinesElem) acceptedLinesElem.textContent = acceptedLines.toLocaleString();
    const tabsAcceptedElem = document.getElementById('tabs-accepted-value');
    if (tabsAcceptedElem) tabsAcceptedElem.textContent = String(tabsAccepted);

    // 次の日の目安の表示
    const todaySuggestedLinesElem = document.getElementById('today-suggested-lines');
    if (todaySuggestedLinesElem) todaySuggestedLinesElem.textContent = suggestedLines.toLocaleString();
    const todayAcceptedLinesElem = document.getElementById('today-accepted-lines');
    if (todayAcceptedLinesElem) todayAcceptedLinesElem.textContent = acceptedLines.toLocaleString();
    const todayTabsAcceptedElem = document.getElementById('today-tabs-accepted');
    if (todayTabsAcceptedElem) todayTabsAcceptedElem.textContent = String(tabsAccepted);
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
