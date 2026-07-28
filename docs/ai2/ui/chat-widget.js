/**
 * MODULE: Chat UI Widget (Phase 8) — TRIỂN KHAI THẬT
 *
 * VAI TRÒ
 * -------
 * Giao diện chat nổi (floating button) TỰ CHỨA, không phụ thuộc DOM/CSS
 * có sẵn của site (đây là file UI MỚI cho kiến trúc graph-based, KHÔNG
 * phải ai/chat-widget.js cũ dùng embedding — file cũ vẫn giữ nguyên).
 * Widget tự dựng toàn bộ DOM của nó và tự dọn dẹp khi unmount, nên có thể
 * nhúng vào bất kỳ trang nào (kể cả trang demo độc lập) mà không xung đột.
 *
 * HỢP ĐỒNG (CONTRACT)
 * --------------------
 * mountChatWidget(rootElement, chatEngine, options?) -> { destroy(): void }
 *
 * - rootElement: Node cha để gắn widget vào (mặc định document.body nếu
 *   truyền null/undefined).
 * - chatEngine: instance của ChatEngine (core/chat/chat-engine.js), ĐÃ
 *   được khởi tạo sẵn với { nodes, edges } đọc từ data/knowledge-graph.json.
 *   Widget không tự fetch dữ liệu — tách trách nhiệm rõ ràng (module UI
 *   không biết gì về I/O), đúng nguyên tắc module hoá của spec.
 *   chatEngine.ask(text) có thể trả về giá trị đồng bộ hoặc Promise — widget
 *   luôn bọc qua Promise.resolve() để tương thích cả hai.
 * - options (tất cả optional):
 *     title            (string)  mặc định 'Trợ lý ADHD'
 *     subtitle         (string)  mặc định 'Hỏi mình về ADHD nhé'
 *     greeting         (string)  câu chào khi mở lần đầu
 *     initialSuggestions (string[]) câu hỏi gợi ý ban đầu; nếu không
 *         truyền, widget tự chọn vài node cấp cao nhất trong graph (không
 *         có parent) để sinh gợi ý "X là gì?".
 *
 * TÍNH NĂNG (theo spec Phase 8)
 * ------------------------------
 * Floating Button, Responsive, Dark Mode (tự theo hệ điều hành + nút bấm
 * thủ công có nhớ lựa chọn), Typing Indicator, Loading state, Suggested
 * Questions, Copy Answer, Scroll (tự cuộn xuống tin mới), History (luồng
 * hội thoại hiển thị theo thứ tự trong phiên, đồng bộ với chatEngine).
 */

const THEME_STORAGE_KEY = 'aicw-theme';

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  return node;
}

function pickInitialSuggestions(chatEngine, max = 4) {
  const nodes = (chatEngine && chatEngine.graph && chatEngine.graph.nodes) || [];
  const topLevel = nodes.filter((n) => !n.parent);
  const source = topLevel.length ? topLevel : nodes;
  return source.slice(0, max).map((n) => `${n.title} là gì?`);
}

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (e) {
    return null; // localStorage có thể bị chặn (chế độ riêng tư) — không vỡ widget
  }
}

function storeTheme(value) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch (e) {
    /* bỏ qua nếu không ghi được */
  }
}

/**
 * @param {Element|null} rootElement
 * @param {object} chatEngine
 * @param {object} [options]
 * @returns {{ destroy: () => void }}
 */
export function mountChatWidget(rootElement, chatEngine, options = {}) {
  if (!chatEngine || typeof chatEngine.ask !== 'function') {
    throw new Error('mountChatWidget(): chatEngine phải là instance có phương thức ask().');
  }

  const {
    title = 'Trợ lý ADHD',
    subtitle = 'Hỏi mình về ADHD nhé',
    greeting = 'Xin chào! Mình là trợ lý ADHD, dựa trên dữ liệu của trang này. Bạn muốn hỏi gì?',
    initialSuggestions = pickInitialSuggestions(chatEngine)
  } = options;

  const mountPoint = rootElement || document.body;

  // ---------- Dựng DOM ----------
  const root = el('div', 'aicw-root');
  const storedTheme = readStoredTheme();
  if (storedTheme === 'dark' || storedTheme === 'light') {
    root.setAttribute('data-aicw-theme', storedTheme);
  }

  const fab = el('button', 'aicw-fab', { type: 'button', 'aria-label': 'Mở trợ lý ADHD' });
  fab.textContent = '💬';
  const fabBadge = el('span', 'aicw-fab-badge');
  fab.appendChild(fabBadge);

  const panel = el('div', 'aicw-panel', { role: 'dialog', 'aria-label': title });

  const header = el('div', 'aicw-header');
  const headerTitle = el('div', 'aicw-header-title');
  const titleStrong = el('strong', null, { text: title });
  const subtitleSpan = el('span', null, { text: subtitle });
  headerTitle.append(titleStrong, subtitleSpan);

  const headerActions = el('div', 'aicw-header-actions');
  const themeBtn = el('button', 'aicw-icon-btn', { type: 'button', 'aria-label': 'Đổi giao diện sáng/tối', title: 'Sáng/Tối' });
  themeBtn.textContent = '🌓';
  const closeBtn = el('button', 'aicw-icon-btn', { type: 'button', 'aria-label': 'Đóng cửa sổ chat', title: 'Đóng' });
  closeBtn.textContent = '✕';
  headerActions.append(themeBtn, closeBtn);
  header.append(headerTitle, headerActions);

  const messages = el('div', 'aicw-messages');
  const emptyState = el('div', 'aicw-empty', { text: 'Đặt câu hỏi để bắt đầu trò chuyện.' });
  messages.appendChild(emptyState);

  const inputRow = el('div', 'aicw-input-row');
  const input = el('input', 'aicw-input', { type: 'text', placeholder: 'Nhập câu hỏi của bạn...' });
  const sendBtn = el('button', 'aicw-send-btn', { type: 'button', text: 'Gửi' });
  inputRow.append(input, sendBtn);

  panel.append(header, messages, inputRow);
  root.append(fab, panel);
  mountPoint.appendChild(root);

  // ---------- Trạng thái ----------
  let isOpen = false;
  let hasGreeted = false;
  let isSending = false;

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function clearEmptyState() {
    if (emptyState.parentNode) emptyState.remove();
  }

  function appendUserMessage(text) {
    clearEmptyState();
    const row = el('div', 'aicw-msg-row user');
    const bubble = el('div', 'aicw-bubble', { text });
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  function copyText(text, btn) {
    const done = () => {
      btn.textContent = 'Đã sao chép ✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Sao chép';
        btn.classList.remove('copied');
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      // Fallback cho môi trường không có Clipboard API
      const tmp = el('textarea');
      tmp.value = text;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand('copy'); } catch (e) { /* bỏ qua */ }
      document.body.removeChild(tmp);
      done();
    }
  }

  function appendBotMessage({ answer, confident, suggestions }) {
    clearEmptyState();
    const row = el('div', `aicw-msg-row bot${confident ? '' : ' low-confidence'}`);
    const bubble = el('div', 'aicw-bubble');
    bubble.innerHTML = answer; // answer đã được answer-composer escape HTML nội dung động
    row.appendChild(bubble);

    const copyBtn = el('button', 'aicw-copy-btn', { type: 'button', text: 'Sao chép' });
    copyBtn.addEventListener('click', () => copyText(bubble.textContent.trim(), copyBtn));
    row.appendChild(copyBtn);

    if (suggestions && suggestions.length) {
      const chipWrap = el('div', 'aicw-suggestions');
      suggestions.forEach((q) => {
        const chip = el('button', 'aicw-chip', { type: 'button', text: q });
        chip.addEventListener('click', () => handleSend(q));
        chipWrap.appendChild(chip);
      });
      row.appendChild(chipWrap);
    }

    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  function appendTypingIndicator() {
    const row = el('div', 'aicw-msg-row bot');
    const bubble = el('div', 'aicw-bubble');
    const typing = el('div', 'aicw-typing');
    typing.append(el('span'), el('span'), el('span'));
    bubble.appendChild(typing);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  async function handleSend(rawText) {
    const text = (rawText ?? input.value).trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    input.value = '';

    appendUserMessage(text);
    const typingRow = appendTypingIndicator();

    try {
      const result = await Promise.resolve(chatEngine.ask(text));
      typingRow.remove();
      appendBotMessage(result);
    } catch (err) {
      typingRow.remove();
      appendBotMessage({
        answer: 'Đã có lỗi xảy ra khi xử lý câu hỏi. Bạn thử lại nhé.',
        confident: false,
        suggestions: []
      });
      console.error('[chat-widget] ask() lỗi:', err);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add('is-open');
    fab.classList.remove('has-unread');
    fab.setAttribute('aria-label', 'Đóng trợ lý ADHD');
    if (!hasGreeted) {
      hasGreeted = true;
      appendBotMessage({ answer: greeting, confident: true, suggestions: initialSuggestions });
    }
    setTimeout(() => input.focus(), 300);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('is-open');
    fab.setAttribute('aria-label', 'Mở trợ lý ADHD');
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  function toggleTheme() {
    const current = root.getAttribute('data-aicw-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-aicw-theme', next);
    storeTheme(next);
  }

  // ---------- Sự kiện ----------
  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', closePanel);
  themeBtn.addEventListener('click', toggleTheme);
  sendBtn.addEventListener('click', () => handleSend());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
    if (e.key === 'Escape') closePanel();
  });

  return {
    destroy() {
      fab.removeEventListener('click', togglePanel);
      closeBtn.removeEventListener('click', closePanel);
      themeBtn.removeEventListener('click', toggleTheme);
      sendBtn.removeEventListener('click', () => handleSend());
      root.remove();
    }
  };
}
