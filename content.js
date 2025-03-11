let retryCount = 0;
let checkInterval;
let isEnabled = true;  // Track enabled state
let overlayIndicator = null;
let statusMessage = null;
let isInitiallyLive = false;  // Track if the stream was live when we first loaded
let permanentlyOffline = false; // Track if stream has gone permanently offline

// Create overlay indicator and status message in the top right
function createOverlayIndicator() {
    // Create element if it doesn't exist
    if (!overlayIndicator) {
        // Find the Twitch navbar container
        const navContainer = document.querySelector('.top-nav__menu');
        if (!navContainer) return;

        // Create container
        overlayIndicator = document.createElement('div');
        overlayIndicator.id = 'twitch-auto-refresh-indicator';
        
        // SVG approach for better control over the shape and size
        const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="50" fill="rgba(24, 24, 27, 0.9)"/>
            <text x="50" y="70" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" 
                  font-size="70" fill="rgb(145, 70, 255)">T</text>
        </svg>`;
        
        // Create a wrapper div to match Twitch's layout structure
        const wrapper = document.createElement('div');
        wrapper.className = 'Layout-sc-1xcs6mc-0 czRfnU';
        
        // Styling for the container - Updated to use Twitch's layout classes
        Object.assign(overlayIndicator.style, {
            width: '28px',
            height: '28px',
            opacity: '0.9',
            cursor: 'pointer',
            transition: 'transform 0.2s, opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            margin: '0 2px'
        });
        
        // Add hover effect
        overlayIndicator.addEventListener('mouseenter', () => {
            overlayIndicator.style.transform = 'scale(1.1)';
            overlayIndicator.style.opacity = '1';
        });

        overlayIndicator.addEventListener('mouseleave', () => {
            overlayIndicator.style.transform = 'scale(1)';
            overlayIndicator.style.opacity = '0.9';
        });

        // Add click handler to open settings
        overlayIndicator.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openSettings' });
        });
        
        // Set the SVG content
        overlayIndicator.innerHTML = svgContent;
        
        // Insert the indicator in the correct position in the navbar
        const targetPosition = document.querySelector('.top-nav__prime') || 
                             document.querySelector('[data-a-target="top-nav-get-bits-button"]');
        if (targetPosition) {
            wrapper.appendChild(overlayIndicator);
            targetPosition.parentNode.insertBefore(wrapper, targetPosition);
        } else {
            // Fallback to appending to nav container
            wrapper.appendChild(overlayIndicator);
            navContainer.appendChild(wrapper);
        }
        
        // Create status message element
        statusMessage = document.createElement('div');
        statusMessage.id = 'twitch-auto-refresh-status';
        
        // Style the status message
        Object.assign(statusMessage.style, {
            position: 'absolute',
            top: '40px',
            right: '0',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 'rgba(24, 24, 27, 0.9)',
            color: 'rgb(145, 70, 255)',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            zIndex: '9999',
            pointerEvents: 'none',
            display: 'none',
            maxWidth: '200px',
            textAlign: 'right'
        });
        
        wrapper.appendChild(statusMessage);
    }
    
    // Update visibility based on enabled status AND if stream was initially live
    updateOverlayVisibility();
}

// Update overlay visibility based on enabled state and initial live status
function updateOverlayVisibility() {
    if (overlayIndicator) {
        // Only show overlay if:
        // 1. Extension is enabled
        // 2. Channel was live when we loaded it
        // 3. Stream hasn't been marked as permanently offline
        overlayIndicator.style.display = (isEnabled && isInitiallyLive && !permanentlyOffline) ? 'block' : 'none';
    }
}

// Update status message
function updateStatusMessage(message, show = true) {
    if (statusMessage) {
        if (show && message) {
            statusMessage.textContent = message;
            statusMessage.style.display = 'block';
        } else {
            statusMessage.style.display = 'none';
        }
    }
}

function isStreamLive() {
    const videoPlayer = document.querySelector('video');
    const offlineMessage = document.querySelector('.offline-status');
    const liveIndicator = document.querySelector('.live-indicator') || document.querySelector('.tw-channel-status-text-indicator');
    
    // Stream is live if:
    // 1. Video player exists
    // 2. Either video is playing or there's a live indicator
    // 3. No offline message is shown
    const isLive = videoPlayer && 
           ((!videoPlayer.paused) || liveIndicator) && 
           (!offlineMessage || offlineMessage.style.display === 'none');
    
    console.log('Live check:', {
        hasVideo: !!videoPlayer,
        videoPlaying: videoPlayer ? !videoPlayer.paused : false,
        hasLiveIndicator: !!liveIndicator,
        noOfflineMessage: !offlineMessage || offlineMessage.style.display === 'none',
        isLive: isLive
    });
    
    return isLive;
}

function isStreamOffline() {
    // Only check for offline state if we initially loaded with a live stream
    if (!isInitiallyLive || permanentlyOffline) return false;
    
    const videoPlayer = document.querySelector('video');
    const offlineMessage = document.querySelector('.offline-status');
    const channelOffline = document.querySelector('.channel-status-info--offline');
    
    return !videoPlayer || 
           (videoPlayer.paused && !videoPlayer.ended) || 
           (offlineMessage && offlineMessage.style.display !== 'none') ||
           !!channelOffline;
}

function refreshPage() {
    chrome.storage.sync.get({
        enableAutoRefresh: true,
        refreshInterval: 15,
        maxRetries: 5
    }, (settings) => {
        if (!settings.enableAutoRefresh || !isInitiallyLive || permanentlyOffline) return;
        
        if (isStreamOffline()) {
            if (retryCount < settings.maxRetries) {
                retryCount++;
                updateStatusMessage(`Stream offline. Retry ${retryCount}/${settings.maxRetries} in ${settings.refreshInterval}s...`);
                setTimeout(() => {
                    location.reload();
                }, settings.refreshInterval * 1000);
            } else {
                // Stream appears to be permanently offline
                permanentlyOffline = true;
                updateStatusMessage('Stream has ended. Auto-refresh stopped.');
                updateOverlayVisibility();
                stopMonitoring();
            }
        } else {
            retryCount = 0;
            updateStatusMessage('', false); // Hide message when stream is back
        }
    });
}

// Start monitoring
function startMonitoring() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    checkInterval = setInterval(refreshPage, 5000);
}

// Stop monitoring
function stopMonitoring() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
}

// Initialize
const urlPath = window.location.pathname;
// Check if this is a channel page (URL format: twitch.tv/channelname)
// Exclude the main page (/) and make sure we're on a channel page
if (urlPath !== '/' && urlPath.split('/').length === 2 && urlPath.length > 1) {
    // Add a small delay to ensure the video player is loaded
    setTimeout(() => {
        // Check if the stream is live when we first load
        isInitiallyLive = isStreamLive();
        console.log('Initial live state:', isInitiallyLive);
        
        // Check if this is first run and set default settings if needed
        chrome.storage.sync.get({ 
            enableAutoRefresh: true,  // Default to true
            isFirstRun: true         // Track if this is first run
        }, (settings) => {
            // If this is the first run, set all default settings
            if (settings.isFirstRun) {
                chrome.storage.sync.set({
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
                    showNotifications: false,
                    isFirstRun: false  // Mark that initial setup is done
                });
            }
            
            isEnabled = true; // Always enable on install/first run
            console.log('Extension enabled:', isEnabled);
            
            // Only create indicator if stream was initially live
            if (isInitiallyLive) {
                createOverlayIndicator();
                if (isEnabled) {
                    startMonitoring();
                }
            }
        });
    }, 2000); // 2 second delay
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.enableAutoRefresh) {
        isEnabled = changes.enableAutoRefresh.newValue;
        
        // Update overlay visibility when setting changes
        updateOverlayVisibility();
        
        if (isEnabled && isInitiallyLive && !permanentlyOffline) {
            startMonitoring();
        } else {
            stopMonitoring();
        }
    }
});

function isChannelLive() {
    // Check for the live indicator in Twitch's interface
    const liveIndicator = document.querySelector('.tw-channel-status-text-indicator');
    const isLiveText = liveIndicator?.textContent?.trim().toUpperCase() === 'LIVE';

    // Check for video player existence
    const videoPlayer = document.querySelector('video');
    const hasVideoPlayer = !!videoPlayer;

    // Channel is considered live if either indicator is present
    return isLiveText || hasVideoPlayer;
}

// Make sure to call this function when tabs are focused
window.addEventListener('focus', () => {
    // Update the overlay visibility when the tab receives focus
    updateOverlayVisibility();
});

// Also add a periodic check
setInterval(() => {
    updateOverlayVisibility();
}, 5000); // Check every 5 seconds
