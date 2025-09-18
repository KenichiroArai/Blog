/**
 * バージョン情報を管理するクラス
 */
class VersionLoader {
    constructor() {
        this.versionInfo = null;
        this.yamlPath = './data/version-info.yaml';
    }

    /**
     * YAMLファイルからバージョン情報を読み込む
     * @returns {Promise<Object>} バージョン情報オブジェクト
     */
    async loadVersionInfo() {
        try {
            const response = await fetch(this.yamlPath);
            if (!response.ok) {
                throw new Error(`YAMLファイルの読み込みに失敗しました: ${response.status}`);
            }

            const yamlText = await response.text();
            this.versionInfo = this.parseYaml(yamlText);
            return this.versionInfo;
        } catch (error) {
            console.error('バージョン情報の読み込みエラー:', error);
            // フォールバック値を返す
            return this.getDefaultVersionInfo();
        }
    }

    /**
     * 簡易YAML解析（基本的なYAML構造のみサポート）
     * @param {string} yamlText - YAML文字列
     * @returns {Object} 解析されたオブジェクト
     */
    parseYaml(yamlText) {
        const lines = yamlText.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        const result = {};
        let currentSection = result;
        let sectionStack = [result];
        let currentKey = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            const indent = line.length - line.trimStart().length;

            // リスト項目の場合
            if (trimmedLine.startsWith('- ')) {
                const value = trimmedLine.substring(2).replace(/^"(.*)"$/, '$1');
                if (currentKey && Array.isArray(currentSection[currentKey])) {
                    currentSection[currentKey].push(value);
                } else if (currentKey) {
                    currentSection[currentKey] = [value];
                }
                continue;
            }

            // キー:値のペアの場合
            if (trimmedLine.includes(':')) {
                const [key, ...valueParts] = trimmedLine.split(':');
                const value = valueParts.join(':').trim();

                if (value) {
                    // 値がある場合
                    currentSection[key.trim()] = value.replace(/^"(.*)"$/, '$1');
                    currentKey = key.trim();
                } else {
                    // セクションの開始
                    currentSection[key.trim()] = {};
                    currentSection = currentSection[key.trim()];
                    currentKey = key.trim();
                }
            }
        }

        return result;
    }

    /**
     * デフォルトのバージョン情報を返す
     * @returns {Object} デフォルトのバージョン情報
     */
    getDefaultVersionInfo() {
        return {
            version: {
                current: "v0.6.0"
            },
            github: {
                issue_url: "https://github.com/KenichiroArai/Blog/issues/60",
                issue_number: 60
            },
            features: [
                "Cursor使用状況の総合的な記録・分析",
                "使用統計とグラフによる可視化",
                "コスト分析とトークン使用量の追跡",
                "使用イベントの詳細な記録"
            ],
            metadata: {
                title: "アプリケーション情報",
                description: "Cursor使用状況管理アプリケーション"
            }
        };
    }

    /**
     * バージョン情報を取得する
     * @returns {Object|null} バージョン情報
     */
    getVersionInfo() {
        return this.versionInfo;
    }

    /**
     * 現在のバージョンを取得する
     * @returns {string} 現在のバージョン
     */
    getCurrentVersion() {
        return this.versionInfo?.version?.current || "v0.6.0";
    }

    /**
     * GitHub URLを取得する
     * @returns {string} GitHub URL
     */
    getGitHubUrl() {
        return this.versionInfo?.github?.issue_url || "https://github.com/KenichiroArai/Blog/issues/60";
    }

    /**
     * 機能リストを取得する
     * @returns {Array<string>} 機能リスト
     */
    getFeatures() {
        return this.versionInfo?.features || [];
    }

    /**
     * アプリケーションタイトルを取得する
     * @returns {string} アプリケーションタイトル
     */
    getTitle() {
        return this.versionInfo?.metadata?.title || "アプリケーション情報";
    }
}

// グローバルインスタンスを作成
window.versionLoader = new VersionLoader();

/**
 * バージョン情報を初期化する関数
 * @returns {Promise<void>}
 */
async function initializeVersionInfo() {
    try {
        await window.versionLoader.loadVersionInfo();
        console.log('バージョン情報が正常に読み込まれました');
    } catch (error) {
        console.error('バージョン情報の初期化に失敗しました:', error);
    }
}

// DOM読み込み完了時にバージョン情報を初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVersionInfo);
} else {
    initializeVersionInfo();
}
