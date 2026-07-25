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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. Cuộn trang "morph" — tự viết engine lerp thay cho scroll-behavior mặc định,
     cho cảm giác trôi từ từ, giảm tốc dần thay vì nhảy ngay lập tức (lấy cảm hứng từ
     hiệu ứng smooth-scroll của các trang web cũ nhưng dùng easing hiện đại hơn) ---------- */
  function smoothScrollTo(targetY, duration = 900) {
    if (prefersReducedMotion) { window.scrollTo(0, targetY); return; }
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;
    const startTime = performance.now();
    // easeOutExpo-esque: khởi động nhanh, lướt dần rất mượt về cuối, không cứng như linear
    const ease = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    let cancelled = false;
    const cancelOnUserInput = () => { cancelled = true; };
    window.addEventListener('wheel', cancelOnUserInput, { passive: true, once: true });
    window.addEventListener('touchstart', cancelOnUserInput, { passive: true, once: true });
    function step(now) {
      if (cancelled) return;
      const t = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else {
        window.removeEventListener('wheel', cancelOnUserInput);
        window.removeEventListener('touchstart', cancelOnUserInput);
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------- 1. Smooth scroll cho anchor link ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerOffset = 96;
      const targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      // Thời gian tỷ lệ với khoảng cách để cuộn gần thì nhanh, cuộn xa thì có đà trôi rõ ràng hơn
      const distance = Math.abs(targetY - window.scrollY);
      const duration = Math.min(1400, Math.max(500, distance * 0.5));
      smoothScrollTo(targetY, duration);
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
  // Throttle bằng requestAnimationFrame để scroll mượt hơn, tránh giật khi cuộn nhanh
  let scrollTicking = false;
  document.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        onScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
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

  function switchTab(btn) {
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
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Dùng View Transitions API nếu trình duyệt hỗ trợ (Chrome/Edge): morph thật sự giữa
      // 2 trạng thái thay vì chỉ fade — fallback về cách cũ trên trình duyệt không hỗ trợ
      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(() => switchTab(btn));
      } else {
        switchTab(btn);
      }
    });
  });

  const activeTab = document.querySelector('.tab-btn.is-active');
  if (activeTab) {
    // Đợi layout ổn định trước khi đo vị trí
    requestAnimationFrame(() => moveIndicator(activeTab));
    window.addEventListener('resize', () => moveIndicator(document.querySelector('.tab-btn.is-active')));
  }

  /* ---------- 8. Accordion — FAQ ---------- */
  /* CSS dùng kỹ thuật grid-template-rows keyed theo [aria-expanded] nên JS chỉ cần
     toàn quyền bật/tắt thuộc tính — chuyển động mượt hoàn toàn do CSS transition đảm nhiệm,
     không còn bị giật do tính sai scrollHeight khi nội dung thay đổi kích thước (vd. resize). */
  document.querySelectorAll('.accordion-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      const applyToggle = () => {
        // Đóng các câu khác trong cùng nhóm để giữ giao diện gọn
        const group = btn.closest('.accordion');
        if (group) {
          group.querySelectorAll('.accordion-question').forEach((otherBtn) => {
            if (otherBtn !== btn) otherBtn.setAttribute('aria-expanded', 'false');
          });
        }
        btn.setAttribute('aria-expanded', String(!isOpen));
      };

      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(applyToggle);
      } else {
        applyToggle();
      }
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
      smoothScrollTo(0, Math.min(1400, Math.max(600, window.scrollY * 0.5)));
    });
  }

  /* ---------- 14. Nút "nam châm" (magnetic) — nút hơi bị hút về phía con trỏ khi rất gần,
     rồi bật trở lại vị trí gốc bằng easing đàn hồi khi rời chuột ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.classList.add('btn-magnetic');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.28}px, ${relY * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- 15. Tilt-card 3D — nghiêng nhẹ theo vị trí chuột + giữ glừng glơ đã có
     sẵn ở CSS (.tilt-card::before dùng --mx/--my) — áp dụng cho mọi khối card chính ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const tiltSelectors = '.bento-card, .subtype-card, .cause-card, .hospital-card, .lifestyle-card, .med-card';
    document.querySelectorAll(tiltSelectors).forEach((card) => {
      card.classList.add('tilt-card');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        card.style.setProperty('--ry', ((px - 0.5) * 6) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 6) + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 16. Con trỏ đuôi mượt (custom cursor trail) — gợi nhớ cảm giác "blob theo
     chuột" của các trang web cũ, nhưng dùng nội suy (lerp) mượt hơn thay vì bám ngay lập tức ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    document.querySelectorAll('a, button, .tilt-card').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);
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
      const wasOpen = chatbox.classList.contains('open');
      chatbox.classList.toggle('open');
      if (chatbox.classList.contains('open') && !wasOpen) {
        chatboxInputField.focus();
        sendGreeting();
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
    botMsgDiv.innerHTML = botResponse; // trust AI response (contains only safe links)
    // Attach click handler for any anchor links inside bot message for smooth scroll
    botMsgDiv.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    chatboxMessages.appendChild(botMsgDiv);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
  }

  // Send greeting when chatbox opens
  function sendGreeting() {
    if (!chatboxMessages) return;
    const greeting = 'Xin chào! Tôi là trợ lý ADHD. Bạn có thể hỏi tôi bất kỳ câu hỏi nào về ADHD nhé.';
    const botDiv = document.createElement('div');
    botDiv.className = 'chat-message bot';
    botDiv.textContent = greeting;
    chatboxMessages.appendChild(botDiv);
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

  // Resize handle for chatbox (top‑left handle, bottom‑right corner fixed)
  const resizeHandle = chatbox.querySelector('.resize-handle');
  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = chatbox.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // moving right/down reduces size; moving left/up increases size
      let newWidth = startWidth - dx;
      let newHeight = startHeight - dy;
      // apply minimum size
      newWidth = Math.max(200, newWidth);
      newHeight = Math.max(150, newHeight);
      // prevent chatbox from going outside viewport (keep bottom‑right corner fixed) with a gap
      const GAP = 30; // pixels from viewport edges
      const maxWidth = window.innerWidth - 86 - GAP;
      const maxHeight = window.innerHeight - 26 - GAP;
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);
      chatbox.style.width = newWidth + 'px';
      chatbox.style.height = newHeight + 'px';
      e.preventDefault();
    });
    document.addEventListener('mouseup', () => {
      isResizing = false;
    });
  }

});