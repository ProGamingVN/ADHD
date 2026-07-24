// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.fade-in, .slide-up, .card').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// FAQ toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });
});

// Contact form handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('#contact .contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const name = this.querySelector('input[name="name"]').value.trim();
            const email = this.querySelector('input[name="email"]').value.trim();
            const subject = this.querySelector('input[name="subject"]').value.trim();
            const message = this.querySelector('textarea[name="message"]').value.trim();

            // Simple validation
            if (name === '' || email === '' || subject === '' || message === '') {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }

            // Simple email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Vui lòng nhập địa chỉ email hợp lệ!');
                return;
            }

            // If valid, show success message (in real app, you would send to server)
            alert('Cảm ơn bạn đã liên hệ với chúng tôi! Chúng tôi sẽ phản hồi sớm nhất có thể.');
            this.reset();
        });
    }
});

// Add hover effects for images
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
    });
});

// Mobile menu toggle (placeholder for future enhancement)
const initMobileMenu = () => {
    // Mobile menu functionality can be added here if needed
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();

    // Add loading animation removal
    document.body.classList.add('loaded');
});

// Parallax effect for background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.bg-decoration');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.4}px)`;
    }
});

// Add back to top button functionality
document.addEventListener('DOMContentLoaded', () => {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑ Lên đầu';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<span>↑</span> Lên đầu';
    document.body.appendChild(backToTopBtn);

    // Style the button
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '30px';
    backToTopBtn.style.right = '30px';
    backToTopBtn.style.background = 'var(--color-primary)';
    backToTopBtn.style.color = 'var(--color-light)';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.borderRadius = '50px';
    backToTopBtn.style.padding = '12px 20px';
    backToTopBtn.style.fontSize = '16px';
    backToTopBtn.style.fontWeight = '600';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    backToTopBtn.style.transition = 'all 0.3s ease';
    backToTopBtn.style.zIndex = '100';
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.visibility = 'hidden';
    backToTopBtn.style.display = 'flex';
    backToTopBtn.style.alignItems = 'center';
    backToTopBtn.style.gap = '8px';

    // Show/hide button based on scroll position
    const toggleBackToTop = () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    };

    // Event listeners
    window.addEventListener('scroll', toggleBackToTop);
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Initial check
    toggleBackToTop();
});