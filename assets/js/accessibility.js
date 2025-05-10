// Controles de acessibilidade
document.addEventListener('DOMContentLoaded', () => {
    // Font size control
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 100;
    const fontSizeStep = 10;
    const maxFontSize = 150;
    const minFontSize = 90;

    const decreaseButton = document.querySelector('.font-decrease');
    const increaseButton = document.querySelector('.font-increase');
    const themeToggle = document.querySelector('.theme-toggle');
    
    // Aplicar tamanho de fonte salvo
    document.body.style.fontSize = `${currentFontSize}%`;
    
    // Font size controls
    decreaseButton?.addEventListener('click', () => {
        if (currentFontSize > minFontSize) {
            currentFontSize -= fontSizeStep;
            document.body.style.fontSize = `${currentFontSize}%`;
            localStorage.setItem('fontSize', currentFontSize.toString());
            announceChange(`Tamanho da fonte diminuído para ${currentFontSize}%`);
        } else {
            announceChange('Tamanho mínimo da fonte atingido');
        }
    });

    increaseButton?.addEventListener('click', () => {
        if (currentFontSize < maxFontSize) {
            currentFontSize += fontSizeStep;
            document.body.style.fontSize = `${currentFontSize}%`;
            localStorage.setItem('fontSize', currentFontSize.toString());
            announceChange(`Tamanho da fonte aumentado para ${currentFontSize}%`);
        } else {
            announceChange('Tamanho máximo da fonte atingido');
        }
    });

    // Theme toggle
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        const isDark = document.body.classList.contains('dark-theme');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        
        // Update ARIA label
        themeToggle.setAttribute('aria-label', 
            `Alternar para tema ${isDark ? 'claro' : 'escuro'}`);
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon();

    // Theme toggle handler
    themeToggle?.addEventListener('click', () => {
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
});