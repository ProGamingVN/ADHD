/**
 * ENTRY POINT: AI Engine (thay thế bản embedding cũ) — TƯƠNG THÍCH NGƯỢC
 * ------------------------------------------------------------------------
 * File này (sau khi đổi tên ai2 -> ai) sẽ nằm ở đúng đường dẫn
 * `ai/chat-widget.js` mà `index.html` và `script.js` gốc đang tham chiếu.
 *
 * HỢP ĐỒNG GIỮ NGUYÊN 100% so với bản cũ (ai/chat-widget.js hiện tại):
 *   export async function askAI(question) -> string (HTML an toàn)
 *
 * Nhờ vậy KHÔNG cần sửa index.html hay script.js — script.js vẫn tự lo
 * toàn bộ DOM (#chatbox, #chat-toggle, gõ Enter, resize, "Đang gõ...",
 * câu chào, cuộn tin nhắn...) y như cũ. File này chỉ thay "bộ não" trả
 * lời (Knowledge Graph thay vì embedding) và bổ sung thêm — hoàn toàn
 * bằng JS/CSS tự cấy — các tính năng: gợi ý câu hỏi, nút đi tới phần
 * (kèm tự mở accordion FAQ / tự chuyển tab cơ sở điều trị), nút sao chép.
 *
 * KHÔNG đổi giao diện/CSS/animation gốc của #chatbox — mọi phần tử mới
 * dùng chung biến CSS (--coral, --ink, --line...) đã khai báo sẵn trong
 * style.css của trang.
 */

import { ChatEngine } from './core/chat/chat-engine.js';

const DATA_URL = new URL('./data/knowledge-graph.json', import.meta.url);

const SECTION_LABELS = {
  '#hero': 'Trang chủ',
  '#toc': 'Mục lục',
  '#nhan-dien': 'Nhận diện ADHD',
  '#nguyen-nhan-hau-qua': 'Nguyên nhân · Hậu quả',
  '#dieu-tri-ho-tro': 'Điều trị · Hỗ trợ',
  '#co-so-dieu-tri': 'Cơ sở điều trị',
  '#cau-hoi-nang-cao': 'Câu hỏi nâng cao nhận thức',
  '#lien-he': 'Liên hệ'
};

let chatEnginePromise = null;

function getChatEngine() {
  if (!chatEnginePromise) {
    chatEnginePromise = fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Không tải được knowledge-graph.json: ' + res.status);
        return res.json();
      })
      .then((graph) => new ChatEngine(graph))
      .catch((err) => {
        chatEnginePromise = null; // cho phép thử lại ở lần hỏi sau nếu lỗi tạm thời
        throw err;
      });
  }
  return chatEnginePromise;
}

/**
 * @param {string} question
 * @returns {Promise<string>} HTML an toàn để gán vào innerHTML tin nhắn bot
 */
export async function askAI(question) {
  try {
    const engine = await getChatEngine();
    const result = engine.ask(question);
    return renderAnswerHtml(result, engine);
  } catch (err) {
    console.error('[ai/chat-widget] Lỗi khi trả lời:', err);
    return 'Xin lỗi, mình đang gặp sự cố khi tra cứu dữ liệu. Bạn thử hỏi lại sau nhé.';
  }
}

// ---------------------------------------------------------------------
// Render câu trả lời + bổ sung UI (suggestions / nav / copy)
// ---------------------------------------------------------------------

let blockCounter = 0;

function renderAnswerHtml(result, engine) {
  blockCounter += 1;
  const blockId = 'adhd-ans-' + blockCounter;

  // answer-composer đã tự chèn link "(xem thêm)" thô — bỏ đi, mình tự dựng
  // nút điều hướng đẹp hơn (kèm tự mở accordion / tự chuyển tab) bên dưới.
  const baseHtml = String(result.answer || '').replace(/\s*<a href="#[^"]+">\(xem thêm\)<\/a>/g, '');

  const navHtml = buildNavButtons(result.sourceNodeIds, engine);
  const suggestHtml = buildSuggestions(result.suggestions);
  const copyHtml = '<button type="button" class="chat-copy-btn" data-copy-target="' + blockId + '">📋 Sao chép</button>';

  return (
    '<div class="chat-answer-block" id="' + blockId + '">' +
    baseHtml +
    navHtml +
    suggestHtml +
    '<div class="chat-answer-tools">' + copyHtml + '</div>' +
    '</div>'
  );
}

function buildNavButtons(sourceNodeIds, engine) {
  if (!sourceNodeIds || !sourceNodeIds.length) return '';
  const nodeMap = new Map(engine.graph.nodes.map((n) => [n.id, n]));
  const seenSources = new Set();
  const buttons = [];

  for (const id of sourceNodeIds) {
    const node = nodeMap.get(id);
    if (!node || !node.source || seenSources.has(node.source)) continue;
    seenSources.add(node.source);
    const label = SECTION_LABELS[node.source] || node.title;
    const tabHint = node.category === 'co-so-dieu-tri' ? guessHospitalTab(node.id) : '';
    buttons.push(
      '<a href="' + node.source + '" class="chat-nav-btn" data-node-id="' + escapeAttr(node.id) + '"' +
      (tabHint ? ' data-tab="' + tabHint + '"' : '') +
      (node.category === 'faq' ? ' data-faq-title="' + escapeAttr(node.title) + '"' : '') +
      '>↳ Đi tới phần: ' + escapeHtml(label) + '</a>'
    );
  }

  return buttons.length ? '<div class="chat-nav-group">' + buttons.join('') + '</div>' : '';
}

function guessHospitalTab(nodeId) {
  if (nodeId.includes('hcm') || nodeId.includes('tphcm')) return 'hcm';
  if (nodeId.includes('-hn') || nodeId.includes('bach-mai') || nodeId.includes('ha-noi') || nodeId.includes('tam-than-nhi-tw')) return 'hn';
  return '';
}

function buildSuggestions(suggestions) {
  if (!suggestions || !suggestions.length) return '';
  const chips = suggestions
    .map((q) => '<button type="button" class="chat-suggest-chip" data-question="' + escapeAttr(q) + '">' + escapeHtml(q) + '</button>')
    .join('');
  return '<div class="chat-suggestions">' + chips + '</div>';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------
// Sự kiện cho các phần tử bổ sung — dùng event delegation trên toàn
// document, gắn đúng 1 lần khi module load. Không đụng tới các listener
// script.js đã gắn sẵn cho #chat-toggle/#chatbox-close/gửi tin nhắn/resize.
// ---------------------------------------------------------------------

function initDelegatedEvents() {
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chat-suggest-chip');
    if (chip) {
      askSuggested(chip.getAttribute('data-question'));
      return;
    }

    const copyBtn = e.target.closest('.chat-copy-btn');
    if (copyBtn) {
      copyAnswer(copyBtn);
      return;
    }

    const navBtn = e.target.closest('.chat-nav-btn');
    if (navBtn) {
      // Không preventDefault: script.js đã có listener riêng cho
      // a[href^="#"] trong tin nhắn bot để cuộn mượt tới section.
      // Ở đây chỉ bổ sung: tự chuyển tab / tự mở accordion sau khi cuộn.
      const tab = navBtn.getAttribute('data-tab');
      if (tab) setTimeout(() => switchHospitalTab(tab), 350);
      const faqTitle = navBtn.getAttribute('data-faq-title');
      if (faqTitle) setTimeout(() => openMatchingAccordion(faqTitle), 350);
    }
  });
}

function askSuggested(question) {
  if (!question) return;
  const input = document.querySelector('#chatbox-input input');
  const button = document.querySelector('#chatbox-input button');
  if (!input || !button) return;
  input.value = question;
  button.click();
}

function copyAnswer(button) {
  const blockId = button.getAttribute('data-copy-target');
  const block = blockId ? document.getElementById(blockId) : button.closest('.chat-answer-block');
  if (!block) return;
  const clone = block.cloneNode(true);
  clone.querySelectorAll('.chat-nav-group, .chat-suggestions, .chat-answer-tools').forEach((el) => el.remove());
  const text = clone.textContent.replace(/\s+/g, ' ').trim();

  const done = () => {
    const original = button.textContent;
    button.textContent = '✓ Đã sao chép';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  } catch (e) {
    /* im lặng bỏ qua nếu trình duyệt chặn */
  }
}

function switchHospitalTab(tabKey) {
  const btn = document.querySelector('.tab-btn[data-tab="' + tabKey + '"]');
  if (btn && !btn.classList.contains('is-active')) btn.click();
}

function openMatchingAccordion(nodeTitle) {
  const norm = normalizeLoose(nodeTitle);
  const questions = document.querySelectorAll('.accordion-question');
  let best = null;
  let bestScore = 0;
  questions.forEach((btn) => {
    const span = btn.querySelector('span');
    if (!span) return;
    const qNorm = normalizeLoose(span.textContent);
    const score = overlapScore(norm, qNorm);
    if (score > bestScore) {
      bestScore = score;
      best = btn;
    }
  });
  if (best && bestScore >= 0.25 && best.getAttribute('aria-expanded') !== 'true') {
    best.click();
  }
}

function normalizeLoose(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function overlapScore(normA, normB) {
  const a = new Set(normA.split(' ').filter((w) => w.length > 2));
  const b = new Set(normB.split(' ').filter((w) => w.length > 2));
  if (!a.size || !b.size) return 0;
  let common = 0;
  a.forEach((w) => { if (b.has(w)) common += 1; });
  return common / Math.min(a.size, b.size);
}

// ---------------------------------------------------------------------
// CSS bổ sung (chỉ cho phần tử MỚI) — cấy 1 lần, dùng biến CSS có sẵn
// của trang để tự động đồng bộ theo theme/màu gốc, không viết đè gì cũ.
// ---------------------------------------------------------------------

function injectExtraStylesOnce() {
  if (document.getElementById('adhd-chat-ext-style')) return;
  const style = document.createElement('style');
  style.id = 'adhd-chat-ext-style';
  style.textContent = `
#chatbox-messages .chat-answer-block { display: flex; flex-direction: column; gap: 8px; }
#chatbox-messages .chat-nav-group,
#chatbox-messages .chat-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
#chatbox-messages .chat-nav-btn,
#chatbox-messages .chat-suggest-chip,
#chatbox-messages .chat-copy-btn {
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
  border: 1.5px solid var(--line, rgba(36,19,50,0.10));
  background: var(--paper, #fff8f2);
  color: var(--ink, #3A2247);
  text-decoration: none;
  display: inline-block;
}
#chatbox-messages .chat-nav-btn {
  background: rgba(255,107,74,0.10);
  border-color: rgba(255,107,74,0.35);
  color: var(--coral-dark, #7e2c19);
}
#chatbox-messages .chat-nav-btn:hover,
#chatbox-messages .chat-suggest-chip:hover { transform: translateY(-1px); border-color: var(--coral, #f56e6e); }
#chatbox-messages .chat-suggest-chip { background: rgba(122,62,126,0.06); }
#chatbox-messages .chat-answer-tools { display: flex; justify-content: flex-end; }
#chatbox-messages .chat-copy-btn {
  font-size: 0.74rem; font-weight: 500; padding: 4px 10px;
  background: transparent; border-color: transparent; color: var(--text-muted, #6B5C74);
}
#chatbox-messages .chat-copy-btn:hover { color: var(--coral-dark, #7e2c19); border-color: var(--line, rgba(36,19,50,0.10)); }
#chatbox-messages .chat-copy-btn:disabled { opacity: 0.7; cursor: default; }
`;
  document.head.appendChild(style);
}

// Khởi tạo 1 lần khi module được import (bởi script.js qua dynamic import,
// hoặc bởi index.html qua <script type="module">).
injectExtraStylesOnce();
initDelegatedEvents();
