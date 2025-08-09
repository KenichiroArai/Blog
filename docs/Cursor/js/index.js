// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadExcelFile();
        await loadTokensData();
        await loadIncludedUsageData();
        updateLatestRecord();
        updateTokensStats();
        updateIncludedUsageStats();
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('データの読み込み中にエラーが発生しました: ' + error.message);

        // 部分的な初期化を試行
        try {
            if (recordsData.length > 0) {
                updateLatestRecord();
            }
            if (tokensData.length > 0) {
                updateTokensStats();
            }
            if (includedUsageData.length > 0) {
                updateIncludedUsageStats();
            }
        } catch (partialError) {
            console.error('部分的な初期化も失敗:', partialError);
        }
    }
});
