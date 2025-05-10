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

    // Try multiple path strategies to ensure compatibility
    function tryLoadFile(paths, currentIndex = 0) {
        if (currentIndex >= paths.length) {
            showError('Iniciativa não encontrada');
            return Promise.reject(new Error('Iniciativa não encontrada'));
        }

        const currentPath = paths[currentIndex];
        if (window.DEBUG) console.log(`Tentativa ${currentIndex + 1}/${paths.length}: Tentando carregar: ${currentPath}`);
        
        return fetch(currentPath)
            .then(response => {
                if (!response.ok) {
                    if (window.DEBUG) console.log(`Caminho ${currentPath} falhou, tentando próxima estratégia...`);
                    return tryLoadFile(paths, currentIndex + 1);
                }
                if (window.DEBUG) console.log(`Arquivo carregado com sucesso de: ${currentPath}`);
                return response.text();
            });
    }

    // Define all possible paths to try (ordem importante)
    const pathsToTry = [
        `assets/initiatives/${initiativeId}.md`,                      // Relativo à raiz
        `./assets/initiatives/${initiativeId}.md`,                    // Relativo ao diretório atual
        `/assets/initiatives/${initiativeId}.md`,                     // Absoluto
        `/guanambi.github.io/assets/initiatives/${initiativeId}.md`,  // GitHub Pages específico
        `https://guanambi.github.io/assets/initiatives/${initiativeId}.md` // URL Completa
    ];
    
    // Try all paths
    tryLoadFile(pathsToTry)
        .then(text => {
            if (window.DEBUG) console.log('Initiative content loaded');

            try {
                // Log the raw content for debugging
                if (window.DEBUG) console.log('Raw content:', text.substring(0, 200) + '...');
                
                // Verificar se o texto está vazio
                if (!text || text.trim() === '') {
                    throw new Error('Arquivo vazio ou inválido');
                }

                // Extrair front matter e conteúdo de forma mais robusta
                let frontMatter = {};
                let content = text;
                
                // Tentar diferentes padrões de front matter
                const fmPattern = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
                const match = text.match(fmPattern);
                
                if (match) {
                    try {
                        frontMatter = jsyaml.load(match[1]) || {};
                        content = match[2] || '';
                    } catch (yamlError) {
                        console.error('Error parsing YAML front matter:', yamlError);
                        // Continue com frontMatter vazio se não conseguir parsear
                    }
                } else {
                    console.warn('Front matter não encontrado, usando conteúdo completo');
                }
                
                if (window.DEBUG) console.log('Front matter parsed:', frontMatter);

                // Update page title and meta
                document.title = `${frontMatter.title || 'Iniciativa'} - Guanambi Robotics`;
                titleElement.textContent = frontMatter.title || 'Iniciativa';
                
                // Update meta information in hero section
                metaElement.innerHTML = `
                    <span class="date">
                        <i class="fas fa-calendar"></i>
                        ${frontMatter.date ? new Date(frontMatter.date).toLocaleDateString('pt-BR') : 'Data não informada'}
                    </span>
                    <span class="category">
                        <i class="fas fa-folder"></i>
                        ${frontMatter.category || 'Categoria não informada'}
                    </span>
                `;

                // Convert markdown to HTML using marked
                const contentHtml = marked.parse(content);
                if (window.DEBUG) console.log('Content processed successfully');

                // Render the full article
                articleElement.innerHTML = `
                    <div class="initiative-content markdown-content">
                        ${contentHtml}
                    </div>
                    
                    <div class="image-gallery">
                        ${(frontMatter.images || []).map(img => `
                            <figure>
                                <img src="${img.startsWith('/') ? img.substring(1) : img}" alt="Imagem do projeto" loading="lazy">
                            </figure>
                        `).join('')}
                    </div>
                    
                    <div class="project-info">
                        <h3>Informações do Projeto</h3>
                        <ul>
                            <li>
                                <i class="fas fa-project-diagram"></i>
                                <strong>Projeto:</strong> ${frontMatter.project_info?.nome || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-calendar-alt"></i>
                                <strong>Ano:</strong> ${frontMatter.project_info?.ano || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Local:</strong> ${frontMatter.project_info?.local || 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-users"></i>
                                <strong>Estudantes:</strong> ${frontMatter.project_info?.estudantes
                                    ? frontMatter.project_info.estudantes.map(e => `${e.nome} (${e.papel})`).join(', ')
                                    : 'Não informado'}
                            </li>
                            <li>
                                <i class="fas fa-user-tie"></i>
                                <strong>Coordenador:</strong> ${frontMatter.project_info?.coordenador || 'Não informado'}
                            </li>
                        </ul>
                    </div>
                `;
            } catch (error) {
                console.error('Error processing initiative:', error);
                showError('Erro ao processar o conteúdo: ' + error.message);
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