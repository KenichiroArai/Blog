// グローバル変数
let menuData = [];
let originalMenuData = [];
let currentSelections = {};
let taxRate = 0.1; // デフォルト税率10%

// DOM要素の取得
const loadingMessage = document.getElementById('loadingMessage');
const menuContent = document.getElementById('menuContent');
const totalAmount = document.getElementById('totalAmount');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
let taxRateInput = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    taxRateInput = document.getElementById('taxRateInput');
    loadExcelData();
    setupEventListeners();
    loadFromLocalStorage();
});

// イベントリスナーの設定
function setupEventListeners() {
    clearBtn.addEventListener('click', clearSelections);
    resetBtn.addEventListener('click', resetToOriginal);
    if (taxRateInput) {
        taxRateInput.addEventListener('change', updateTaxRate);
        taxRateInput.addEventListener('input', updateTaxRate);
    }
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
            price: parseFloat(row[3]) || 0,
            priceWithTax: parseFloat(row[4]) || 0
        })).filter(item => item.name.trim() !== ''); // 空の行を除外

        // 元データを保存
        originalMenuData = JSON.parse(JSON.stringify(menuData));

        // メニューを表示
        displayMenu();

        // ローカルストレージから復元
        restoreFromLocalStorage();

        // 税率を読み込み
        loadTaxRate();

        // 合計金額を計算
        calculateTotal();

    } catch (error) {
        console.error('Excelファイルの読み込みに失敗しました:', error);
        loadingMessage.innerHTML = 'メニューの読み込みに失敗しました。<br>Excelファイルが正しく配置されているか確認してください。';
    }
}


// 税込み価格計算関数
function calculatePriceWithTax(price) {
    return Math.round(price * (1 + taxRate));
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
                <div class="category-header" data-category="${category}">${category}</div>
                <table class="menu-table">
                    <thead>
                        <tr>
                            <th>番号</th>
                            <th>名称</th>
                            <th>単価</th>
                            <th>税込み価格</th>
                            <th>個数</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        groupedData[category].forEach(item => {
            const currentQuantity = currentSelections[item.id]?.quantity || 0;
            const currentPrice = currentSelections[item.id]?.price || item.price;
            const priceWithTax = calculatePriceWithTax(currentPrice);

            html += `
                <tr data-item-id="${item.id}">
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
                    <td class="item-price-with-tax" data-item-id="${item.id}">¥${priceWithTax.toLocaleString()}</td>
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

    // 分類ごとの合計金額を表示
    updateCategoryTotals();
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

    // 価格が設定されていない場合は、元の価格を設定
    if (currentSelections[itemId].price === undefined) {
        const originalItem = menuData.find(item => item.id == itemId);
        if (originalItem) {
            currentSelections[itemId].price = originalItem.price;
        }
    }

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

    // 税込み価格を更新
    updatePriceWithTaxDisplay(itemId, numPrice);

    // ローカルストレージに保存
    saveToLocalStorage();

    // 合計金額を再計算
    calculateTotal();
}

// 税込み価格表示を更新
function updatePriceWithTaxDisplay(itemId, price) {
    const priceWithTaxElement = document.querySelector(`.item-price-with-tax[data-item-id="${itemId}"]`);
    if (priceWithTaxElement) {
        const priceWithTax = calculatePriceWithTax(price);
        priceWithTaxElement.textContent = `¥${priceWithTax.toLocaleString()}`;
    }
}

// 税率更新機能
function updateTaxRate() {
    if (!taxRateInput) return;

    const newTaxRate = parseFloat(taxRateInput.value) / 100;

    if (isNaN(newTaxRate) || newTaxRate < 0) {
        alert('正しい税率を入力してください。');
        return;
    }

    taxRate = newTaxRate;

    // ローカルストレージに保存
    saveTaxRate();

    // すべての税込み価格表示を更新
    updateAllPriceWithTaxDisplays();

    // 合計金額を再計算
    calculateTotal();
}

// すべての税込み価格表示を更新
function updateAllPriceWithTaxDisplays() {
    menuData.forEach(item => {
        const currentPrice = currentSelections[item.id]?.price || item.price;
        updatePriceWithTaxDisplay(item.id, currentPrice);
    });
}

// 合計金額計算機能
function calculateTotal() {
    let total = 0;
    let totalWithTax = 0;

    Object.keys(currentSelections).forEach(itemId => {
        const selection = currentSelections[itemId];
        if (selection.quantity > 0) {
            const item = menuData.find(item => item.id == itemId);
            if (item) {
                // 価格が変更されている場合はselection.price、そうでなければ元のmenuDataから取得
                const price = selection.price !== undefined ? selection.price : item.price || 0;
                total += selection.quantity * price;
                // 税込み価格の合計（計算値を使用）
                totalWithTax += selection.quantity * calculatePriceWithTax(price);
            }
        }
    });

    totalAmount.innerHTML = `¥${total.toLocaleString()} <span class="total-with-tax">(税込: ¥${totalWithTax.toLocaleString()})</span>`;

    // 分類ごとの合計金額も更新
    updateCategoryTotals();
}

// 分類ごとの合計金額計算機能
function calculateCategoryTotal(category) {
    let categoryTotal = 0;
    let categoryTotalWithTax = 0;

    const categoryItems = menuData.filter(item => item.category === category);

    categoryItems.forEach(item => {
        const selection = currentSelections[item.id];
        if (selection && selection.quantity > 0) {
            const price = selection.price !== undefined ? selection.price : item.price;
            categoryTotal += selection.quantity * price;
            // 税込み価格の合計（計算値を使用）
            categoryTotalWithTax += selection.quantity * calculatePriceWithTax(price);
        }
    });

    return { total: categoryTotal, totalWithTax: categoryTotalWithTax };
}

// 分類ごとの合計金額表示更新
function updateCategoryTotals() {
    const categoryHeaders = document.querySelectorAll('.category-header');

    categoryHeaders.forEach(header => {
        // 既存の合計金額表示を削除
        const existingTotal = header.querySelector('.category-total');
        if (existingTotal) {
            existingTotal.remove();
        }

        // 分類名を取得（data属性から）
        const categoryName = header.getAttribute('data-category');

        // 分類ごとの合計金額を計算
        const totals = calculateCategoryTotal(categoryName);

        // 合計金額が0より大きい場合のみ表示
        if (totals.total > 0) {
            const totalElement = document.createElement('span');
            totalElement.className = 'category-total';
            totalElement.innerHTML = ` ¥${totals.total.toLocaleString()} <span class="category-total-with-tax">(税込: ¥${totals.totalWithTax.toLocaleString()})</span>`;
            header.appendChild(totalElement);
        }
    });
}

// ローカルストレージ保存
function saveToLocalStorage() {
    localStorage.setItem('kushikatsuSelections', JSON.stringify(currentSelections));
    localStorage.setItem('kushikatsuMenuData', JSON.stringify(menuData));
}

// 税率をローカルストレージに保存
function saveTaxRate() {
    localStorage.setItem('kushikatsuTaxRate', taxRate.toString());
}

// 税率をローカルストレージから読み込み
function loadTaxRate() {
    const savedTaxRate = localStorage.getItem('kushikatsuTaxRate');
    if (savedTaxRate) {
        taxRate = parseFloat(savedTaxRate);
        if (taxRateInput) {
            taxRateInput.value = (taxRate * 100).toFixed(1);
        }
    }
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
        // 個数のみを0に初期化（価格は保持）
        Object.keys(currentSelections).forEach(itemId => {
            if (currentSelections[itemId]) {
                currentSelections[itemId].quantity = 0;
            }
        });
        saveToLocalStorage();
        displayMenu();
        calculateTotal();
    }
}

// 初期化ボタン機能
function resetToOriginal() {
    if (confirm('価格と個数を初期状態に戻しますか？')) {
        // 価格と個数を初期化（Excelデータに戻す）
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
