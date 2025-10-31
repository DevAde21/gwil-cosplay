document.addEventListener("DOMContentLoaded", function() {

    // --- SEÇÃO 1: CARREGAMENTO DE COMPONENTES E NAVEGAÇÃO ---
    const loadComponent = (elementId, filePath) => {
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${filePath}`);
                return response.text();
            })
            .then(data => {
                document.getElementById(elementId).innerHTML = data;
                if (elementId === 'header-placeholder') {
                    highlightActiveLink();
                }
            })
            .catch(error => console.error('Falha ao carregar componente:', error));
    };

    function highlightActiveLink() {
        const navLinks = document.querySelectorAll('.nav-links a');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
            if (currentPage === linkPage) {
                link.classList.add('active-link');
            }
        });
    }

    loadComponent("header-placeholder", "header.html");
    loadComponent("footer-placeholder", "footer.html");


    // --- SEÇÃO 2: LÓGICA DA LIGHTBOX DE IMAGEM (COM CORREÇÕES) ---
    const lightbox = document.createElement('div');
    lightbox.id = 'image-lightbox';
    lightbox.innerHTML = `<img src="" alt="Imagem ampliada">`;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('img');

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.classList.remove('no-scroll');
        // --- CORREÇÃO DO FLICKER: Reseta o padding ---
        document.body.style.paddingRight = '';
        const header = document.querySelector('.header');
        if(header) header.style.paddingRight = '';

        window.removeEventListener('keydown', handleEscape);
    };
    
    const openLightbox = (src) => {
        // --- CORREÇÃO DO FLICKER: Calcula e aplica o padding antes de desabilitar o scroll ---
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const hasScrollbar = document.body.scrollHeight > window.innerHeight;

        if (hasScrollbar) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            const header = document.querySelector('.header');
            if(header) header.style.paddingRight = `${scrollbarWidth}px`;
        }
        
        lightboxImage.src = src;
        lightbox.classList.add('active');
        document.body.classList.add('no-scroll');
        window.addEventListener('keydown', handleEscape);
    };

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    };

    lightbox.addEventListener('click', closeLightbox);
    
    document.body.addEventListener('click', (e) => {
        const clickedTarget = e.target;

        // Verifica se o alvo é uma imagem dentro de <main>
        if (clickedTarget.tagName === 'IMG' && clickedTarget.closest('main')) {
            // Se a imagem estiver dentro de um link (como no portfólio), não faz nada.
            if (clickedTarget.closest('a')) return;

            e.preventDefault();
            
            // --- CORREÇÃO DO CARROSSEL: Verifica se a imagem está em um carrossel ---
            const parentCarousel = clickedTarget.closest('.carousel');
            if (parentCarousel) {
                // Se estiver, encontra a imagem do slide ATIVO e usa o src dela
                const activeSlideImage = parentCarousel.querySelector('.carousel-slide.active img');
                if (activeSlideImage) {
                    openLightbox(activeSlideImage.src);
                }
            } else {
                // Se for uma imagem normal, usa o src dela diretamente
                openLightbox(clickedTarget.src);
            }
        }
    });


    // --- SEÇÃO 3: LÓGICA DA PÁGINA DO PORTFÓLIO ---
    const portfolioGrid = document.getElementById('portfolio-grid');
    if (portfolioGrid) {
        async function loadPortfolio() {
            for (let i = 1; i < 1000; i++) {
                const postId = i.toString().padStart(3, '0');
                const postFolder = `${postId}-portfolio`;
                const infoPath = `posts-portfolio/${postFolder}/${postId}-info.txt`;
                const thumbnailPath = `posts-portfolio/${postFolder}/${postId}-thumbnail-portfolio.webp`;
                try {
                    const response = await fetch(infoPath);
                    if (!response.ok) break;
                    const infoText = await response.text();
                    const [title, subtitle, blogPostId] = infoText.trim().split('\n');
                    const hasLink = blogPostId && blogPostId.trim() !== '';
                    const cardTag = hasLink ? 'a' : 'div';
                    const card = document.createElement(cardTag);
                    card.className = 'portfolio-card';
                    if (hasLink) card.href = `post.html?id=${blogPostId.trim()}`;
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


    // --- SEÇÃO 4: LÓGICA DA PÁGINA DO BLOG (LISTA DE POSTS) ---
    const blogListContainer = document.getElementById('blog-list-container');
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


    // --- SEÇÃO 5: LÓGICA DA PÁGINA DE POST INDIVIDUAL ---
    const postContentArea = document.getElementById('post-content-area');
    if (postContentArea) {
        let carouselCounter = 0;
        function parseBIAScript(biascriptText, postFolderPath) {
            let html = biascriptText;
            html = html.replace(/<carousel>([\s\S]*?)<\/carousel>/g, (match, imageList) => {
                const images = imageList.trim().split(',').map(img => img.trim());
                if (images.length === 0 || images[0] === '') return '';
                carouselCounter++;
                const carouselId = `carousel-${carouselCounter}`;
                const slidesHtml = images.map((img, index) => `<div class="carousel-slide${index === 0 ? ' active' : ''}"><img src="${postFolderPath}/${img}" alt="Imagem ${index + 1} do carrossel"></div>`).join('');
                const dotsHtml = images.map((_, index) => `<span class="carousel-dot${index === 0 ? ' active' : ''}" data-slide="${index}"></span>`).join('');
                return `<div class="carousel" id="${carouselId}"><div class="carousel-slides">${slidesHtml}</div>${images.length > 1 ? `<button class="carousel-arrow prev">&#10094;</button><button class="carousel-arrow next">&#10095;</button><div class="carousel-dots">${dotsHtml}</div>` : ''}</div>`;
            });
            html = html.replace(/<title>([\s\S]*?)<\/title>/g, '<h3>$1</h3>');
            html = html.replace(/<txt>([\s\S]*?)<\/txt>/g, '<p>$1</p>');
            html = html.replace(/<\/p>/g, '<br>');
            html = html.replace(/<img>(.*?)<\/img>/g, (match, imageName) => `<img src="${postFolderPath}/${imageName.trim()}" alt="Imagem do post">`);
            html = html.replace(/<link=(.*?)>([\s\S]*?)<\/link>/g, (match, span, url) => `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${span.trim()}</a>`);
            html = html.replace(/<link>([\s\S]*?)<\/link>/g, (match, url) => `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${url.trim()}</a>`);
            return html;
        }

        function initializeCarousels() {
            document.querySelectorAll('.carousel').forEach(carousel => {
                let currentIndex = 0;
                const slides = carousel.querySelectorAll('.carousel-slide');
                const dots = carousel.querySelectorAll('.carousel-dot');
                const prevButton = carousel.querySelector('.carousel-arrow.prev');
                const nextButton = carousel.querySelector('.carousel-arrow.next');
                const totalSlides = slides.length;
                if (totalSlides <= 1) return;
                function showSlide(index) {
                    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
                    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
                }
                prevButton.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; showSlide(currentIndex); });
                nextButton.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % totalSlides; showSlide(currentIndex); });
                dots.forEach(dot => {
                    dot.addEventListener('click', (e) => { e.stopPropagation(); currentIndex = parseInt(dot.getAttribute('data-slide')); showSlide(currentIndex); });
                });
            });
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
                initializeCarousels();
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