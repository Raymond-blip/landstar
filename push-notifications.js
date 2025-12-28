const webpush = require('web-push');
const fs = require('fs').promises;
const path = require('path');

class PushNotificationManager {
  constructor() {
    // VAPID keys for push notifications (you can generate new ones if needed)
    this.vapidKeys = {
      publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLEaQHqq_-NjJ-S6lGFJTSSfFBlYb1_m-n67wgD4Qid3yP0DTtoF1VE',
      privateKey: 'aUWqaGFNFWfz9DiQDBqu3_c-P7YkxGZt9a_5ULGd2bI'
    };
    
    // Configure web-push
    webpush.setVapidDetails(
      'mailto:wernerenterprisesrecuritment@gmail.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
    
    this.subscribers = new Map(); // In-memory storage (you could use database)
    this.lastNewsHash = null;
    this.loadSubscribers();
  }

  async loadSubscribers() {
    try {
      const subscribersFile = path.join(__dirname, 'data', 'subscribers.json');
      const data = await fs.readFile(subscribersFile, 'utf8');
      const subscribers = JSON.parse(data);
      subscribers.forEach(sub => {
        this.subscribers.set(sub.endpoint, sub);
      });
      console.log(`📱 Loaded ${this.subscribers.size} push notification subscribers`);
    } catch (error) {
      console.log('📱 No existing subscribers found, starting fresh');
    }
  }

  async saveSubscribers() {
    try {
      const subscribersFile = path.join(__dirname, 'data', 'subscribers.json');
      const subscribers = Array.from(this.subscribers.values());
      await fs.writeFile(subscribersFile, JSON.stringify(subscribers, null, 2));
      console.log(`💾 Saved ${subscribers.length} subscribers`);
    } catch (error) {
      console.error('❌ Failed to save subscribers:', error);
    }
  }

  async subscribe(subscription) {
    try {
      this.subscribers.set(subscription.endpoint, subscription);
      await this.saveSubscribers();
      console.log('✅ New push notification subscriber added');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to add subscriber:', error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribe(endpoint) {
    try {
      this.subscribers.delete(endpoint);
      await this.saveSubscribers();
      console.log('🗑️ Push notification subscriber removed');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to remove subscriber:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNotification(title, body, url = null, icon = null) {
    if (this.subscribers.size === 0) {
      console.log('📱 No subscribers to notify');
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/media/werner logo.png',
      badge: '/media/werner logo.png',
      url: url || '/',
      timestamp: Date.now(),
      actions: [
        {
          action: 'view',
          title: 'View News',
          icon: '/media/werner logo.png'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    });

    let sent = 0;
    let failed = 0;
    const failedEndpoints = [];

    for (const [endpoint, subscription] of this.subscribers) {
      try {
        await webpush.sendNotification(subscription, payload, {
          TTL: 60,
          urgency: 'normal',
          topic: 'werner-news'
        });
        sent++;
        console.log(`📤 Notification sent successfully`);
      } catch (error) {
        failed++;
        failedEndpoints.push(endpoint);
        console.error(`❌ Failed to send notification:`, error.statusCode, error.body);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 413) {
          console.log('🗑️ Removing invalid subscription');
          this.subscribers.delete(endpoint);
        }
      }
    }

    // Save updated subscribers list if any were removed
    if (failedEndpoints.length > 0) {
      await this.saveSubscribers();
    }

    console.log(`📊 Notifications: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  async notifyNewNews(newsArticles) {
    if (!newsArticles || newsArticles.length === 0) return;

    // Create a hash of current news to detect changes
    const newsHash = this.createNewsHash(newsArticles);
    
    if (this.lastNewsHash === newsHash) {
      console.log('📰 No new news to notify about');
      return;
    }

    this.lastNewsHash = newsHash;
    
    // Get the latest article for notification
    const latestArticle = newsArticles[0];
    
    const title = '📰 Werner News Update';
    const body = latestArticle.title.length > 100 
      ? latestArticle.title.substring(0, 97) + '...'
      : latestArticle.title;
    
    console.log('🔔 Sending news notification to all subscribers...');
    return await this.sendNotification(title, body, latestArticle.url);
  }

  createNewsHash(articles) {
    // Create a simple hash based on the titles of the articles
    const titles = articles.map(a => a.title).join('|');
    return Buffer.from(titles).toString('base64').substring(0, 20);
  }

  getVapidPublicKey() {
    return this.vapidKeys.publicKey;
  }

  getSubscriberCount() {
    return this.subscribers.size;
  }
}

module.exports = PushNotificationManager;