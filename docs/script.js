document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for anchor links
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

    // Image loading animation
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });
        // If image already loaded
        if (img.complete) {
            img.style.opacity = '1';
        }
    });

    // Fade-in animation on scroll for elements with class 'fade-in'
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Add hover effect to links inside content
    const contentLinks = document.querySelectorAll('.content-card a');
    contentLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.color = 'var(--color-pink)';
        });
        link.addEventListener('mouseleave', () => {
            link.style.color = 'var(--color-orange)';
        });
    });

    // Optional: add subtle hover lift to images
    const contentImages = document.querySelectorAll('.content-card img');
    contentImages.forEach(img => {
        img.addEventListener('mouseenter', () => {
            img.style.transform = 'translateY(-5px)';
            img.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        });
        img.addEventListener('mouseleave', () => {
            img.style.transform = 'translateY(0)';
            img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
    });
});