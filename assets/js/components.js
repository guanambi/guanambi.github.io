// Load components
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Error loading component: ${response.status}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;

        // Re-initialize functionality after header is loaded
        if (elementId === 'header-container') {
            initializeHeaderEvents();
            initializeAccessibilityFeatures();
        }
    } catch (error) {
        console.error('Failed to load component:', error);
        document.getElementById(elementId).innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar componente. Por favor, recarregue a página.</p>
            </div>
        `;
    }
}

// Initialize header-specific events and styles
function initializeHeaderEvents() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Mobile menu functionality
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// Initialize accessibility features and theme
function initializeAccessibilityFeatures() {
    // Font size controls
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 100;
    const fontSizeStep = 10;
    const maxFontSize = 150;
    const minFontSize = 90;

    // Apply saved font size
    document.body.style.fontSize = `${currentFontSize}%`;

    const decreaseButton = document.querySelector('.font-decrease');
    const increaseButton = document.querySelector('.font-increase');
    const themeToggle = document.querySelector('.theme-toggle');

    if (decreaseButton && increaseButton) {
        decreaseButton.addEventListener('click', () => {
            if (currentFontSize > minFontSize) {
                currentFontSize -= fontSizeStep;
                document.body.style.fontSize = `${currentFontSize}%`;
                localStorage.setItem('fontSize', currentFontSize.toString());
                announceChange(`Tamanho da fonte diminuído para ${currentFontSize}%`);
            } else {
                announceChange('Tamanho mínimo da fonte atingido');
            }
        });

        increaseButton.addEventListener('click', () => {
            if (currentFontSize < maxFontSize) {
                currentFontSize += fontSizeStep;
                document.body.style.fontSize = `${currentFontSize}%`;
                localStorage.setItem('fontSize', currentFontSize.toString());
                announceChange(`Tamanho da fonte aumentado para ${currentFontSize}%`);
            } else {
                announceChange('Tamanho máximo da fonte atingido');
            }
        });
    }

    // Theme toggle functionality
    if (themeToggle) {
        function updateThemeIcon() {
            const icon = themeToggle.querySelector('i');
            const isDark = document.body.classList.contains('dark-theme');
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.setAttribute('aria-label', `Alternar para tema ${isDark ? 'claro' : 'escuro'}`);
        }

        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-theme');
        }
        updateThemeIcon();

        // Theme toggle handler
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon();
            announceChange(`Tema ${isDark ? 'escuro' : 'claro'} ativado`);
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.body.classList.toggle('dark-theme', e.matches);
                updateThemeIcon();
            }
        });
    }
}

// Auxiliary function for screen readers
function announceChange(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 3000);
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        loadComponent('header-container', '/assets/components/header.html');
    }
});