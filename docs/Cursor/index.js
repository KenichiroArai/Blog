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
            {
                data: '日数',
                render: (data) => {
                    const percentage = (data / 30 * 100).toFixed(2);
                    const color = getProgressColor(percentage);
                    return `<div class="progress">
                        <div class="progress-bar" role="progressbar"
                            style="width: ${percentage}%; background-color: ${color}">
                            ${data}日
                        </div>
                    </div>`;
                }
            },
            {
                data: 'Premium models',
                render: (data) => {
                    const percentage = (data / 500 * 100).toFixed(2);
                    const color = getProgressColor(percentage);
                    return `<div class="progress">
                        <div class="progress-bar" role="progressbar"
                            style="width: ${percentage}%; background-color: ${color}">
                            ${data}
                        </div>
                    </div>`;
                }
            },
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

    const days = latest.日数;
    const premiumModels = latest['Premium models'];
    const miniModels = latest['gpt-4o-mini or cursor-small'];
    const fastRequestsDays = latest['Fast requests will refresh in X day'];

    // 固定値
    const totalDays = 30;
    const totalPremiumModels = 500;

    // パーセンテージ計算
    const daysPercentage = (days / totalDays * 100).toFixed(2);
    const premiumPercentage = (premiumModels / totalPremiumModels * 100).toFixed(2);
    const remainingDays = totalDays - days;
    const remainingPremium = totalPremiumModels - premiumModels;

    // プログレスバーの更新
    updateProgressBar('days-progress', daysPercentage, `${days}日 / ${totalDays}日`);
    updateProgressBar('premium-progress', premiumPercentage, `${premiumModels} / ${totalPremiumModels}`);

    // 残り日数と残りPremiumの更新
    document.getElementById('remaining-days').textContent = `${remainingDays}日`;
    document.getElementById('remaining-premium').textContent = remainingPremium;

    // 使用情報のテキスト作成
    const usageInfo = `追加情報：
gpt-4o-mini or cursor-small: ${miniModels} / No Limit
Fast requests will refresh in ${fastRequestsDays} day`;

    // 表示
    document.getElementById('latest-usage-info').textContent = usageInfo;
}

// プログレスバーの更新
function updateProgressBar(elementId, percentage, text) {
    const progressBar = document.getElementById(elementId);
    if (!progressBar) return;

    progressBar.style.width = `${percentage}%`;
    progressBar.style.backgroundColor = getProgressColor(percentage);
    progressBar.textContent = text;
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
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}
