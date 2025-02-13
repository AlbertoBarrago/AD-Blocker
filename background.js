let currentPageCounts = new Map();
let totalAdsBlocked = 0;  // Single source of truth

// Add this function to reset storage
function resetStorage(tabId) {
    totalAdsBlocked = 0;  // Reset the centralized counter
    chrome.storage.sync.set({totalAdsBlocked: 0}, () => {
        currentPageCounts.set(tabId, 0);
        chrome.action.setBadgeText({
            text: '0',
            tabId: tabId
        });
        chrome.runtime.sendMessage({
            action: "resetCounter",
            count: 0
        });
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        resetStorage(tabId);

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: [{
                id: 1,
                priority: 1,
                action: {
                    type: 'block'
                },
                condition: {
                    urlFilter: '*://*.doubleclick.net/*|*://*.googlesyndication.com/*|*://googleads.*/*|*://*.adnxs.com/*|*://*.amazon-adsystem.com/*|*://*.outbrain.com/*|*://*.taboola.com/*|*://*.criteo.com/*|*://*.adform.net/*|*://*.rubiconproject.com/*|*://*.pubmatic.com/*|*://*.openx.net/*|*://*.smartadserver.com/*|*://*.advertising.com/*|*://*.moatads.com/*|*://*.adsrvr.org/*|*://*.adroll.com/*|*://*.quantserve.com/*',
                    resourceTypes: ['script', 'image', 'xmlhttprequest']
                }
            }]
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    // Cleanup when tab is closed
    currentPageCounts.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCurrentCount") {
        sendResponse({count: totalAdsBlocked});
        return true;
    }
    if (message.action === "updateBadge") {
        const newCount = parseInt(message.count) || 0;
        
        // Update the centralized counter
        totalAdsBlocked = newCount;
        
        // Update storage
        chrome.storage.sync.set({totalAdsBlocked: newCount});
        
        // Update badge for all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.action.setBadgeText({
                    text: newCount.toString(),
                    tabId: tab.id
                });
            });
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: '#e50d3f',
        });

        // Notify popup to update
        chrome.runtime.sendMessage({
            action: "updateCounter",
            count: newCount
        });
    }
});