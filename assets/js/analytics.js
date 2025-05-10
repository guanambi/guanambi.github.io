// Analytics simples para rastrear interações do usuário
class Analytics {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        // Rastreia visualizações de página
        this.trackPageView();
        
        // Rastreia cliques em links
        this.trackClicks();
        
        // Rastreia tempo na página
        this.trackTimeOnPage();
        
        // Envia dados periodicamente
        this.setupPeriodicSync();
    }

    trackPageView() {
        this.logEvent('pageview', {
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer
        });
    }

    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (target) {
                this.logEvent('click', {
                    type: target.tagName.toLowerCase(),
                    text: target.innerText,
                    path: target.pathname || '',
                    id: target.id || '',
                    class: target.className || ''
                });
            }
        });
    }

    trackTimeOnPage() {
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            this.logEvent('timeOnPage', {
                seconds: timeSpent,
                path: window.location.pathname
            });
        });
    }

    logEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };
        
        this.events.push(event);
        this.saveToStorage();
        
        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log('Analytics Event:', event);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
            sessionStorage.setItem('analytics_session', sessionId);
        }
        return sessionId;
    }

    saveToStorage() {
        try {
            localStorage.setItem('analytics_events', JSON.stringify(this.events));
        } catch (e) {
            console.error('Erro ao salvar eventos:', e);
            // Limpa eventos antigos se storage estiver cheio
            this.events = this.events.slice(-50);
        }
    }

    setupPeriodicSync() {
        setInterval(() => this.syncEvents(), 300000); // 5 minutos
    }

    async syncEvents() {
        if (this.events.length === 0) return;
        
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: this.events
                })
            });

            if (response.ok) {
                this.events = [];
                localStorage.removeItem('analytics_events');
            }
        } catch (error) {
            console.error('Erro ao sincronizar eventos:', error);
        }
    }
}

// Inicializa analytics quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.siteAnalytics = new Analytics();
});