// Ultra-simple mobile-compatible news loading
(function() {
    var loadAttempts = 0;
    var maxRetries = 3;
    
    function log(message) {
        console.log('[NEWS] ' + message);
        var debugDiv = document.getElementById('mobile-debug-info');
        if (debugDiv) {
            debugDiv.innerHTML += '<div style="font-size: 12px; margin: 2px 0;">' + new Date().toLocaleTimeString() + ' - ' + message + '</div>';
            debugDiv.scrollTop = debugDiv.scrollHeight;
        }
    }
    
    function loadNews() {
        log('Starting news load...');
        var container = document.getElementById('newsContainer');
        
        if (!container) {
            log('ERROR: News container not found!');
            return;
        }
        
        // Show loading
        container.innerHTML = '<li class="latestNewsFooterWidget_preview"><article><h4>🔄 Loading News...</h4><time>Fetching latest news...</time><div class="rte"><p>Please wait...</p></div></article></li>';
        
        // Try fetch first
        if (typeof fetch !== 'undefined') {
            log('Trying fetch...');
            fetch('/api/news')
                .then(function(response) {
                    log('Response: ' + response.status);
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('HTTP ' + response.status);
                    }
                })
                .then(function(data) {
                    log('Data received');
                    if (data && data.ok && data.news && data.news.length > 0) {
                        displayNews(container, data.news);
                    } else {
                        showFallback(container);
                    }
                })
                .catch(function(error) {
                    log('Fetch failed: ' + error.message);
                    tryXHR(container);
                });
        } else {
            log('Fetch not supported, trying XHR...');
            tryXHR(container);
        }
    }
    
    function tryXHR(container) {
        log('Trying XMLHttpRequest...');
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/news', true);
            xhr.timeout = 15000;
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            log('XHR success');
                            if (data && data.ok && data.news && data.news.length > 0) {
                                displayNews(container, data.news);
                            } else {
                                showFallback(container);
                            }
                        } catch (e) {
                            log('XHR parse error: ' + e.message);
                            showFallback(container);
                        }
                    } else {
                        log('XHR failed: ' + xhr.status);
                        showFallback(container);
                    }
                }
            };
            
            xhr.onerror = function() {
                log('XHR network error');
                showFallback(container);
            };
            
            xhr.ontimeout = function() {
                log('XHR timeout');
                showFallback(container);
            };
            
            xhr.send();
        } catch (e) {
            log('XHR error: ' + e.message);
            showFallback(container);
        }
    }
    
    function displayNews(container, news) {
        log('Displaying ' + news.length + ' articles');
        var html = '';
        
        for (var i = 0; i < news.length; i++) {
            var article = news[i];
            var date = new Date(article.publishedAt);
            var dateStr = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            html += '<li class="latestNewsFooterWidget_preview">';
            html += '<article>';
            html += '<h4><a href="' + (article.url || '#') + '" target="_blank">' + article.title + '</a></h4>';
            html += '<time>' + dateStr + '</time>';
            html += '<div class="rte"><p>' + (article.description || 'Read more...') + '</p></div>';
            html += '<a href="' + (article.url || '#') + '" class="btn _outline" target="_blank">Read More</a>';
            html += '</article>';
            html += '</li>';
        }
        
        container.innerHTML = html;
        log('News displayed successfully!');
    }
    
    function showFallback(container) {
        log('Showing fallback news');
        var html = '';
        var fallbackNews = [
            {
                title: 'Transportation Industry Shows Strong Growth',
                description: 'The transportation and logistics sector continues to demonstrate resilience with increased demand for freight services.',
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            },
            {
                title: 'New Safety Regulations Enhance Driver Protection',
                description: 'Recent updates to DOT regulations focus on improving driver safety and working conditions.',
                date: new Date(Date.now() - 24*60*60*1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        ];
        
        for (var i = 0; i < fallbackNews.length; i++) {
            var article = fallbackNews[i];
            html += '<li class="latestNewsFooterWidget_preview">';
            html += '<article>';
            html += '<h4>' + article.title + '</h4>';
            html += '<time>' + article.date + '</time>';
            html += '<div class="rte"><p>' + article.description + '</p></div>';
            html += '<a href="#" class="btn _outline">Read More</a>';
            html += '</article>';
            html += '</li>';
        }
        
        container.innerHTML = html;
        log('Fallback news displayed');
    }
    
    // Initialize when DOM is ready
    function init() {
        log('Initializing news system...');
        
        // Check if container exists
        var container = document.getElementById('newsContainer');
        if (!container) {
            log('ERROR: Container not found during init');
            return;
        }
        
        // Start loading after a delay
        setTimeout(function() {
            loadNews();
        }, 2000);
    }
    
    // Make loadNews available globally for manual refresh
    window.loadNewsManually = loadNews;
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();