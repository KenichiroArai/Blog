# 串カツメニュー計算サイト 仕様書

## 概要

Excelにまとめた串カツ名と値段を元に、GitHub Pagesで公開する計算サイトを作成する。
ユーザーは串カツの種類・個数を選び、合計金額を確認できる。

## ファイル構成

- ベースパス: `Blog\docs\informal-kushi-tanaka-tool\all-you-can-eat`
- データファイル: `Blog\docs\informal-kushi-tanaka-tool\all-you-can-eat\data\串メニュー.xlsx`
- 実装ファイル:
  - `index.html` - メインHTMLファイル
  - `style.css` - スタイルシート
  - `script.js` - JavaScript機能実装

---

## 実装TODOリスト

### 📋 データ準備

- [x] **Excelファイル（data/串メニュー.xlsx）にメニューデータを準備する**
  - 番号（1-32の連番）
  - 分類（その他、肉串、海鮮串、野菜串、他串、甘串）
  - 名称（串カツの具体的な名前）
  - 単価（各串カツの価格）

### 🏗️ 基本構造

- [x] **index.htmlファイルを作成**
  - メニュー表示テーブル構造
  - プルダウン選択要素
  - 合計金額表示エリア
  - ボタン要素（クリア、初期化）

- [x] **style.cssファイルを作成**
  - レスポンシブデザイン（モバイル・デスクトップ対応）
  - 分類別の色分け表示
  - ユーザビリティを考慮したUI/UX

### ⚙️ 機能実装

- [x] **Excelファイル読み込み機能を実装**
  - SheetJSライブラリを使用
  - CDN経由で読み込み
  - データの動的取得

- [x] **メニュー項目の表示機能を実装**
  - 分類別グループ化表示
  - 番号、分類、名称、単価の表形式表示

- [x] **個数選択プルダウン機能を実装**
  - 各メニュー項目に個数選択
  - 選択後の自動更新

- [x] **合計金額計算機能を実装**
  - 選んだ串カツの合計金額表示
  - プルダウン選択後の自動更新
  - 価格変更時の自動再計算
  - 個数変更時の確実な合計更新

- [x] **ローカルストレージ機能を実装**
  - 選択した個数と値段の保存
  - ページ再読み込み時のデータ復元

- [x] **価格編集機能を実装**
  - 画面上での単価変更
  - 編集後の保存と計算反映

### 🔧 ボタン機能

- [x] **クリアボタン機能を実装**
  - 個数のみを0に初期化

- [x] **初期化ボタン機能を実装**
  - 価格と個数を初期化（Excelデータに戻す）

### 🚀 デプロイ

- [x] **GitHub Pagesでの公開設定とデプロイ**
  - 静的サイトとしての設定
  - ファイル配置の確認
  - ✅ 実装完了、GitHub Pagesで公開可能

---

## 要件詳細

### データ

- Excelファイル（`data`フォルダ内）に以下の情報を用意する
  - **番号**（1-32の連番）
  - **分類**（その他、肉串、海鮮串、野菜串、他串、甘串）
  - **名称**（串カツの具体的な名前）
  - **単価**（各串カツの価格）
- GitHub Pagesに表示できる形式に変換する（例: JSONやCSV）

### メニュー項目詳細

#### 分類別メニュー構成

※以下はメニュー分類と項目の例です。実際の内容はExcelファイルに準じます。

- **その他**（例）: お通しなど
- **肉串**（例）: 串カツ豚、串カツ牛、ハムカツ、豚ヒレ、タコウィンナー、ラム、鶏むね、鶏つくね、ささみ梅大葉、ささみわさび、豚しそ
- **海鮮串**（例）: つぶ貝、アジフライ、キス、たらこ、エビ
- **野菜串**（例）: レンコン、玉ねぎ、じゃが芋、ニンニク、紅しょうが、なすび、しいたけ、トマト、山芋、アスパラ
- **他串**（例）: うずら、チーズ、もち
- **甘串**（例）: クッキー&クリーム、バナナ

### 表示

- 番号、分類、名称、単価を表形式で表示する
- 個数はプルダウンで選択できる
- 分類ごとにグループ化して表示する

### 計算

- 選んだ串カツの**合計金額**を表示する
- プルダウン選択後、自動で合計を更新する
- 価格変更時も自動で合計を再計算する
- 個数変更時に確実に合計金額が反映される

### データ保持

- 選択した個数と値段は**ローカルストレージに保存**される
- ページを再読み込みしてもデータが保持される

### 値段の編集

- 単価は画面上から変更可能
- 編集後は保存され、計算に反映される

### ボタン機能

- **クリアボタン**
  - 個数のみを0に初期化する

- **初期化ボタン**
  - 価格と個数を初期化する（Excelにある元のデータに戻す）

## データ仕様

### Excelファイル形式

- 列構成: 番号、分類、名称、単価
- 項目数と分類数はExcelファイルから自動取得
- 分類（例）: その他、肉串、海鮮串、野菜串、他串、甘串

### データ取得

- 価格情報はExcelファイルから動的に読み込み
- メニュー項目の追加・削除はExcelファイルの更新で対応

## 技術仕様

### 実装技術

- **HTML5**: セマンティックなマークアップで構造化
- **CSS3**: レスポンシブデザインとモダンなUI
- **JavaScript (ES6+)**: 動的機能とローカルストレージ管理

### ファイル構成詳細

#### index.html

- メニュー表示用のテーブル構造
- プルダウン選択要素
- 合計金額表示エリア
- ボタン要素（クリア、初期化）

#### style.css

- レスポンシブデザイン（モバイル・デスクトップ対応）
- 分類別の色分け表示
- ユーザビリティを考慮したUI/UX

#### script.js

- データ読み込み機能（Excel形式）
- 個数選択と合計計算ロジック
- 価格変更時の自動再計算機能
- ローカルストレージの読み書き
- 価格編集機能
- ボタン機能実装

### データ形式

- **Excelファイル直接読み込み**: `data/串メニュー.xlsx`
- GitHub Pagesでバックエンド無しで動作（フロントエンドのみ）
- JavaScriptライブラリを使用してExcelファイルを読み込み

### Excel読み込み方法

#### 使用ライブラリ

- **SheetJS (xlsx.js)**: ExcelファイルをJavaScriptで読み込む
- CDN経由で読み込み: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`

#### データ構造

Excelファイルの列構成:

- A列: 番号
- B列: 分類
- C列: 名称
- D列: 単価

### GitHub Pages対応

- **静的サイト**: バックエンドサーバー不要
- **データ読み込み**: SheetJSライブラリでExcelファイルを直接読み込み
- **ファイル配置**:

```text
  all-you-can-eat/
  ├── index.html
  ├── style.css
  ├── script.js
  └── data/
      └── 串メニュー.xlsx
```

- **CORS制限**: 同一ドメイン内のファイルアクセスのため制限なし

### 実装例

```javascript
// Excelファイル読み込み
function loadExcelData() {
  fetch('./data/串メニュー.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, {type: 'array'});
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      // データを処理
    });
}

// 個数更新と合計計算
function updateQuantity(itemId, quantity) {
  const numQuantity = parseInt(quantity);
  if (!currentSelections[itemId]) {
    currentSelections[itemId] = {};
  }
  currentSelections[itemId].quantity = numQuantity;

  // 価格が設定されていない場合は元の価格を設定
  if (currentSelections[itemId].price === undefined) {
    const originalItem = menuData.find(item => item.id == itemId);
    if (originalItem) {
      currentSelections[itemId].price = originalItem.price;
    }
  }

  saveToLocalStorage();
  calculateTotal();
}

// 合計金額計算（価格変更対応）
function calculateTotal() {
  let total = 0;
  Object.keys(currentSelections).forEach(itemId => {
    const selection = currentSelections[itemId];
    if (selection.quantity > 0) {
      const price = selection.price !== undefined ? selection.price :
                   menuData.find(item => item.id == itemId)?.price || 0;
      total += selection.quantity * price;
    }
  });
  totalAmount.textContent = `¥${total.toLocaleString()}`;
}
```
