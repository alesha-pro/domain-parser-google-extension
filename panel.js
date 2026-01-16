(function() {
  const state = {
    isRecording: false,
    domains: new Set(),
    totalRequests: 0
  };

  const elements = {
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    exportBtn: document.getElementById('exportBtn'),
    clearBtn: document.getElementById('clearBtn'),
    recordingStatus: document.getElementById('recordingStatus'),
    totalRequests: document.getElementById('totalRequests'),
    uniqueDomains: document.getElementById('uniqueDomains'),
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

    if (state.domains.size === 0) {
      elements.domainContainer.innerHTML = '<div class="empty-state">No domains captured yet. Click "Start Recording" to begin.</div>';
    } else {
      const sortedDomains = Array.from(state.domains).sort();
      elements.domainContainer.innerHTML = sortedDomains
        .map(domain => `<div class="domain-item">${domain}</div>`)
        .join('');
    }
  }

  function handleRequest(request) {
    if (!state.isRecording) return;

    const domain = extractDomain(request.request.url);
    if (domain) {
      state.domains.add(domain);
      state.totalRequests++;
      updateUI();
    }
  }

  function startRecording() {
    state.isRecording = true;
    elements.startBtn.classList.add('hidden');
    elements.stopBtn.classList.remove('hidden');
    elements.recordingStatus.classList.remove('hidden');

    chrome.devtools.network.getHAR((harLog) => {
      harLog.entries.forEach(entry => {
        const domain = extractDomain(entry.request.url);
        if (domain) {
          state.domains.add(domain);
          state.totalRequests++;
        }
      });
      updateUI();
    });
  }

  function stopRecording() {
    state.isRecording = false;
    elements.startBtn.classList.remove('hidden');
    elements.stopBtn.classList.add('hidden');
    elements.recordingStatus.classList.add('hidden');
  }

  function exportToTxt() {
    if (state.domains.size === 0) {
      alert('No domains to export. Start recording first.');
      return;
    }

    const sortedDomains = Array.from(state.domains).sort();
    const content = sortedDomains.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `domains-${timestamp}.txt`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    state.domains.clear();
    state.totalRequests = 0;
    updateUI();
  }

  elements.startBtn.addEventListener('click', startRecording);
  elements.stopBtn.addEventListener('click', stopRecording);
  elements.exportBtn.addEventListener('click', exportToTxt);
  elements.clearBtn.addEventListener('click', clearAll);

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);

  updateUI();
})();
