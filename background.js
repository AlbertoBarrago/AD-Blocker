let currentPageCounts = new Map();
let totalAdsBlocked = 0;

const sendMessageToPopup = (message) => {
    chrome.runtime.sendMessage(message).catch(() => {
        // Ignore errors when popup is not open
    });
};

function resetStorage(tabId) {
    totalAdsBlocked = 0; 
    chrome.storage.sync.set({totalAdsBlocked: 0}, () => {
        currentPageCounts.set(tabId, 0);
        chrome.action.setBadgeText({
            text: '0',
            tabId: tabId
        });
        sendMessageToPopup({
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
    currentPageCounts.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCurrentCount") {
        sendResponse({count: totalAdsBlocked});
        return true;
    }
    if (message.action === "updateBadge") {
        const newCount = parseInt(message.count) || 0;
        
        totalAdsBlocked = newCount;
        
        chrome.storage.sync.set({totalAdsBlocked: newCount});
        
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

        sendMessageToPopup({
            action: "updateCounter",
            count: newCount
        });
    }
});