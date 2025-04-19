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
            'Premium models': parseInt(record['Premium models']) || 0,
            'gpt-4o-mini or cursor-small': parseInt(record['gpt-4o-mini or cursor-small']) || 0,
            'Fast requests will refresh in X day': parseInt(record['Fast requests will refresh in X day']) || 0
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
            { data: 'Premium models' },
            { data: 'gpt-4o-mini or cursor-small' },
            { data: 'Fast requests will refresh in X day' }
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

    document.getElementById('latest-date').textContent = latest.記録日;
    document.getElementById('latest-days').textContent = `使用日数: ${latest.日数}日`;

    // 進捗バーの更新（Fast requestsの残り日数に基づく）
    const fastRequestsDays = latest['Fast requests will refresh in X day'];
    const progressBar = document.getElementById('latest-progress');
    progressBar.style.width = `${(fastRequestsDays / 30) * 100}%`;
    progressBar.style.backgroundColor = getProgressColor(fastRequestsDays);
    progressBar.textContent = `${fastRequestsDays}日`;

    // 各種数値の更新
    document.getElementById('latest-premium').textContent = latest['Premium models'];
    document.getElementById('latest-mini').textContent = latest['gpt-4o-mini or cursor-small'];
    document.getElementById('latest-fast').textContent = fastRequestsDays;
}

// ユーティリティ関数
function formatDate(serial) {
    if (!serial) return '';
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toLocaleDateString('ja-JP');
}

function getProgressColor(days) {
    if (days >= 20) return '#28a745'; // 緑
    if (days >= 10) return '#17a2b8'; // 青
    if (days >= 5) return '#ffc107'; // 黄
    return '#dc3545'; // 赤
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('d-none', !show);
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}
