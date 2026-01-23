class DNSResolver {
  constructor() {
    this.cache = new Map();
    this.apiUrl = 'https://dns.google/resolve';
  }

  async resolve(domain) {
    if (this.cache.has(domain)) {
      return this.cache.get(domain);
    }

    try {
      const url = `${this.apiUrl}?name=${domain}&type=A`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`DNS API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      const ips = data.Answer?.filter(a => a.type === 1)
                              .map(a => a.data) || [];
      
      this.cache.set(domain, ips);
      return ips;
    } catch (error) {
      console.error(`DNS resolve failed for ${domain}:`, error);
      this.cache.set(domain, []);
      return [];
    }
  }

  async resolveBatch(domains, onProgress) {
    const BATCH_SIZE = 10;
    const results = new Map();
    const total = domains.length;
    
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = domains.slice(i, Math.min(i + BATCH_SIZE, total));
      const promises = batch.map(d => this.resolve(d));
      const batchResults = await Promise.all(promises);
      
      batch.forEach((domain, idx) => {
        results.set(domain, batchResults[idx]);
      });
      
      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, total), total);
      }
    }
    
    return results;
  }

  clearCache() {
    this.cache.clear();
  }

  getCachedIP(domain) {
    return this.cache.get(domain) || null;
  }

  hasCached(domain) {
    return this.cache.has(domain);
  }
}
