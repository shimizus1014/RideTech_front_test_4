// 4-2 機能実装: ハンバーガー, FAQ, モーダル, タブ, ロゴ自動スクロールを実装してください
//ハンバーガー開閉
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
  
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
});


//faqアコーディオン
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faqList h3');

    faqItems.forEach(h3 => {
        h3.addEventListener('click', () => {
            const parent = h3.parentElement;

            // 開閉切り替え
            parent.classList.toggle('active');
        });
    });
});

//タブ切り替えコンポーネント
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tabBtn');
    const content = document.getElementById('tabContent');

    // タブごとの表示内容
    const tabTexts = {
        overview: 'タブUIの静的な雛形です。',
        specification: 'タブボタンには data-tab 属性を付与し、対応する id のパネルを表示。表示/非表示はクラス操作のみ。',
        points: 'キーボード操作やフォーカス管理は後続の実装で対応予定です。'
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. 全タブの色をリセット
            tabs.forEach(t => t.classList.remove('tabBtnblue'));

            // 2. クリックされたタブを青色に
            tab.classList.add('tabBtnblue');

            // 3. コンテンツ切替
            const key = tab.dataset.tab;
            content.innerHTML = `<p>${tabTexts[key]}</p>`;
        });
    });
});

//モーダル
document.addEventListener('DOMContentLoaded', () => {
    const modalBtn = document.getElementById('modalDemoBtn');
    const modal = document.getElementById('demoModal');
    const closeBtn = modal.querySelector('.modalClose');
    const okBtn = modal.querySelector('.modalOk');
    const cancelBtn = modal.querySelector('.modalCancel');

    // 背景スクロール制御
    function disableScroll() {
        document.body.style.overflow = 'hidden';
    }
    function enableScroll() {
        document.body.style.overflow = '';
    }

    // 開く
    modalBtn.addEventListener('click', () => {
        modal.classList.add('show');
        disableScroll();
    });

    // ×で閉じる
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        enableScroll();
    });

    // OKで閉じる
    okBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        enableScroll();
    });

    // 閉じるボタンで閉じる
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        enableScroll();
    });

    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            enableScroll();
        }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && modal.classList.contains('show')) {
            modal.classList.remove('show');
            enableScroll();
        }
    });
});