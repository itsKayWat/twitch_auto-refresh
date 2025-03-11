// Default settings
const DEFAULT_SETTINGS = {
    enableAutoRefresh: true,
    autoStartOnLive: true,
    refreshInterval: 15,
    maxRetries: 5,
    initialDelay: 5,
    checkVideoPlayback: true,
    checkNetworkStatus: true,
    checkBotDetection: true,
    showStatus: true,
    showOverlay: true,
    showNotifications: false
};

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        document.getElementById('enableAutoRefresh').checked = settings.enableAutoRefresh;
        document.getElementById('autoStartOnLive').checked = settings.autoStartOnLive;
        document.getElementById('refreshInterval').value = settings.refreshInterval;
        document.getElementById('maxRetries').value = settings.maxRetries;
        document.getElementById('initialDelay').value = settings.initialDelay;
        document.getElementById('checkVideoPlayback').checked = settings.checkVideoPlayback;
        document.getElementById('checkNetworkStatus').checked = settings.checkNetworkStatus;
        document.getElementById('checkBotDetection').checked = settings.checkBotDetection;
        document.getElementById('showStatus').checked = settings.showStatus;
        document.getElementById('showOverlay').checked = settings.showOverlay;
        document.getElementById('showNotifications').checked = settings.showNotifications;
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', () => {
        const settings = {
            enableAutoRefresh: document.getElementById('enableAutoRefresh').checked,
            autoStartOnLive: document.getElementById('autoStartOnLive').checked,
            refreshInterval: parseInt(document.getElementById('refreshInterval').value),
            maxRetries: parseInt(document.getElementById('maxRetries').value),
            initialDelay: parseInt(document.getElementById('initialDelay').value),
            checkVideoPlayback: document.getElementById('checkVideoPlayback').checked,
            checkNetworkStatus: document.getElementById('checkNetworkStatus').checked,
            checkBotDetection: document.getElementById('checkBotDetection').checked,
            showStatus: document.getElementById('showStatus').checked,
            showOverlay: document.getElementById('showOverlay').checked,
            showNotifications: document.getElementById('showNotifications').checked
        };

        chrome.storage.sync.set(settings, () => {
            // Visual feedback
            const saveButton = document.getElementById('saveSettings');
            const originalText = saveButton.textContent;
            saveButton.textContent = 'Saved!';
            saveButton.style.backgroundColor = '#2ECC40';
            
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.style.backgroundColor = '';
            }, 1500);
        });
    });

    // Reset to defaults
    document.getElementById('resetDefaults').addEventListener('click', () => {
        chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
            // Update UI
            document.getElementById('enableAutoRefresh').checked = DEFAULT_SETTINGS.enableAutoRefresh;
            document.getElementById('autoStartOnLive').checked = DEFAULT_SETTINGS.autoStartOnLive;
            document.getElementById('refreshInterval').value = DEFAULT_SETTINGS.refreshInterval;
            document.getElementById('maxRetries').value = DEFAULT_SETTINGS.maxRetries;
            document.getElementById('initialDelay').value = DEFAULT_SETTINGS.initialDelay;
            document.getElementById('checkVideoPlayback').checked = DEFAULT_SETTINGS.checkVideoPlayback;
            document.getElementById('checkNetworkStatus').checked = DEFAULT_SETTINGS.checkNetworkStatus;
            document.getElementById('checkBotDetection').checked = DEFAULT_SETTINGS.checkBotDetection;
            document.getElementById('showStatus').checked = DEFAULT_SETTINGS.showStatus;
            document.getElementById('showOverlay').checked = DEFAULT_SETTINGS.showOverlay;
            document.getElementById('showNotifications').checked = DEFAULT_SETTINGS.showNotifications;
            
            // Visual feedback
            const resetButton = document.getElementById('resetDefaults');
            const originalText = resetButton.textContent;
            resetButton.textContent = 'Reset Complete!';
            
            setTimeout(() => {
                resetButton.textContent = originalText;
            }, 1500);
        });
    });

    // Close settings tab
    document.getElementById('closeSettings').addEventListener('click', () => {
        chrome.tabs.getCurrent(tab => {
            chrome.tabs.remove(tab.id);
        });
    });

    // Open README page in new tab
    document.getElementById('openReadme').addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('readme.html')
        });
    });

    // Input validation
    document.getElementById('refreshInterval').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 5) e.target.value = 5;
        if (value > 60) e.target.value = 60;
    });

    document.getElementById('maxRetries').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1) e.target.value = 1;
        if (value > 20) e.target.value = 20;
    });

    document.getElementById('initialDelay').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 1) e.target.value = 1;
        if (value > 30) e.target.value = 30;
    });
});
