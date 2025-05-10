// Debug mode for troubleshooting
window.DEBUG = true;

// Main initialization function
function initializeInitiativePage() {
    if (window.DEBUG) console.log('Initializing initiative page');
    
    // Verificar se as bibliotecas necessárias estão carregadas
    if (typeof marked === 'undefined' || typeof jsyaml === 'undefined') {
        console.error('Required libraries not loaded');
        document.getElementById('initiative-article').innerHTML = `
            <div class="error-message">
                <h2>Erro ao carregar bibliotecas</h2>
                <p>Por favor, recarregue a página</p>
            </div>
        `;
        return;
    }

    const articleElement = document.getElementById('initiative-article');
    const titleElement = document.getElementById('initiative-title');
    const metaElement = document.getElementById('initiative-meta');
    
    if (!articleElement || !titleElement || !metaElement) {
        console.error('Required elements not found');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const initiativeId = params.get('id');

    if (window.DEBUG) console.log('Initiative ID:', initiativeId);

    if (!initiativeId) {
        showError('Iniciativa não encontrada');
        return;
    }

    // Add loading state
    articleElement.innerHTML = '<div class="loading">Carregando conteúdo...</div>';

    // Detect if running on GitHub Pages or locally
    const isGitHubPages = window.location.hostname.includes('github.io');
    const baseUrl = isGitHubPages ? '' : '';
    if (window.DEBUG) console.log('Environment:', isGitHubPages ? 'GitHub Pages' : 'Local');
    
    // Build the correct path based on environment
    // Try multiple path strategies to ensure compatibility
    const initiativePath = `${baseUrl}assets/initiatives/${initiativeId}.md`;
    if (window.DEBUG) console.log('Trying to fetch from:', initiativePath);
    
    // First try the relative path
    fetch(initiativePath)
        .then(response => {
            if (!response.ok) {
                // If relative path fails, try with absolute path as fallback
                const absolutePath = `/${initiativePath}`;
                if (window.DEBUG) console.log('Relative path failed, trying absolute path:', absolutePath);
                return fetch(absolutePath);
            }
            return response;
        })
        .then(response => {
            if (!response.ok) throw new Error('Iniciativa não encontrada');
            return response.text();
        })
        .then(text => {
            if (window.DEBUG) console.log('Initiative content loaded');

            // Split front matter and content
            const [, frontMatter, content] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            
            // Parse front matter
            const metadata = jsyaml.load(frontMatter);
            if (window.DEBUG) console.log('Front matter:', metadata);

            // Update page title and meta
            document.title = `${metadata.title} - Guanambi Robotics`;
            titleElement.textContent = metadata.title;
            
            // Update meta information in hero section
            metaElement.innerHTML = `
                <span class="date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(metadata.date).toLocaleDateString('pt-BR')}
                </span>
                <span class="category">
                    <i class="fas fa-folder"></i>
                    ${metadata.category}
                </span>
            `;

            // Convert markdown to HTML using marked
            try {
                const contentHtml = marked.parse(content);
                if (window.DEBUG) console.log('Content processed successfully');

                // Render the full article
                articleElement.innerHTML = `
                    <div class="initiative-content markdown-content">
                        ${contentHtml}
                    </div>
                    
                    <div class="image-gallery">
                        ${(metadata.images || []).map(img => `
                            <figure>
                                <img src="${img}" alt="Imagem do projeto" loading="lazy">
                            </figure>
                        `).join('')}
                    </div>
                    
                    <div class="project-info">
                        <h3>Informações do Projeto</h3>
                        <ul>
                            <li>
                                <i class="fas fa-project-diagram"></i>
                                <strong>Projeto:</strong> ${metadata.project_info?.nome || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-calendar-alt"></i>
                                <strong>Ano:</strong> ${metadata.project_info?.ano || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Local:</strong> ${metadata.project_info?.local || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-users"></i>
                                <strong>Estudantes:</strong> ${metadata.project_info?.estudantes
                                    ? metadata.project_info.estudantes.map(e => `${e.nome} (${e.papel})`).join(', ')
                                    : 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-user-tie"></i>
                                <strong>Coordenador:</strong> ${metadata.project_info?.coordenador || 'Não informado'}
                            </li>
                        </ul>
                    </div>
                `;
            } catch (error) {
                console.error('Error processing markdown:', error);
                showError('Erro ao processar o conteúdo');
            }
        })
        .catch(error => {
            console.error('Error loading initiative:', error);
            showError(error.message);
        });
}

function showError(message) {
    const articleElement = document.getElementById('initiative-article');
    const titleElement = document.getElementById('initiative-title');
    const metaElement = document.getElementById('initiative-meta');
    
    titleElement.textContent = 'Erro';
    metaElement.innerHTML = '';
    articleElement.innerHTML = `
        <div class="error-message">
            <h2>Erro ao carregar a iniciativa</h2>
            <p>${message}</p>
            <a href="index.html" class="btn">Voltar para página inicial</a>
        </div>
    `;
}

// Aguardar o carregamento do DOM e das bibliotecas antes de inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Tentar inicializar a página algumas vezes para garantir que as bibliotecas estejam carregadas
    let attempts = 0;
    const maxAttempts = 5;
    
    function tryInitialize() {
        if (typeof marked !== 'undefined' && typeof jsyaml !== 'undefined') {
            initializeInitiativePage();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryInitialize, 100);
        } else {
            console.error('Failed to load required libraries');
            document.getElementById('initiative-article').innerHTML = `
                <div class="error-message">
                    <h2>Erro ao carregar bibliotecas</h2>
                    <p>Por favor, recarregue a página</p>
                    <button onclick="location.reload()" class="btn">Recarregar página</button>
                </div>
            `;
        }
    }
    
    tryInitialize();
});