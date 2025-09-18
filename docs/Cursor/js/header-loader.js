/**
 * ヘッダーローダー
 * ページの階層に応じて適切なヘッダーを動的に読み込む
 */
class HeaderLoader {
    constructor() {
        this.headerContainer = null;
        this.currentPage = this.getCurrentPage();
    }

    /**
     * 現在のページ名を取得
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    /**
     * ページの階層レベルを判定
     * @returns {number} 階層レベル（0: メインページ, 1: 旧形式ページ）
     */
    getHierarchyLevel() {
        const path = window.location.pathname;
        if (path.includes('/old/')) {
            return 1; // 旧形式ページ
        }
        return 0; // メインページ
    }

    /**
     * ヘッダーファイルのパスを取得
     */
    getHeaderPath() {
        const level = this.getHierarchyLevel();
        if (level === 1) {
            return '../../components/header-old.html';
        }
        return '../components/header-main.html';
    }

    /**
     * アクティブなナビゲーションリンクを設定
     */
    setActiveNavigation() {
        const navLinks = this.headerContainer.querySelectorAll('.nav-link');
        const level = this.getHierarchyLevel();

        navLinks.forEach(link => {
            const href = link.getAttribute('href');

            // 旧形式ページの場合は「旧形式」リンクをアクティブにする
            if (level === 1) {
                if (href && href.includes('old-format.html')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            } else {
                // メインページの場合は通常の判定
                if (href && href.includes(this.currentPage)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }

    /**
     * バージョン情報モーダルのパスを取得
     */
    getVersionModalPath() {
        const level = this.getHierarchyLevel();
        if (level === 1) {
            return '../../components/version-modal.html';
        }
        return '../components/version-modal.html';
    }

    /**
     * バージョン情報モーダルを読み込む
     */
    async loadVersionModal() {
        try {
            const modalPath = this.getVersionModalPath();
            const response = await fetch(modalPath);

            if (!response.ok) {
                throw new Error(`バージョン情報モーダルの読み込みに失敗しました: ${response.status}`);
            }

            const modalHtml = await response.text();

            // モーダルコンテナを取得または作成
            let modalContainer = document.getElementById('version-modal-container');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'version-modal-container';
                document.body.appendChild(modalContainer);
            }

            // モーダルHTMLを挿入
            modalContainer.innerHTML = modalHtml;

        } catch (error) {
            console.error('バージョン情報モーダルの読み込みエラー:', error);
        }
    }

    /**
     * ヘッダーを読み込む
     */
    async loadHeader() {
        try {
            const headerPath = this.getHeaderPath();
            const response = await fetch(headerPath);

            if (!response.ok) {
                throw new Error(`ヘッダーファイルの読み込みに失敗しました: ${response.status}`);
            }

            const headerHtml = await response.text();

            // ヘッダーコンテナを取得または作成
            this.headerContainer = document.getElementById('header-container');
            if (!this.headerContainer) {
                // ヘッダーコンテナが存在しない場合は作成
                this.headerContainer = document.createElement('div');
                this.headerContainer.id = 'header-container';
                document.body.insertBefore(this.headerContainer, document.body.firstChild);
            }

            // ヘッダーHTMLを挿入
            this.headerContainer.innerHTML = headerHtml;

            // アクティブなナビゲーションを設定
            this.setActiveNavigation();

            // バージョン情報モーダルを読み込む
            await this.loadVersionModal();

        } catch (error) {
            console.error('ヘッダーの読み込みエラー:', error);
            // エラー時はフォールバック用のヘッダーを表示
            this.showFallbackHeader();
        }
    }

    /**
     * フォールバック用のヘッダーを表示
     */
    showFallbackHeader() {
        const fallbackHtml = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container">
                    <span class="navbar-brand mb-0 h1">
                        <a href="https://github.com/KenichiroArai/Blog/issues/60" target="_blank" rel="noopener">
                            Cursor使用記録　v0.6.0
                        </a>
                    </span>
                    <div class="navbar-nav ms-auto">
                        <a class="nav-link" href="../index.html">トップページ</a>
                        <a class="nav-link" href="records.html">使用記録</a>
                        <a class="nav-link" href="summary.html">サマリー</a>
                        <a class="nav-link" href="usage-events.html">Usage Events</a>
                        <a class="nav-link" href="old-format.html">旧形式</a>
                    </div>
                </div>
            </nav>
        `;

        if (this.headerContainer) {
            this.headerContainer.innerHTML = fallbackHtml;
        }
    }
}

// ページ読み込み時にヘッダーを自動読み込み
document.addEventListener('DOMContentLoaded', function() {
    const headerLoader = new HeaderLoader();
    headerLoader.loadHeader();
});
