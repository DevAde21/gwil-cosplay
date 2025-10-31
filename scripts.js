document.addEventListener("DOMContentLoaded", function() {

    // --- SEÇÃO 1: CARREGAMENTO DE COMPONENTES E NAVEGAÇÃO ---

    /**
     * Carrega um componente HTML (como header ou footer) em um placeholder.
     * @param {string} elementId - O ID do elemento onde o componente será inserido.
     * @param {string} filePath - O caminho para o arquivo HTML do componente.
     */
    const loadComponent = (elementId, filePath) => {
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${filePath}`);
                return response.text();
            })
            .then(data => {
                document.getElementById(elementId).innerHTML = data;
                // Após o header ser carregado, ativa a função para destacar o link da página atual.
                if (elementId === 'header-placeholder') {
                    highlightActiveLink();
                }
            })
            .catch(error => {
                console.error('Falha ao carregar componente:', error);
                const placeholder = document.getElementById(elementId);
                if (placeholder) {
                    placeholder.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar o ${elementId.split('-')[0]}.</p>`;
                }
            });
    };

    /**
     * Adiciona uma classe 'active-link' ao link de navegação correspondente à página atual.
     */
    function highlightActiveLink() {
        const navLinks = document.querySelectorAll('.nav-links a');
        // Pega o nome do arquivo da URL atual (ex: "blog.html")
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
            if (currentPage === linkPage) {
                link.classList.add('active-link');
            }
        });
    }

    // Inicia o carregamento do header e footer em todas as páginas.
    loadComponent("header-placeholder", "header.html");
    loadComponent("footer-placeholder", "footer.html");


    // --- SEÇÃO 2: LÓGICA DA PÁGINA DO PORTFÓLIO ---

    const portfolioGrid = document.getElementById('portfolio-grid');
    // Executa apenas se estiver na página do portfólio.
    if (portfolioGrid) {
        async function loadPortfolio() {
            for (let i = 1; i < 1000; i++) {
                const postId = i.toString().padStart(3, '0');
                const postFolder = `${postId}-portfolio`;
                const infoPath = `posts-portfolio/${postFolder}/${postId}-info.txt`;
                const thumbnailPath = `posts-portfolio/${postFolder}/${postId}-thumbnail-portfolio.webp`;

                try {
                    const response = await fetch(infoPath);
                    if (!response.ok) break; // Para o loop se o post não for encontrado.

                    const infoText = await response.text();
                    const [title, subtitle, blogPostId] = infoText.trim().split('\n');

                    const hasLink = blogPostId && blogPostId.trim() !== '';
                    const cardTag = hasLink ? 'a' : 'div';
                    
                    const card = document.createElement(cardTag);
                    card.className = 'portfolio-card';
                    if (hasLink) {
                        card.href = `post.html?id=${blogPostId.trim()}`;
                    }
                    
                    card.innerHTML = `
                        <img src="${thumbnailPath}" alt="${title}">
                        <div class="portfolio-card-info">
                            <h2 class="portfolio-title">${title || ''}</h2>
                            <p class="portfolio-subtitle">${subtitle || ''}</p>
                        </div>
                    `;
                    portfolioGrid.appendChild(card);
                } catch (error) {
                    console.error('Ocorreu um erro ao carregar o portfólio:', error);
                    break;
                }
            }
        }
        loadPortfolio();
    }


    // --- SEÇÃO 3: LÓGICA DA PÁGINA DO BLOG (LISTA DE POSTS) ---

    const blogListContainer = document.getElementById('blog-list-container');
    // Executa apenas se estiver na página principal do blog.
    if (blogListContainer) {
        async function loadBlogPreviews() {
            for (let i = 1; i < 1000; i++) {
                const postId = i.toString().padStart(3, '0');
                const scriptPath = `posts-blog/${postId}-blog/${postId}-script.txt`;
                const thumbnailPath = `posts-blog/${postId}-blog/${postId}-thumbnail-blog.webp`;

                try {
                    const response = await fetch(scriptPath);
                    if (!response.ok) break;

                    const text = await response.text();
                    const lines = text.trim().split('\n');

                    const title = lines[0] || 'Post sem título';
                    const date = lines[1] || '';
                    const description = lines[2] || '';

                    const cardLink = document.createElement('a');
                    cardLink.href = `post.html?id=${postId}`;
                    cardLink.className = 'blog-preview-card';
                    cardLink.innerHTML = `
                        <img src="${thumbnailPath}" alt="Thumbnail de ${title}" class="blog-thumbnail">
                        <div class="blog-preview-content">
                            <h2 class="blog-title">${title}</h2>
                            <p class="blog-date">${date}</p>
                            <p class="blog-description">${description}</p>
                        </div>
                    `;
                    blogListContainer.appendChild(cardLink);
                } catch (error) {
                    console.error(`Erro ao carregar prévia do post ${postId}:`, error);
                    break;
                }
            }
        }
        loadBlogPreviews();
    }


    // --- SEÇÃO 4: LÓGICA DA PÁGINA DE POST INDIVIDUAL ---
    
    const postContentArea = document.getElementById('post-content-area');
    // Executa apenas se estiver na página de um post individual.
    if (postContentArea) {
        /**
         * Converte uma string em BIAScript para HTML.
         */
        function parseBIAScript(biascriptText, postFolderPath) {
            let html = biascriptText;
            html = html.replace(/<title>([\s\S]*?)<\/title>/g, '<h3>$1</h3>');
            html = html.replace(/<txt>([\s\S]*?)<\/txt>/g, '<p>$1</p>');
            html = html.replace(/<\/p>/g, '<br>');
            html = html.replace(/<img>(.*?)<\/img>/g, (match, imageName) => `<img src="${postFolderPath}/${imageName.trim()}" alt="Imagem do post">`);
            html = html.replace(/<link=(.*?)>([\s\S]*?)<\/link>/g, (match, span, url) => `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${span.trim()}</a>`);
            html = html.replace(/<link>([\s\S]*?)<\/link>/g, (match, url) => {
                const trimmedUrl = url.trim();
                return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer">${trimmedUrl}</a>`;
            });
            return html;
        }

        async function loadPost() {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');

            const postTitleEl = document.getElementById('post-title');
            const postDateEl = document.getElementById('post-date');
            const postBodyEl = document.getElementById('post-body');

            if (!postId) {
                postTitleEl.innerText = 'Post não encontrado!';
                postBodyEl.innerHTML = '<p>O ID do post não foi fornecido na URL.</p>';
                return;
            }

            const postFolderName = `${postId}-blog`;
            const postFolderPath = `posts-blog/${postFolderName}`;
            const scriptPath = `${postFolderPath}/${postId}-script.txt`;

            try {
                const response = await fetch(scriptPath);
                if (!response.ok) throw new Error('Post não encontrado no servidor.');

                const text = await response.text();
                const lines = text.trim().split('\n');

                const title = lines[0] || 'Post sem título';
                const date = lines[1] || '';
                const biascriptContent = lines.slice(4).join('\n');
                const postBodyHtml = parseBIAScript(biascriptContent, postFolderPath);

                document.title = `Gwil Cosplay - ${title}`;
                postTitleEl.innerText = title;
                postDateEl.innerText = date;
                postBodyEl.innerHTML = postBodyHtml;
            } catch (error) {
                console.error('Erro ao carregar o post:', error);
                document.title = 'Gwil Cosplay - Erro';
                postTitleEl.innerText = 'Erro ao carregar post';
                postBodyEl.innerHTML = '<p>Não foi possível encontrar ou carregar o conteúdo deste post. Por favor, verifique o ID e tente novamente.</p>';
            }
        }
        
        loadPost();
    }
});