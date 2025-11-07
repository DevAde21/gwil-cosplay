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

    // --- FUNÇÃO GLOBAL DE INICIALIZAÇÃO DE CARROSSÉIS ---
    function initializeCarousels() {
        document.querySelectorAll('.carousel').forEach(carousel => {
            let currentIndex = 0;
            const slides = carousel.querySelectorAll('.carousel-slide');
            const dots = carousel.querySelectorAll('.carousel-dot');
            const prevButton = carousel.querySelector('.carousel-arrow.prev');
            const nextButton = carousel.querySelector('.carousel-arrow.next');
            const totalSlides = slides.length;
            
            if (totalSlides <= 1) {
                if(prevButton) prevButton.style.display = 'none';
                if(nextButton) nextButton.style.display = 'none';
                return;
            }
            
            function showSlide(index) {
                slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
                dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            }

            function showNextSlide() {
                currentIndex = (currentIndex + 1) % totalSlides;
                showSlide(currentIndex);
            }

            function showPrevSlide() {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                showSlide(currentIndex);
            }

            if (prevButton) prevButton.addEventListener('click', (e) => { e.stopPropagation(); showPrevSlide(); });
            if (nextButton) nextButton.addEventListener('click', (e) => { e.stopPropagation(); showNextSlide(); });
            
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = parseInt(dot.getAttribute('data-slide'));
                    showSlide(currentIndex);
                });
            });

            let touchStartX = 0;
            let touchEndX = 0;

            carousel.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            // CORREÇÃO 3: Prevenir o comportamento padrão de scroll durante o swipe
            carousel.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });

            carousel.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });

            function handleSwipe() {
                const swipeThreshold = 50;
                if (touchEndX < touchStartX - swipeThreshold) {
                    showNextSlide();
                } else if (touchEndX > touchStartX + swipeThreshold) {
                    showPrevSlide();
                }
            }
        });
    }


    // --- SEÇÃO 2: LÓGICA DA PÁGINA DO PORTFÓLIO ---
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


    // --- SEÇÃO 3: LÓGICA DA PÁGINA DO BLOG (LISTA DE POSTS) ---
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


    // --- SEÇÃO 4: LÓGICA DA PÁGINA DE POST INDIVIDUAL ---
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
            
            html = html.replace(/<img>([\s\S]*?)<\/img>/g, (match, imageNames) => {
                const images = imageNames.trim().split(',').map(img => img.trim()).filter(Boolean);

                if (images.length === 2) {
                    return `<div class="dual-image-container"><img src="${postFolderPath}/${images[0]}" alt="Imagem do post 1"><img src="${postFolderPath}/${images[1]}" alt="Imagem do post 2"></div>`;
                } else if (images.length === 1) {
                    return `<div class="single-image-container"><img src="${postFolderPath}/${images[0]}" alt="Imagem do post"></div>`;
                }
                return '';
            });

            html = html.replace(/<title>([\s\S]*?)<\/title>/g, '<h3>$1</h3>');
            html = html.replace(/<txt>([\s\S]*?)<\/txt>/g, '<p>$1</p>');
            html = html.replace(/<\/p>/g, '<br>');
            html = html.replace(/<link=(.*?)>([\s\S]*?)<\/link>/g, (match, span, url) => `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${span.trim()}</a>`);
            html = html.replace(/<link>([\s\S]*?)<\/link>/g, (match, url) => `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${url.trim()}</a>`);
            
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
    
    // --- SEÇÃO 5: LÓGICA DA PÁGINA INICIAL ---
    const isHomePage = document.getElementById('agenda-banner');
    if (isHomePage) {
        // Função para carregar o status da agenda
        async function loadAgendaStatus() {
            const statusTextElement = document.getElementById('agenda-status-text');
            try {
                const response = await fetch('schedule_info.txt');
                if (!response.ok) throw new Error('Arquivo de agenda não encontrado.');
                const text = await response.text();
                const [monthsRaw, status] = text.trim().split('\n');
                
                let months = monthsRaw.split(',').map(m => m.trim());
                let monthString = '';

                if (months.length > 1) {
                    const lastMonth = months.pop();
                    monthString = `${months.join(', ')} e ${lastMonth}`;
                } else {
                    monthString = months[0];
                }

                statusTextElement.textContent = `Agenda para ${monthString} ${status}!`;
            } catch (error) {
                console.error('Erro ao carregar status da agenda:', error);
                statusTextElement.textContent = 'Não foi possível carregar o status da agenda.';
            }
        }
        
        // Função para carregar os últimos posts do blog
        async function loadLatestPosts() {
            const latestPostsGrid = document.getElementById('latest-posts-grid');
            if (!latestPostsGrid) return;

            try {
                const indexResponse = await fetch('blog_index.txt');
                if (!indexResponse.ok) throw new Error('Arquivo de índice do blog (blog_index.txt) não encontrado.');
                
                const indexText = await indexResponse.text();
                const allPostIds = indexText.trim().split('\n').filter(Boolean);
                
                const latestPostIds = allPostIds.reverse().slice(0, 6);

                for (const postId of latestPostIds) {
                    const scriptPath = `posts-blog/${postId}-blog/${postId}-script.txt`;
                    const thumbnailPath = `posts-blog/${postId}-blog/${postId}-thumbnail-blog.webp`;

                    try {
                        const postResponse = await fetch(scriptPath);
                        const text = await postResponse.text();
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
                        latestPostsGrid.appendChild(cardLink);
                    } catch (postError) {
                        console.error(`Erro ao carregar detalhes do post ${postId}:`, postError);
                    }
                }
            } catch (error) {
                console.error("Falha ao carregar posts recentes:", error);
                latestPostsGrid.innerHTML = `<p>Não foi possível carregar os posts recentes.</p>`;
            }
        }
        
        // Função para carregar os feedbacks
        async function loadFeedbacks() {
            const slidesContainer = document.getElementById('feedbacks-slides-container');
            const dotsContainer = document.getElementById('feedbacks-dots-container');
            if (!slidesContainer || !dotsContainer) return;

            try {
                const response = await fetch('feedbacks.txt');
                if (!response.ok) throw new Error('Arquivo de feedbacks não encontrado.');
                const text = await response.text();
                const feedbacks = text.trim().split(/\n\s*\n/);
                
                let slidesHtml = '';
                let dotsHtml = '';

                feedbacks.forEach((feedback, index) => {
                    const [quote, author] = feedback.split('\n');
                    if (quote && author) {
                        slidesHtml += `
                            <div class="carousel-slide${index === 0 ? ' active' : ''}">
                                <p class="feedback-quote">“${quote.trim()}”</p>
                                <span class="feedback-author">- ${author.trim()}</span>
                            </div>
                        `;
                        dotsHtml += `<span class="carousel-dot${index === 0 ? ' active' : ''}" data-slide="${index}"></span>`;
                    }
                });

                slidesContainer.innerHTML = slidesHtml;
                dotsContainer.innerHTML = dotsHtml;
                
                initializeCarousels();

            } catch (error) {
                console.error("Erro ao carregar feedbacks:", error);
                slidesContainer.innerHTML = `<p>Não foi possível carregar os feedbacks.</p>`;
            }
        }

        loadAgendaStatus();
        loadLatestPosts();
        loadFeedbacks();
    }
});