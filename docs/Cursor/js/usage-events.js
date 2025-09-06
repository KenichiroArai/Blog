// Usage Events ページのJavaScript
$(document).ready(function() {
    let usageEventsData = [];
    let dailyEventsChart = null;
    let dailyTokensChart = null;

    // CSVファイルを読み込む
    function loadUsageEventsData() {
        showLoading(true);
        hideError();

        // CSVファイルのパス
        const csvPath = '../Tool/AllRawEvents/data/usage-events.csv';

        fetch(csvPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(csvText => {
                usageEventsData = parseCSV(csvText);
                displayUsageEventsData();
                updateStatistics();
                createCharts();
                showLoading(false);
            })
            .catch(error => {
                console.error('Error loading usage events data:', error);
                showError('データの読み込みに失敗しました: ' + error.message);
                showLoading(false);
            });
    }

    // CSVをパースする
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
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

        return data;
    }

    // CSV行をパースする（カンマ区切り、引用符対応）
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
        return result;
    }

    // データをテーブルに表示
    function displayUsageEventsData() {
        const tableBody = $('#usage-events-table tbody');
        tableBody.empty();

        usageEventsData.forEach((row, index) => {
            const tr = $('<tr>');

            // 日時のフォーマット
            const date = new Date(row.Date);
            const formattedDate = date.toLocaleString('ja-JP');

            // 種別の色分け
            let kindClass = '';
            if (row.Kind === 'Included') {
                kindClass = 'text-success';
            } else if (row.Kind.includes('Errored')) {
                kindClass = 'text-danger';
            }

            tr.append(`<td>${formattedDate}</td>`);
            tr.append(`<td><span class="${kindClass}">${row.Kind}</span></td>`);
            tr.append(`<td>${row.Model}</td>`);
            tr.append(`<td>${row['Max Mode']}</td>`);
            tr.append(`<td>${formatNumber(row['Input (w/ Cache Write)'])}</td>`);
            tr.append(`<td>${formatNumber(row['Input (w/o Cache Write)'])}</td>`);
            tr.append(`<td>${formatNumber(row['Cache Read'])}</td>`);
            tr.append(`<td>${formatNumber(row['Output Tokens'])}</td>`);
            tr.append(`<td>${formatNumber(row['Total Tokens'])}</td>`);
            tr.append(`<td>${row.Cost}</td>`);

            tableBody.append(tr);
        });

        // DataTablesを初期化
        $('#usage-events-table').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ja.json'
            },
            pageLength: 25,
            order: [[0, 'desc']], // 日時で降順ソート
            columnDefs: [
                { targets: [4, 5, 6, 7, 8], className: 'text-end' } // 数値列を右寄せ
            ]
        });
    }

    // 統計情報を更新
    function updateStatistics() {
        const totalEvents = usageEventsData.length;
        const successfulEvents = usageEventsData.filter(row => row.Kind === 'Included').length;
        const errorEvents = usageEventsData.filter(row => row.Kind.includes('Errored')).length;

        // 総トークン数を計算
        const totalTokens = usageEventsData.reduce((sum, row) => {
            const tokens = parseInt(row['Total Tokens']) || 0;
            return sum + tokens;
        }, 0);

        $('#total-events').text(totalEvents.toLocaleString());
        $('#successful-events').text(successfulEvents.toLocaleString());
        $('#error-events').text(errorEvents.toLocaleString());
        $('#total-tokens').text(totalTokens.toLocaleString());
    }

    // グラフを作成
    function createCharts() {
        createDailyEventsChart();
        createDailyTokensChart();
    }

    // 日別イベント数グラフ
    function createDailyEventsChart() {
        const ctx = document.getElementById('daily-events-chart').getContext('2d');

        // 日別データを集計
        const dailyData = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, successful: 0, error: 0 };
            }
            dailyData[date].total++;
            if (row.Kind === 'Included') {
                dailyData[date].successful++;
            } else if (row.Kind.includes('Errored')) {
                dailyData[date].error++;
            }
        });

        const dates = Object.keys(dailyData).sort();
        const totalData = dates.map(date => dailyData[date].total);
        const successfulData = dates.map(date => dailyData[date].successful);
        const errorData = dates.map(date => dailyData[date].error);

        if (dailyEventsChart) {
            dailyEventsChart.destroy();
        }

        dailyEventsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: '総イベント数',
                        data: totalData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: '成功イベント',
                        data: successfulData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'エラーイベント',
                        data: errorData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    // 日別トークン使用量グラフ
    function createDailyTokensChart() {
        const ctx = document.getElementById('daily-tokens-chart').getContext('2d');

        // 日別トークン数を集計
        const dailyTokens = {};
        usageEventsData.forEach(row => {
            const date = new Date(row.Date).toLocaleDateString('ja-JP');
            const tokens = parseInt(row['Total Tokens']) || 0;
            if (!dailyTokens[date]) {
                dailyTokens[date] = 0;
            }
            dailyTokens[date] += tokens;
        });

        const dates = Object.keys(dailyTokens).sort();
        const tokenData = dates.map(date => dailyTokens[date]);

        if (dailyTokensChart) {
            dailyTokensChart.destroy();
        }

        dailyTokensChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: '総トークン数',
                    data: tokenData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    // 数値をフォーマット
    function formatNumber(num) {
        const number = parseInt(num);
        if (isNaN(number)) return num;
        return number.toLocaleString();
    }

    // ローディング表示
    function showLoading(show) {
        if (show) {
            $('#loading').removeClass('d-none');
        } else {
            $('#loading').addClass('d-none');
        }
    }

    // エラー表示
    function showError(message) {
        $('#error-message').text(message).removeClass('d-none');
    }

    // エラー非表示
    function hideError() {
        $('#error-message').addClass('d-none');
    }

    // データ読み込み開始
    loadUsageEventsData();
});
