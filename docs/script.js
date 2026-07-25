/* =====================================================================
   VÀI ĐIỀU VỀ ADHD — INTERACTIONS
   1. Smooth scroll cho anchor link
   2. Header: hiệu ứng scroll + thanh tiến trình đọc
   3. Menu mobile
   4. Scrollspy (highlight nav link đang xem)
   5. Reveal on scroll (IntersectionObserver, hỗ trợ stagger)
   6. Đếm số hero stats
   7. Tabs — Cơ sở điều trị
   8. Accordion — FAQ
   9. Form liên hệ (gửi qua Formspree, không backend tự xây)
   10. Back-to-top
   11. Ripple khi nhấp nút
   12. Ambient glow theo chuột trong Hero
   13. Chat widget toggle
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileNav();
    });
  });

  /* ---------- 2. Header scroll state + reading progress ---------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('scrollProgress');

  const onScroll = () => {
    const scrollY = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', scrollY > 12);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = progress + '%';

    const backToTop = document.querySelector('.back-to-top-btn');
    if (backToTop) backToTop.classList.toggle('is-visible', scrollY > 600);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Menu mobile ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  function closeMobileNav() {
    if (!mainNav || !navToggle) return;
    mainNav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---------- 4. Scrollspy ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const spySections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (spySections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === id);
          });
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    spySections.forEach((section) => spyObserver.observe(section));
  }

  /* ---------- 5. Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = el.getAttribute('data-reveal-delay');
        if (delay) el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- 6. Đếm số hero stats ---------- */
  const counters = document.querySelectorAll('.stat-num[data-count]');
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => countObserver.observe(el));

  /* ---------- 7. Tabs — Cơ sở điều trị ---------- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabIndicator = document.querySelector('.tab-indicator');

  function moveIndicator(btn) {
    if (!tabIndicator || !btn) return;
    tabIndicator.style.width = btn.offsetWidth + 'px';
    tabIndicator.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-tab');
      if (btn.classList.contains('is-active')) return;

      tabButtons.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      const nextPanel = document.getElementById('panel-' + key);
      const currentPanel = document.querySelector('.tab-panel.is-active');

      if (currentPanel && currentPanel !== nextPanel) {
        currentPanel.classList.remove('is-active');
        setTimeout(() => { currentPanel.hidden = true; }, 400);
      }
      if (nextPanel) {
        nextPanel.hidden = false;
        // force reflow để transition chạy mượt thay vì chuyển ngay lập tức
        void nextPanel.offsetWidth;
        requestAnimationFrame(() => nextPanel.classList.add('is-active'));
      }

      moveIndicator(btn);
    });
  });

  const activeTab = document.querySelector('.tab-btn.is-active');
  if (activeTab) {
    // Đợi layout ổn định trước khi đo vị trí
    requestAnimationFrame(() => moveIndicator(activeTab));
    window.addEventListener('resize', () => moveIndicator(document.querySelector('.tab-btn.is-active')));
  }

  /* ---------- 8. Accordion — FAQ ---------- */
  document.querySelectorAll('.accordion-question').forEach((btn) => {
    const answer = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Đóng các câu khác trong cùng nhóm để giữ giao diện gọn
      const group = btn.closest('.accordion');
      if (group) {
        group.querySelectorAll('.accordion-question').forEach((otherBtn) => {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherBtn.nextElementSibling.style.maxHeight = null;
          }
        });
      }

      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  /* ---------- 9. Form liên hệ (gửi thật qua Formspree, không backend) ---------- */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        formStatus.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc.';
        return;
      }
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formStatus.textContent = 'Đang gửi...';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      })
        .then((response) => {
          if (response.ok) {
            formStatus.textContent = 'Cảm ơn bạn! Tin nhắn đã được gửi, chúng tôi sẽ phản hồi sớm nhất có thể.';
            contactForm.reset();
          } else {
            formStatus.textContent = 'Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ qua email.';
          }
        })
        .catch(() => {
          formStatus.textContent = 'Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ qua email.';
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }

  /* ---------- 11. Ripple mượt khi nhấp nút ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.className = 'btn-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  /* ---------- 12. Ambient glow theo chuột trong Hero ---------- */
  const heroSection = document.getElementById('hero');
  if (heroSection && window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'hero-glow';
    heroSection.appendChild(glow);
    heroSection.addEventListener('mouseenter', () => glow.classList.add('is-active'));
    heroSection.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      glow.style.left = (e.clientX - rect.left) + 'px';
      glow.style.top = (e.clientY - rect.top) + 'px';
    });
  }

  /* ---------- 10. Back to top ---------- */
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 13. Chat widget toggle ---------- */
  const chatToggleBtn = document.getElementById('chat-toggle');
  const chatbox = document.getElementById('chatbox');
  const chatboxClose = document.getElementById('chatbox-close');
  const chatboxInput = document.getElementById('chatbox-input');
  const chatboxInputField = chatboxInput ? chatboxInput.querySelector('input') : null;
  const chatboxInputButton = chatboxInput ? chatboxInput.querySelector('button') : null;
  const chatboxMessages = document.getElementById('chatbox-messages');

  // Import the askAI function from chat-widget.js
  // Since chat-widget.js is loaded as a module, we can import it.
  // However, we are in a regular script. We'll use dynamic import.
  let askAI = null;
  (async () => {
    const module = await import('./ai/chat-widget.js');
    askAI = module.askAI;
  })();

  // Toggle chatbox visibility
  if (chatToggleBtn && chatbox) {
    chatToggleBtn.addEventListener('click', () => {
      chatbox.classList.toggle('open');
      if (chatbox.classList.contains('open')) {
        chatboxInputField.focus();
      }
    });
  }

  // Close chatbox
  if (chatboxClose && chatbox) {
    chatboxClose.addEventListener('click', () => {
      chatbox.classList.remove('open');
    });
  }

  // Send message
  async function sendMessage() {
    if (!chatboxInputField || !chatboxMessages) return;
    const messageText = chatboxInputField.value.trim();
    if (!messageText) return;

    // Add user message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-message user';
    userMsgDiv.textContent = messageText;
    chatboxMessages.appendChild(userMsgDiv);
    chatboxInputField.value = '';
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.textContent = 'Đang gõ...';
    chatboxMessages.appendChild(typingDiv);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;

    // Get AI response
    let botResponse = 'Xin lỗi, có lỗi xảy ra.';
    try {
      if (askAI) {
        botResponse = await askAI(messageText);
      } else {
        botResponse = 'Chatbot đang được tải, vui lòng thử lại sau giây lát.';
      }
    } catch (err) {
      console.error(err);
      botResponse = 'Đã có lỗi xảy ra khi xử lý tin nhắn.';
    }

    // Remove typing indicator and add bot response
    typingDiv.remove();
    const botMsgDiv = document.createElement('div');
    botMsgDiv.className = 'chat-message bot';
    botMsgDiv.textContent = botResponse;
    chatboxMessages.appendChild(botMsgDiv);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
  }

  if (chatboxInputButton) {
    chatboxInputButton.addEventListener('click', sendMessage);
  }
  if (chatboxInputField) {
    chatboxInputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

});