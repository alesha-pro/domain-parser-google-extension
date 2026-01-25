(function() {
  const dnsResolver = new DNSResolver();

  const state = {
    isRecording: false,
    domains: new Set(),
    domainData: new Map(),
    totalRequests: 0,
    isResolving: false
  };

  const elements = {
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    exportDomainsBtn: document.getElementById('exportDomainsBtn'),
    exportIPsBtn: document.getElementById('exportIPsBtn'),
    clearBtn: document.getElementById('clearBtn'),
    recordingStatus: document.getElementById('recordingStatus'),
    resolveProgress: document.getElementById('resolveProgress'),
    resolvedCount: document.getElementById('resolvedCount'),
    totalCount: document.getElementById('totalCount'),
    progressFill: document.getElementById('progressFill'),
    totalRequests: document.getElementById('totalRequests'),
    uniqueDomains: document.getElementById('uniqueDomains'),
    resolvedIPs: document.getElementById('resolvedIPs'),
    domainContainer: document.getElementById('domainContainer')
  };

  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return null;
      }
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  function updateUI() {
    elements.totalRequests.textContent = state.totalRequests;
    elements.uniqueDomains.textContent = state.domains.size;

    let totalIPs = 0;
    for (const data of state.domainData.values()) {
      totalIPs += data.ips.size;
    }
    elements.resolvedIPs.textContent = totalIPs;

    if (state.domains.size === 0) {
      elements.domainContainer.innerHTML = '<div class="empty-state">No domains captured yet. Click "Start Recording" to begin.</div>';
    } else {
      const sortedDomains = Array.from(state.domains).sort();
      elements.domainContainer.innerHTML = sortedDomains
        .map(domain => {
          const data = state.domainData.get(domain);
          const ipCount = data ? data.ips.size : 0;
          const subnetCount = data ? data.subnets.size : 0;
          const statusClass = data && data.ips.size > 0 ? 'resolved' : 'pending';
          const statusIcon = data && data.ips.size > 0 ? '✓' : '⋯';
          
          return `
            <div class="domain-item">
              <span class="domain">${domain}</span>
              <span class="ip-info">${ipCount} IPs, ${subnetCount} subnets</span>
              <span class="status-icon ${statusClass}">${statusIcon}</span>
            </div>
          `;
        })
        .join('');
    }
  }

  function handleRequest(request) {
    if (!state.isRecording) return;

    const domain = extractDomain(request.request.url);
    if (!domain) return;

    state.domains.add(domain);
    state.totalRequests++;

    if (!state.domainData.has(domain)) {
      state.domainData.set(domain, {
        ips: new Set(),
        subnets: new Set(),
        requestCount: 0,
        resolveStatus: 'pending'
      });
    }

    const domainData = state.domainData.get(domain);
    domainData.requestCount++;

    updateUI();
  }

  function startRecording() {
    state.isRecording = true;
    elements.startBtn.classList.add('hidden');
    elements.stopBtn.classList.remove('hidden');
    elements.recordingStatus.classList.remove('hidden');

    chrome.devtools.network.getHAR((harLog) => {
      harLog.entries.forEach(entry => {
        const domain = extractDomain(entry.request.url);
        if (!domain) return;

        state.domains.add(domain);
        state.totalRequests++;

        if (!state.domainData.has(domain)) {
          state.domainData.set(domain, {
            ips: new Set(),
            subnets: new Set(),
            requestCount: 0,
            resolveStatus: 'pending'
          });
        }

        const domainData = state.domainData.get(domain);
        domainData.requestCount++;
      });
      updateUI();
    });
  }

  async function stopRecording() {
    state.isRecording = false;
    elements.startBtn.classList.remove('hidden');
    elements.stopBtn.classList.add('hidden');
    elements.recordingStatus.classList.add('hidden');

    const allDomains = Array.from(state.domainData.keys());

    if (allDomains.length > 0) {
      await resolveDomainsAutomatically(allDomains);
    }
  }

  async function resolveDomainsAutomatically(domains) {
    if (state.isResolving) return;
    
    state.isResolving = true;
    showResolveProgress(true);
    
    try {
      const results = await dnsResolver.resolveBatch(domains, (current, total) => {
        updateResolveProgress(current, total);
      });

      for (const [domain, ips] of results.entries()) {
        const domainData = state.domainData.get(domain);
        if (!domainData) continue;

        if (ips.length > 0) {
          ips.forEach(ip => {
            if (isValidIP(ip)) {
              addIPAndCalculateSubnet(domainData, ip);
            }
          });
          domainData.resolveStatus = 'resolved';
        } else {
          domainData.resolveStatus = 'failed';
        }
      }

      updateUI();
    } catch (error) {
      console.error('DNS resolution failed:', error);
    } finally {
      state.isResolving = false;
      showResolveProgress(false);
    }
  }

  function showResolveProgress(show) {
    if (show) {
      elements.resolveProgress.classList.remove('hidden');
    } else {
      elements.resolveProgress.classList.add('hidden');
    }
  }

  function updateResolveProgress(current, total) {
    elements.resolvedCount.textContent = current;
    elements.totalCount.textContent = total;
    const percentage = (current / total) * 100;
    elements.progressFill.style.width = `${percentage}%`;
  }

  async function exportDomainsToTxt() {
    if (state.domains.size === 0) {
      alert('No domains to export. Start recording first.');
      return;
    }

    const sortedDomains = Array.from(state.domains).sort();
    const content = sortedDomains.join('\n');
    
    await downloadFile(content, 'domains');
  }

  async function exportIPsToTxt() {
    if (state.domainData.size === 0) {
      alert('No domains to export. Start recording first.');
      return;
    }

    let content = '';
    const sortedDomains = Array.from(state.domainData.keys()).sort();

    for (const domain of sortedDomains) {
      const data = state.domainData.get(domain);
      
      if (data.subnets.size === 0) continue;

      content += `// ${domain}\n`;
      
      const sortedSubnets = sortSubnets(data.subnets);
      sortedSubnets.forEach(subnet => {
        content += `${subnet}\n`;
      });
      
      content += '\n';
    }

    if (content === '') {
      alert('No IP subnets to export. IPs are being resolved.');
      return;
    }

    await downloadFile(content, 'ip-subnets');
  }

  async function downloadFile(content, prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${prefix}-${timestamp}.txt`;
    
    // Method 1: Try chrome.downloads API (most reliable for Vivaldi and all Chromium browsers)
    if (chrome?.downloads && content.length < 2 * 1024 * 1024) {
      try {
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        await chrome.downloads.download({
          url: dataUri,
          filename: filename,
          saveAs: false
        });
        console.log('Download started via chrome.downloads API');
        return;
      } catch (error) {
        console.warn('chrome.downloads API failed, trying blob method:', error);
      }
    }
    
    // Method 2: Fallback to Blob URL (for Chrome and newer Vivaldi versions)
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Append to DOM to ensure click works in all browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Delay revocation for Vivaldi compatibility
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      console.log('Download started via blob URL');
    } catch (error) {
      console.error('All download methods failed:', error);
      alert('Ошибка загрузки файла. Если вы используете Vivaldi, обновите браузер до версии 7.4+\n\nDownload failed. If you are using Vivaldi, please update to version 7.4+');
    }
  }

  function clearAll() {
    state.domains.clear();
    state.domainData.clear();
    state.totalRequests = 0;
    dnsResolver.clearCache();
    updateUI();
  }

  elements.startBtn.addEventListener('click', startRecording);
  elements.stopBtn.addEventListener('click', stopRecording);
  elements.exportDomainsBtn.addEventListener('click', exportDomainsToTxt);
  elements.exportIPsBtn.addEventListener('click', exportIPsToTxt);
  elements.clearBtn.addEventListener('click', clearAll);

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);

  updateUI();
})();
