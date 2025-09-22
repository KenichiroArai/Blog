<!-- markdownlint-disable MD033 -->
# Cursor使用記録アプリケーション - 機能マッピング

## 📋 概要

このドキュメントは、Cursor使用記録アプリケーションの各ファイルに機能番号を付けて管理するためのマッピング表です。機能ごとにファイルを分類し、保守性と理解性を向上させます。

---

## 🏗️ 機能分類体系

### 1️⃣ コア機能 (F001-F099)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F001** | メインダッシュボード | アプリケーションのメインエントリーポイント | `index.html`<br>`js/index.js` |
| **F002** | 使用記録管理 | Cursor使用状況の記録と表示 | `pages/records.html`<br>`js/records.js` |
| **F003** | サマリー機能 | 使用状況のサマリー表示と分析 | `pages/summary.html`<br>`js/summary.js` |
| **F004** | 使用イベント管理 | 詳細な使用イベントの記録と分析 | `pages/usage-events.html`<br>`js/usage-events.js` |
| **F005** | 旧形式サポート | 旧形式データの表示と管理 | `pages/old-format.html`<br>`pages/old/included-usage.html`<br>`pages/old/usage.html`<br>`js/old/included-usage.js`<br>`js/old/usage.js` |

### 2️⃣ 共通機能 (F100-F199)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F100** | 共通スタイル | アプリケーション全体のスタイリング | `css/common.css` |
| **F101** | 共通JavaScript | 共通で使用されるJavaScript機能 | `js/common.js` |
| **F102** | ヘッダー管理 | ナビゲーションヘッダーの動的読み込み | `components/header-main.html`<br>`components/header-old.html`<br>`js/header-loader.js` |
| **F103** | バージョン情報管理 | アプリケーションのバージョン情報表示 | `components/version-modal.html`<br>`js/version-loader.js`<br>`data/version-info.yaml` |

### 3️⃣ データ管理機能 (F200-F299)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F200** | データファイル | アプリケーションで使用するデータファイル | `record.xlsx` |
| **F201** | 統合データ | 統合された使用データ | `tool/all-raw-events/data/usage-events.csv`<br>`tool/all-raw-events/data/old/usage-tokens.csv`<br>`tool/all-raw-events/data/old/usage-details.csv` |
| **F202** | アーカイブデータ | 過去のデータのアーカイブ | `tool/all-raw-events/input/archive/usage-events/`<br>`tool/all-raw-events/input/old/usage-details/`<br>`tool/all-raw-events/input/old/usage-tokens/` |

### 4️⃣ データ処理機能 (F300-F399)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F300** | データ更新ツール | データの自動更新と処理 | `tool/all-raw-events/update-events.js`<br>`tool/all-raw-events/old/update-details.js`<br>`tool/all-raw-events/old/update-tokens.js` |

### 5️⃣ ドキュメント機能 (F400-F499)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F400** | プロジェクトドキュメント | プロジェクトの説明と管理情報 | `README.md`<br>`FEATURE_MAPPING.md` |

---

## 📝 機能番号付けルール

### 🔢 番号体系

| 範囲 | カテゴリ | 説明 |
|------|----------|------|
| **F001-F099** | コア機能 | メインのアプリケーション機能 |
| **F100-F199** | 共通機能 | 複数の機能で共有される機能 |
| **F200-F299** | データ管理機能 | データファイルとデータベース関連 |
| **F300-F399** | データ処理機能 | データの処理・変換・更新 |
| **F400-F499** | ドキュメント機能 | ドキュメントとメタ情報 |

### 📋 命名規則

- ✅ 機能番号は `F` + 3桁の数字で構成
- ✅ 機能名は日本語で分かりやすく記述
- ✅ 関連ファイルは機能番号の下にリスト化

---

## 🚀 使用方法

### ➕ 新機能追加時

1. **適切な機能カテゴリを決定**
2. **利用可能な機能番号を割り当て**
3. **このマッピングファイルを更新**
4. **ファイル名に機能番号を含める（オプション）**

### 🔍 ファイル検索時

1. **機能番号で目的の機能を特定**
2. **関連ファイルを確認**
3. **機能の依存関係を理解**

### 🔧 保守作業時

1. **変更対象の機能番号を確認**
2. **関連ファイルを特定**
3. **影響範囲を把握**
