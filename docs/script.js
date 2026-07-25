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
   9. Form liên hệ (validate + phản hồi, không có backend)
   10. Back-to-top
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

    const backToTop = document.getElementById('backToTop');
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

      tabButtons.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      document.querySelectorAll('.tab-panel').forEach((panel) => {
        const match = panel.id === 'panel-' + key;
        panel.classList.toggle('is-active', match);
        panel.hidden = !match;
      });

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

  /* ---------- 9. Form liên hệ ---------- */
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

      setTimeout(() => {
        formStatus.textContent = 'Cảm ơn bạn! Tin nhắn đã được ghi nhận, chúng tôi sẽ phản hồi sớm nhất có thể.';
        contactForm.reset();
        submitBtn.disabled = false;
      }, 700);
    });
  }

  /* ---------- 10. Back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
