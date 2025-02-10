chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateBadge") {
        chrome.action.setBadgeText({
            text: message.count.toString(),
            tabId: sender.tab.id
        });
        chrome.action.setBadgeBackgroundColor({
            color: '#e50d3f',
        });
    }
});