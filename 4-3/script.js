// Async Mart - 非同期処理テスト用スクリプト（素のJS）
// 学習目的：fetch + async/await を用いた GET / POST、並列取得、タイムアウト、状態切替の実装

// ===== ユーティリティ（そのまま使用可） =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// ===== ここから実装対象 =====
// タイムアウト付き fetch（AbortController を使って中断可能にする）
async function fetchJSON(url, { timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// モック POST エンドポイント（/api/contact）
// 今回のテストではサーバは用意しないため、特定URLはモック動作でOK
async function postJSON(url, payload, { timeoutMs = 5000 } = {}) {

  await new Promise(resolve => setTimeout(resolve, 2000));

 // 成功モック
  if (url === '/api/contact') {
    return { success: true };
  }else{
    throw new Error('送信に失敗しました');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ===== 状態管理（そのまま使用） =====
const dom = {
  status: $('#status'),
  loading: $('#loading'),
  error: $('#error'),
  empty: $('#empty'),
  retry: $('#retry'),
  list: $('#list'),
  modalRoot: $('#modal-root'),
  form: $('#contact-form'),
  result: $('#contact-result'),
};

function setStatus(msg) {
  dom.status.textContent = msg ?? '';
}
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function startLoading() {
  hide(dom.error); hide(dom.empty);
  show(dom.loading); setStatus('読み込み中…');
  dom.list.innerHTML = '';
}
function stopLoading() { hide(dom.loading); setStatus(''); }

function showError(message = 'エラーが発生しました。') {
  stopLoading(); show(dom.error);
  $('.notice-text', dom.error).textContent = message;
}
function showEmpty() { stopLoading(); show(dom.empty); }

function renderList(items) {
  stopLoading();
  if (!items || items.length === 0) { showEmpty(); return; }
  dom.list.innerHTML = items.map(toCardHTML).join('');
  // 「詳細」ボタンにイベント付与
  $$('.js-detail', dom.list).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.dataset.id);
      const product = items.find(p => p.id === id);
      if (product) openDetail(product);
    });
  });
}

function toCardHTML(p) {
  const price = new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY' }).format(p.price);
  return `
<li class="card">
  <div class="card-media">
    <img src="${p.image}" alt="${p.name}" width="320" height="200" />
  </div>
  <div class="card-body">
    <h3 class="card-title">${p.name}</h3>
    <p class="card-meta">${p.category} ／ 評価：${p.rating}</p>
    <p class="card-meta">価格：${price}</p>
    <div class="card-actions">
      <button class="btn btn-outline js-detail" type="button" data-id="${p.id}">詳細</button>
    </div>
  </div>
</li>
`.trim();
}

// ===== 詳細モーダル =====
async function openDetail(product) {
  document.body.classList.add('is-modal-open');
  dom.modalRoot.innerHTML = modalSkeleton(product);

  try {
    // TODO: 実装者が書く
    // 実装ポイント：
    //  1) reviews.json の取得を Promise.all で並列実行（将来の拡張を見据えた書き方）
    //     例）const [reviews] = await Promise.all([ fetchJSON('./data/reviews.json') ]);
    //  2) product.id で reviews をフィルタリング
    //  3) $('.modal-body', dom.modalRoot).innerHTML = detailHTML(product, list) で描画

     // 1) reviews.json を取得（並列取得の形）
     const [reviews] = await Promise.all([
      fetchJSON('./data/reviews.json')
    ]);

    // 2) 対象商品のレビューだけに絞る
    const list = reviews.filter(r => r.productId === product.id);

    // 3) 詳細を描画
    $('.modal-body', dom.modalRoot).innerHTML =
      detailHTML(product, list);

  } catch (e) {
    $('.modal-body', dom.modalRoot).innerHTML = `<p class="notice-text">詳細の取得に失敗しました。</p>`;
  }

  // 閉じる
  $('.modal-close', dom.modalRoot).addEventListener('click', closeModal);
  $('.modal-backdrop', dom.modalRoot).addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
  window.addEventListener('keydown', onEscClose);
}

function modalSkeleton(p) {
  return `
<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal">
    <div class="modal-header">
      <h3 id="modal-title" class="modal-title">${p.name}</h3>
      <button class="modal-close" aria-label="閉じる" type="button">×</button>
    </div>
    <div class="modal-body">
      <p>読み込み中…</p>
    </div>
  </div>
</div>`;
}

function detailHTML(p, reviews) {
  const price = new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY' }).format(p.price);
  const revHTML = reviews.length
    ? `<ul>${reviews.map(r => `<li>★${r.stars} ${escapeHTML(r.author)}：${escapeHTML(r.comment)}</li>`).join('')}</ul>`
    : `<p>レビューはまだありません。</p>`;

  return `
  <figure>
    <img src="${p.image}" alt="${p.name}" width="640" height="400" />
    <figcaption class="card-meta">${p.category} ／ 評価：${p.rating} ／ 価格：${price}</figcaption>
  </figure>
  <div>
    <h4>商品説明</h4>
    <p>${escapeHTML(p.description || '説明は準備中です。')}</p>
  </div>
  <div>
    <h4>レビュー</h4>
    ${revHTML}
  </div>
  `;
}

function closeModal() {
  document.body.classList.remove('is-modal-open');
  dom.modalRoot.innerHTML = '';
  window.removeEventListener('keydown', onEscClose);
}
function onEscClose(e) { if (e.key === 'Escape') closeModal(); }

function escapeHTML(str='') {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[s]);
}

// ===== お問い合わせ（POST） =====
function handleContact() {
  dom.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    dom.result.textContent = '送信中…';
    const form = new FormData(dom.form);
    const payload = {
      name: form.get('name')?.toString().trim(),
      email: form.get('email')?.toString().trim(),
      message: form.get('message')?.toString().trim(),
    };

    try {
      // 1) POST（モック or 本番）
      await postJSON('/api/contact', payload);

      // 2) 成功時
      dom.result.textContent = '送信しました。';
      dom.form.reset();

    } catch (err) {
      dom.result.textContent = String(err?.message || '送信に失敗しました。');
    }
  });
}

// ===== 初期化 =====
async function init() {
  dom.retry.addEventListener('click', loadProducts);
  handleContact();
  await loadProducts();
}

async function loadProducts() {
  startLoading();
  try {
    // 1) products.json を取得
    const products = await fetchJSON('./data/products.json');

    // 2) 画面に描画
    renderList(products);
    
  } catch (e) {
    showError('データの取得に失敗しました（' + (e?.message || 'Unknown') + '）');
  }
}

document.addEventListener('DOMContentLoaded', init);
