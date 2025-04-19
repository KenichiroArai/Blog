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
            進捗率: parseFloat(record.進捗率) || 0,
            成功率: calculateSuccessRate(record.成功数, record.実践数)
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
            {
                data: 'パス名',
                render: (data, type, row) => {
                    return type === 'display' ?
                        `<a href="${row.パスURL}" target="_blank">${data}</a>` :
                        data;
                }
            },
            {
                data: 'Course名',
                render: (data, type, row) => {
                    return type === 'display' ?
                        `<a href="${row.CourseURL}" target="_blank">${data}</a>` :
                        data;
                }
            },
            {
                data: '進捗率',
                render: (data) => {
                    const percentage = parseFloat(data);
                    const color = getProgressColor(percentage);
                    return `<div class="progress">
                        <div class="progress-bar" role="progressbar"
                            style="width: ${percentage}%; background-color: ${color}">
                            ${percentage}%
                        </div>
                    </div>`;
                }
            },
            {
                data: null,
                render: (data) => `${data.成功数}/${data.実践数}`
            }
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

    document.getElementById('latest-course').textContent = latest.Course名;
    document.getElementById('latest-path').textContent = latest.パス名;

    const progressBar = document.getElementById('latest-progress');
    progressBar.style.width = `${latest.進捗率}%`;
    progressBar.style.backgroundColor = getProgressColor(latest.進捗率);
    progressBar.textContent = `${latest.進捗率}%`;

    document.getElementById('latest-days').textContent = latest.days;
    document.getElementById('latest-success-rate').textContent =
        `${calculateSuccessRate(latest.成功数, latest.実践数)}%`;
}

// ユーティリティ関数
function formatDate(serial) {
    if (!serial) return '';
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toLocaleDateString('ja-JP');
}

function calculateSuccessRate(success, total) {
    if (!total) return 0;
    return Math.round((success / total) * 100);
}

function getProgressColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#17a2b8';
    if (percentage >= 40) return '#ffc107';
    return '#dc3545';
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('d-none', !show);
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}
