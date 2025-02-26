/**
 * @type {Map<number, number>}
 */
let currentPageCounts = new Map();

/**
 * @type {number}
 */
let totalAdsBlocked = 0;

/**
 * @type {number|null}
 */
let currentTabId = null;

chrome.storage.local.get(['totalAdsBlocked'], (result) => {
    if (result.totalAdsBlocked) {
        totalAdsBlocked = result.totalAdsBlocked;
    }
});

/**
 * Updates the extension badge for a specific tab
 * @param {number} tabId - The ID of the tab to update
 */
function updateBadgeForTab(tabId) {
    const count = currentPageCounts.get(tabId) || 0;

    chrome.action.setBadgeText({
        text: count.toString(),
        tabId: tabId
    });

    chrome.action.setBadgeBackgroundColor({
        color: '#e50d3f',
        tabId: tabId
    });
}

/**
 * Applies ad blocking rules using declarativeNetRequest
 */
function applyAdBlockRules() {
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

/**
 * Increments the ad counter for a specific tab
 * @param {number} tabId - The ID of the tab
 * @returns {number} The new count after incrementing
 */
function incrementCounter(tabId) {
    const currentCount = currentPageCounts.get(tabId) || 0;
    const newCount = currentCount + 1;

    currentPageCounts.set(tabId, newCount);
    totalAdsBlocked++;

    chrome.storage.local.set({
        [`tabCount_${tabId}`]: newCount,
        totalAdsBlocked: totalAdsBlocked
    });

    updateBadgeForTab(tabId);

    return newCount;
}

try {
    chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
        if (info.request.tabId > 0) {
            const tabId = info.request.tabId;
            incrementCounter(tabId);
        }
    });
} catch (error) {
    console.warn("Ad blocking debug listener not available. Counter may not be accurate.");
}

/**
 * Listens for changes in the active tab and updates the ad counter
 * @param {Object} activeInfo - Information about the active tab
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
    currentTabId = activeInfo.tabId;

    chrome.storage.local.get([`tabCount_${activeInfo.tabId}`], (result) => {
        const storedCount = result[`tabCount_${activeInfo.tabId}`] || 0;
        currentPageCounts.set(activeInfo.tabId, storedCount);
        updateBadgeForTab(activeInfo.tabId);
    });

    applyAdBlockRules();
});

/**
 * Listens for changes in the active tab and updates the ad counter
 * @param {Object} changeInfo - Information about the change
 * @param {Object} tab - The tab object
 * @param {string} changeInfo.status - The status of the tab
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    currentTabId = tabId;

    if (changeInfo.url) {
        currentPageCounts.set(tabId, 0);
        chrome.storage.local.set({[`tabCount_${tabId}`]: 0});
        updateBadgeForTab(tabId);
    }

    if (changeInfo.status === 'complete') {
        applyAdBlockRules();
    }
});

/**
 * Listens for tab removal and updates the ad counter
 * @param {number} tabId - The ID of the removed tab
 */
chrome.tabs.onRemoved.addListener((tabId) => {
    currentPageCounts.delete(tabId);
    chrome.storage.local.remove([`tabCount_${tabId}`]);
});

/**
 * @typedef {Object} MessageResponse
 * @property {number} count - The current ad count
 * @property {boolean} [success] - Indicates if the operation was successful
 */

/**
 * @param {Object} message - The message object
 * @param {chrome.runtime.MessageSender} sender - The message sender
 * @param {function(MessageResponse): void} sendResponse - The response callback
 * @returns {boolean} - Whether to keep the message channel open
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCurrentCount") {
        let tabId = sender.tab?.id;

        if (!tabId) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs.length > 0) {
                    tabId = tabs[0].id;
                    const count = currentPageCounts.get(tabId) || 0;
                    sendResponse({
                        count: count
                    });
                } else {
                    sendResponse({
                        count: 0
                    });
                }
            });
            return true;
        }

        const count = currentPageCounts.get(tabId) || 0;
        sendResponse({
            count: count
        });
        return true;
    }

    if (message.action === "updateBadge") {
        const tabId = sender.tab?.id || currentTabId;
        const newCount = parseInt(message.count) || 0;

        if (tabId) {
            currentPageCounts.set(tabId, newCount);
            chrome.storage.local.set({[`tabCount_${tabId}`]: newCount});
            updateBadgeForTab(tabId);
        }

        totalAdsBlocked = newCount;
        chrome.storage.local.set({totalAdsBlocked: newCount});

        sendResponse({success: true});
        return true;
    }

    if (message.action === "reanalyze") {
        applyAdBlockRules();
        sendResponse({success: true});
        return true;
    }
});

applyAdBlockRules();