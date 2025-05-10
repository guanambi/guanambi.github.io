class ContentLoader {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.initializeCache();
    }

    setupEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    async initializeCache() {
        if ('caches' in window) {
            try {
                const cache = await caches.open('content-cache');
                // Initialize cache if needed
            } catch (error) {
                console.error('Error initializing cache:', error);
            }
        }
    }

    async loadContent(container, forceRefresh = false) {
        const url = container.dataset.contentUrl;
        if (!url) return;

        this.showLoadingState(container);

        try {
            const content = await this.fetchContent(url, container.dataset);
            this.renderContent(container, content);
            this.initializeDynamicContent(container);
        } catch (error) {
            this.handleError(container, error);
        }
    }

    showLoadingState(container) {
        const loader = document.createElement('div');
        loader.className = 'content-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p class="loader-text">Carregando...</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(loader);
    }

    async getFromCache(key) {
        if (!('caches' in window)) return null;

        try {
            const cache = await caches.open('content-cache');
            const response = await cache.match(key);
            if (response) {
                const data = await response.json();
                if (!this.isCacheExpired(data.timestamp)) {
                    return data.content;
                }
            }
        } catch (error) {
            console.error('Error reading from cache:', error);
        }
        return null;
    }

    isCacheExpired(timestamp) {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return Date.now() - timestamp > maxAge;
    }

    async fetchContent(url, dataset) {
        const cacheKey = this.getCacheKey(url, dataset);
        const cachedContent = await this.getFromCache(cacheKey);
        
        if (cachedContent) return cachedContent;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const content = dataset.template ? 
                this.transformJsonToHtml(data, dataset.template) : 
                data;

            await this.cacheContent(cacheKey, content);
            return content;
        } catch (error) {
            throw new Error('Failed to fetch content');
        }
    }

    transformJsonToHtml(data, templateId) {
        const template = document.getElementById(templateId);
        if (!template) throw new Error('Template not found');
        
        return this.applyTemplate(template.innerHTML, data);
    }

    applyTemplate(template, data) {
        return template.replace(/\${(.*?)}/g, (match, key) => {
            return data[key.trim()] || '';
        });
    }

    async cacheContent(key, content) {
        if (!('caches' in window)) return;

        try {
            const cache = await caches.open('content-cache');
            const data = {
                content,
                timestamp: Date.now()
            };
            await cache.put(key, new Response(JSON.stringify(data)));
        } catch (error) {
            console.error('Error caching content:', error);
        }
    }

    renderContent(container, content) {
        this.renderWithTransition(container, content);
    }

    renderWithTransition(container, content) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = content;
            container.style.opacity = '1';
        }, 200);
    }

    initializeDynamicContent(container) {
        // Initialize lazy loading images
        container.querySelectorAll('img[data-src]').forEach(img => {
            img.addEventListener('error', () => this.handleResourceError(img));
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
        });

        // Initialize interactive elements
        container.querySelectorAll('[data-interactive]').forEach(element => {
            this.initializeInteractiveElement(element);
        });
    }

    initializeInteractiveElement(element) {
        const type = element.dataset.interactive;
        
        switch (type) {
            case 'carousel':
                this.initializeCarousel(element);
                break;
        }
    }

    initializeCarousel(container) {
        const items = container.querySelectorAll('.carousel-item');
        let currentIndex = 0;
        
        const showItem = (index) => {
            items.forEach((item, i) => {
                item.hidden = i !== index;
            });
        };

        container.querySelector('.carousel-next')?.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            showItem(currentIndex);
        });

        container.querySelector('.carousel-prev')?.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            showItem(currentIndex);
        });

        showItem(currentIndex);
    }

    getCacheKey(url, dataset) {
        let key = url;
        if (dataset.cacheKey) {
            key += `|${dataset.cacheKey}`;
        }
        if (dataset.template) {
            key += `|${dataset.template}`;
        }
        return key;
    }
}

// Initialize content loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contentLoader = new ContentLoader();
});

// Carregamento dinâmico de conteúdo
document.addEventListener('DOMContentLoaded', () => {
    // Cache de posts carregados
    let loadedPosts = new Map();
    
    // Função para carregar mais posts
    async function loadMorePosts(page = 1) {
        try {
            const response = await fetch(`/api/posts?page=${page}`);
            if (!response.ok) throw new Error('Erro ao carregar posts');
            
            const posts = await response.json();
            return posts;
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
            return [];
        }
    }
    
    // Lazy loading para imagens
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    // Observa imagens com lazy loading
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    // Infinite scroll para blog posts
    const blogGrid = document.querySelector('.blog-grid');
    let currentPage = 1;
    let loading = false;
    
    const postObserver = new IntersectionObserver(async (entries) => {
        const lastPost = entries[0];
        if (lastPost.isIntersecting && !loading) {
            loading = true;
            const nextPosts = await loadMorePosts(++currentPage);
            
            if (nextPosts.length > 0) {
                nextPosts.forEach(post => {
                    if (!loadedPosts.has(post.id)) {
                        const postElement = createPostElement(post);
                        blogGrid?.appendChild(postElement);
                        loadedPosts.set(post.id, true);
                    }
                });
            }
            loading = false;
        }
    }, { threshold: 0.1 });
    
    // Observa último post para infinite scroll
    const posts = document.querySelectorAll('.blog-post');
    if (posts.length > 0) {
        postObserver.observe(posts[posts.length - 1]);
    }
    
    // Cria elemento de post do blog
    function createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'blog-post';
        article.innerHTML = `
            <div class="post-image">
                <img data-src="${post.image}" alt="${post.title}" class="lazy">
            </div>
            <div class="post-content">
                <div class="post-meta">${post.date} | ${post.category}</div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <a href="${post.url}">Continuar lendo</a>
            </div>
        `;
        
        // Observa nova imagem para lazy loading
        const newImage = article.querySelector('img');
        if (newImage) {
            imageObserver.observe(newImage);
        }
        
        return article;
    }
});