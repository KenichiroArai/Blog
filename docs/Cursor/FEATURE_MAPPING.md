<!-- markdownlint-disable MD033 -->
# Cursor使用記録アプリケーション - 機能マッピング

## 📋 概要

このドキュメントは、Cursor使用記録アプリケーションの各ファイルに機能番号を付けて管理するためのマッピング表です。機能ごとにファイルを分類し、保守性と理解性を向上させます。

---

## 🏗️ 機能分類体系

### 1️⃣ アプリ機能 (A001-A099)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **A001** | メインダッシュボード | アプリケーションのメインエントリーポイント | `index.html`<br>`js/index.js` |
| **A002** | レコード管理 | Cursor使用状況の記録と表示 | `pages/records.html`<br>`js/records.js` |
| **A003** | 使用状況表示 | 使用状況データの表示 | `pages/old/usage.html`<br>`js/old/usage.js` |
| **A004** | 旧形式 | 旧形式の一覧の表示 | `pages/old-format.html` |
| **A005** | 含まれる使用状況表示 | 含まれる使用状況データの表示 | `pages/old/included-usage.html`<br>`js/old/included-usage.js` |
| **A006** | サマリー機能 | 使用状況のサマリー表示と分析 | `pages/summary.html`<br>`js/summary.js` |
| **A007** | 使用イベント管理 | 詳細な使用イベントの記録と分析 | `pages/usage-events.html`<br>`js/usage-events.js` |

### 2️⃣ 共通機能 (F001-F099)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F001** | 共通スタイル | アプリケーション全体のスタイリング | `css/common.css` |
| **F002** | 共通JavaScript | 共通で使用されるJavaScript機能 | `js/common.js` |
| **F003** | ヘッダー管理 | ナビゲーションヘッダーの動的読み込み | `components/header-main.html`<br>`components/header-old.html`<br>`js/header-loader.js` |
| **F004** | バージョン情報管理 | アプリケーションのバージョン情報表示 | `components/version-modal.html`<br>`js/version-loader.js`<br>`data/version-info.yaml` |

### 3️⃣ データ処理機能 (F100-F199)

| 機能番号 | 機能名 | 目的 | ファイル |
|---------|--------|------|----------|
| **F100** | データ更新ツール | データの自動更新と処理 | `tool/all-raw-events/update-events.js`<br>`tool/all-raw-events/old/update-details.js`<br>`tool/all-raw-events/old/update-tokens.js` |

---

## 📝 機能番号付けルール

### 🔢 番号体系

| 範囲 | カテゴリ | 説明 |
|------|----------|------|
| **A001-A099** | アプリ機能 | メインのアプリケーション機能 |
| **F001-F099** | 共通機能 | 複数の機能で共有される機能 |
| **F100-F199** | データ処理機能 | データの処理・変換・更新 |

### 📋 命名規則

- ✅ 機能番号は `A`（アプリ機能）または `F`（その他機能） + 3桁の数字で構成
- ✅ ファイル名は「機能番号 + `-` + 機能名 + 拡張子」とするが、ファイル名内の機能番号は小文字（例: `a001-XXX.html`）にする
- ✅ 関連ファイルは機能番号の下にリスト化
