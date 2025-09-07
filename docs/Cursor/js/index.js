// 初期化処理
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadExcelFile();
        await loadUsageData(); // 統合されたトークンデータを読み込み
        await loadIncludedUsageData();
        await loadSummaryData(); // Summaryデータを読み込み
        await loadUsageEventsData(); // Usage Eventsデータを読み込み
        updateLatestRecord();
        updateTokensStats();
        updateIncludedUsageStats();
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
            if (usageData.length > 0) {
                updateTokensStats();
            }
            if (includedUsageData.length > 0) {
                updateIncludedUsageStats();
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
