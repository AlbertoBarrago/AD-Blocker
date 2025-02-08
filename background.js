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
                    urlFilter: '*://*.doubleclick.net/*|*://*.googlesyndication.com/*|*://googleads.*/*',
                    resourceTypes: ['script', 'image', 'xmlhttprequest']
                }
            }]
        })
    }
});
