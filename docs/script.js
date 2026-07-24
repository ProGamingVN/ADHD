// Initialize markdown-it with attr plugin
const md = window.markdownit().use(window.markdownitAttr);

document.addEventListener('DOMContentLoaded', function() {
    // Fetch the markdown content
    fetch('docs/content.md')
        .then(response => response.text())
        .then(markdownText => {
            // Convert markdown to HTML using markdown-it with attrs
            const htmlContent = md.render(markdownText);

            // Insert into the markdown-content div
            const contentDiv = document.getElementById('markdown-content');
            contentDiv.innerHTML = htmlContent;

            // Process images to ensure correct paths and add loading effects
            processImages();

            // Add fade-in animation to content
            contentDiv.classList.add('fade-in');
        })
        .catch(error => {
            console.error('Error loading markdown:', error);
            document.getElementById('markdown-content').innerHTML = '<p>Lỗi tải nội dung. Vui lòng thử lại sau.</p>';
        });
});

// Process images to fix paths and add loading effects
function processImages() {
    const images = document.querySelectorAll('#markdown-content img');
    images.forEach(img => {
        // Fix image paths if needed
        let src = img.getAttribute('src');
        if (src) {
            // If the path doesn't start with http, make it relative to current location
            if (!src.startsWith('http') && !src.startsWith('/')) {
                // Keep the path as is (should be like output/media/media/imageX.png)
                // Ensure we use forward slashes for consistency
                src = src.replace(/\\/g, '/');
                img.src = src;
            }
        }

        // Add loading animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        // When image loads, fade it in
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });

    // Also process any images that might already be loaded
    images.forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
        }
    });
}

// Add some basic interactivity for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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

    // Add hover effect to links in markdown content
    const markdownLinks = document.querySelectorAll('#markdown-content a');
    markdownLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.color = 'var(--color-pink)';
        });

        link.addEventListener('mouseleave', function() {
            this.style.color = 'var(--color-orange)';
        });
    });
});