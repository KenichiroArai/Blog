// グローバル変数
let menuData = [];
let originalMenuData = [];
let currentSelections = {};

// DOM要素の取得
const loadingMessage = document.getElementById('loadingMessage');
const menuContent = document.getElementById('menuContent');
const totalAmount = document.getElementById('totalAmount');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    loadExcelData();
    setupEventListeners();
    loadFromLocalStorage();
});

// イベントリスナーの設定
function setupEventListeners() {
    clearBtn.addEventListener('click', clearSelections);
    resetBtn.addEventListener('click', resetToOriginal);
}

// Excelファイル読み込み機能
async function loadExcelData() {
    try {
        // Excelファイルを読み込む
        const response = await fetch('./data/串メニュー.xlsx');
        if (!response.ok) {
            throw new Error(`Excelファイルの読み込みに失敗しました: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // データを処理（ヘッダー行をスキップ）
        menuData = data.slice(1).map((row, index) => ({
            id: index + 1,
            number: row[0] || index + 1,
            category: row[1] || 'その他',
            name: row[2] || '',
            price: parseFloat(row[3]) || 0
        })).filter(item => item.name.trim() !== ''); // 空の行を除外

        // 元データを保存
        originalMenuData = JSON.parse(JSON.stringify(menuData));

        // メニューを表示
        displayMenu();

        // ローカルストレージから復元
        restoreFromLocalStorage();

        // 合計金額を計算
        calculateTotal();

    } catch (error) {
        console.error('Excelファイルの読み込みに失敗しました:', error);
        loadingMessage.innerHTML = 'メニューの読み込みに失敗しました。<br>Excelファイルが正しく配置されているか確認してください。';
    }
}


// メニュー表示機能
function displayMenu() {
    loadingMessage.style.display = 'none';
    menuContent.style.display = 'block';

    // 分類別にグループ化
    const groupedData = groupByCategory(menuData);

    let html = '';

    Object.keys(groupedData).forEach(category => {
        html += `
            <div class="category-section category-${category}">
                <div class="category-header">${category}</div>
                <table class="menu-table">
                    <thead>
                        <tr>
                            <th>番号</th>
                            <th>名称</th>
                            <th>単価</th>
                            <th>個数</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        groupedData[category].forEach(item => {
            const currentQuantity = currentSelections[item.id]?.quantity || 0;
            const currentPrice = currentSelections[item.id]?.price || item.price;

            html += `
                <tr>
                    <td class="item-number">${item.number}</td>
                    <td class="item-name">${item.name}</td>
                    <td class="item-price">
                        <input type="number"
                               class="price-input"
                               value="${currentPrice}"
                               min="0"
                               step="1"
                               data-item-id="${item.id}"
                               onchange="updatePrice(${item.id}, this.value)">
                    </td>
                    <td>
                        <select class="quantity-select"
                                data-item-id="${item.id}"
                                onchange="updateQuantity(${item.id}, this.value)">
                            ${generateQuantityOptions(currentQuantity)}
                        </select>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    menuContent.innerHTML = html;
}

// 分類別グループ化
function groupByCategory(data) {
    return data.reduce((groups, item) => {
        const category = item.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});
}

// 個数選択オプション生成
function generateQuantityOptions(currentQuantity) {
    let options = '';
    for (let i = 0; i <= 20; i++) {
        const selected = i === currentQuantity ? 'selected' : '';
        options += `<option value="${i}" ${selected}>${i}</option>`;
    }
    return options;
}

// 個数更新機能
function updateQuantity(itemId, quantity) {
    const numQuantity = parseInt(quantity);

    if (!currentSelections[itemId]) {
        currentSelections[itemId] = {};
    }

    currentSelections[itemId].quantity = numQuantity;

    // ローカルストレージに保存
    saveToLocalStorage();

    // 合計金額を再計算
    calculateTotal();
}

// 価格更新機能
function updatePrice(itemId, price) {
    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice < 0) {
        alert('正しい価格を入力してください。');
        return;
    }

    if (!currentSelections[itemId]) {
        currentSelections[itemId] = {};
    }

    currentSelections[itemId].price = numPrice;

    // ローカルストレージに保存
    saveToLocalStorage();

    // 合計金額を再計算
    calculateTotal();
}

// 合計金額計算機能
function calculateTotal() {
    let total = 0;

    Object.keys(currentSelections).forEach(itemId => {
        const selection = currentSelections[itemId];
        if (selection.quantity > 0) {
            const price = selection.price || 0;
            total += selection.quantity * price;
        }
    });

    totalAmount.textContent = `¥${total.toLocaleString()}`;
}

// ローカルストレージ保存
function saveToLocalStorage() {
    localStorage.setItem('kushikatsuSelections', JSON.stringify(currentSelections));
    localStorage.setItem('kushikatsuMenuData', JSON.stringify(menuData));
}

// ローカルストレージ読み込み
function loadFromLocalStorage() {
    const savedSelections = localStorage.getItem('kushikatsuSelections');
    const savedMenuData = localStorage.getItem('kushikatsuMenuData');

    if (savedSelections) {
        currentSelections = JSON.parse(savedSelections);
    }

    if (savedMenuData) {
        menuData = JSON.parse(savedMenuData);
    }
}

// ローカルストレージから復元
function restoreFromLocalStorage() {
    if (Object.keys(currentSelections).length > 0) {
        // メニュー表示後に復元
        setTimeout(() => {
            displayMenu();
            calculateTotal();
        }, 100);
    }
}

// クリアボタン機能
function clearSelections() {
    if (confirm('選択した個数をすべてクリアしますか？')) {
        currentSelections = {};
        saveToLocalStorage();
        displayMenu();
        calculateTotal();
    }
}

// 初期化ボタン機能
function resetToOriginal() {
    if (confirm('価格と個数を初期状態に戻しますか？')) {
        menuData = JSON.parse(JSON.stringify(originalMenuData));
        currentSelections = {};
        saveToLocalStorage();
        displayMenu();
        calculateTotal();
    }
}

// デバッグ用関数（開発時のみ使用）
function debugInfo() {
    console.log('Menu Data:', menuData);
    console.log('Original Menu Data:', originalMenuData);
    console.log('Current Selections:', currentSelections);
    console.log('Local Storage:', localStorage.getItem('kushikatsuSelections'));
}
