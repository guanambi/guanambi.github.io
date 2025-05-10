// Gerenciamento do tema (claro/escuro)
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Verifica tema salvo ou preferência do sistema
    const currentTheme = localStorage.getItem('theme') || 
        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Aplica tema inicial
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Atualiza ícone do botão
    updateThemeIcon(currentTheme);
    
    // Handler para alternar tema
    themeToggle?.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' 
            ? 'light' 
            : 'dark';
            
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // Atualiza ícone baseado no tema
    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        
        if (moonIcon && sunIcon) {
            if (theme === 'dark') {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline-block';
            } else {
                moonIcon.style.display = 'inline-block';
                sunIcon.style.display = 'none';
            }
        }
    }
});

// Font size control
let currentFontSize = 100; // Base font size percentage
const fontSizeStep = 10; // Percentage to increase/decrease
const minFontSize = 80;
const maxFontSize = 150;

function initAccessibilityControls() {
    const decreaseFontBtn = document.getElementById('decreaseFontBtn');
    const increaseFontBtn = document.getElementById('increaseFontBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // Load saved preferences
    loadFontSize();
    loadThemePreference();
    
    decreaseFontBtn?.addEventListener('click', () => {
        if (currentFontSize > minFontSize) {
            currentFontSize -= fontSizeStep;
            updateFontSize();
        }
    });
    
    increaseFontBtn?.addEventListener('click', () => {
        if (currentFontSize < maxFontSize) {
            currentFontSize += fontSizeStep;
            updateFontSize();
        }
    });
    
    themeToggleBtn?.addEventListener('click', toggleTheme);
}

function updateFontSize() {
    document.documentElement.style.fontSize = `${currentFontSize}%`;
    localStorage.setItem('fontSize', currentFontSize.toString());
}

function loadFontSize() {
    const savedSize = localStorage.getItem('fontSize');
    if (savedSize) {
        currentFontSize = parseInt(savedSize);
        updateFontSize();
    }
}

// Theme control
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#themeToggleBtn i');
    
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    // Update icon
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.querySelector('#themeToggleBtn i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAccessibilityControls);