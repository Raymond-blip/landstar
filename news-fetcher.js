const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// News sources and configuration
const NEWS_SOURCES = {
  trucking: [
    'https://newsapi.org/v2/everything?q=trucking+transportation+logistics&sortBy=publishedAt&language=en',
    'https://newsapi.org/v2/everything?q=freight+shipping+supply+chain&sortBy=publishedAt&language=en'
  ],
  general: [
    'https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=10'
  ]
};

// Fallback news data (in case API fails)
const FALLBACK_NEWS = [
  {
    title: "Transportation Industry Shows Strong Growth in Q4 2025",
    description: "The transportation and logistics sector continues to demonstrate resilience with increased demand for freight services across North America.",
    url: "#",
    publishedAt: new Date().toISOString(),
    source: { name: "Industry Report" }
  },
  {
    title: "New Safety Regulations Enhance Driver Protection",
    description: "Recent updates to DOT regulations focus on improving driver safety and working conditions across the transportation industry.",
    url: "#",
    publishedAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
    source: { name: "Safety News" }
  },
  {
    title: "Technology Advances in Fleet Management",
    description: "Modern GPS tracking and fleet management systems are revolutionizing how transportation companies operate and serve customers.",
    url: "#",
    publishedAt: new Date(Date.now() - 48*60*60*1000).toISOString(),
    source: { name: "Tech Update" }
  }
];

class NewsFetcher {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '9916f7354eb248eb932e431dafdeeb92';
    this.newsCache = [];
    this.lastFetch = null;
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async fetchNews() {
    console.log('🗞️ Fetching latest news...');
    
    try {
      if (this.apiKey) {
        // Try to fetch from News API
        const news = await this.fetchFromAPI();
        if (news && news.length > 0) {
          this.newsCache = news;
          this.lastFetch = Date.now();
          console.log(`✅ Fetched ${news.length} news articles from API`);
          return news;
        }
      }
      
      // Fallback to generated news
      console.log('📰 Using fallback news (no API key or API failed)');
      this.newsCache = this.generateFallbackNews();
      this.lastFetch = Date.now();
      return this.newsCache;
      
    } catch (error) {
      console.error('❌ Error fetching news:', error.message);
      this.newsCache = this.generateFallbackNews();
      this.lastFetch = Date.now();
      return this.newsCache;
    }
  }

  async fetchFromAPI() {
    if (!this.apiKey) {
      console.log('❌ No API key provided');
      return null;
    }
    
    console.log('🔑 Using API key:', this.apiKey.substring(0, 8) + '...');
    
    return new Promise((resolve, reject) => {
      const url = `https://newsapi.org/v2/everything?q=trucking+transportation+logistics&sortBy=publishedAt&language=en&pageSize=6&apiKey=${this.apiKey}`;
      
      console.log('📡 Fetching from NewsAPI...');
      
      const options = {
        headers: {
          'User-Agent': 'Werner-News-System/1.0 (https://werner.com)',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        },
        timeout: 10000 // 10 second timeout for mobile networks
      };
      
      const request = https.get(url, options, (res) => {
        let data = '';
        
        // Handle different response encodings
        if (res.headers['content-encoding'] === 'gzip') {
          const zlib = require('zlib');
          const gunzip = zlib.createGunzip();
          res.pipe(gunzip);
          gunzip.on('data', chunk => data += chunk);
          gunzip.on('end', () => processResponse(data));
        } else {
          res.on('data', chunk => data += chunk);
          res.on('end', () => processResponse(data));
        }
        
        function processResponse(responseData) {
          try {
            const result = JSON.parse(responseData);
            console.log('📊 API Response status:', result.status);
            if (result.status === 'ok' && result.articles) {
              console.log(`✅ Found ${result.articles.length} articles from API`);
              resolve(result.articles.slice(0, 3)); // Get top 3 articles
            } else {
              console.log('⚠️ API returned no articles or error:', result.message || 'Unknown error');
              resolve(null);
            }
          } catch (e) {
            console.log('❌ Failed to parse API response:', e.message);
            resolve(null);
          }
        }
      });
      
      // Set timeout for mobile networks
      request.setTimeout(10000, () => {
        console.log('⏰ API request timed out');
        request.destroy();
        resolve(null);
      });
      
      request.on('error', (err) => {
        console.log('❌ API request failed:', err.message);
        resolve(null);
      });
    });
  }

  generateFallbackNews() {
    // Generate dynamic dates for fallback news
    const now = new Date();
    return FALLBACK_NEWS.map((article, index) => ({
      ...article,
      publishedAt: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString()
    }));
  }

  async getNews() {
    // Check if cache is still valid
    if (this.newsCache.length > 0 && this.lastFetch && 
        (Date.now() - this.lastFetch) < this.cacheExpiry) {
      console.log('📋 Using cached news');
      return this.newsCache;
    }
    
    // Fetch fresh news
    return await this.fetchNews();
  }

  formatNewsForHTML(articles) {
    return articles.map(article => {
      const date = new Date(article.publishedAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      return `
                <li class="latestNewsFooterWidget_preview">
                    <article>
                        <h4><a href="${article.url || '#'}">${article.title}</a></h4>
                        <time>${formattedDate}</time>
                        <div class="rte"><p>${article.description || 'Read more about this story...'}</p></div>
                        <a href="${article.url || '#'}" class="btn _outline">Read More</a>
                    </article>
                </li>`;
    }).join('');
  }
}

module.exports = NewsFetcher;