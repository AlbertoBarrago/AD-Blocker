document.addEventListener('DOMContentLoaded', () => {
    const blockedList = document.getElementById('blocked-list');
    const totalCount = document.getElementById('total-count');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;

        const activeTab = tabs[0];

        if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com')) {
            //console.warn("Content script not allowed on this page:", activeTab.url);
            return;
        }

        try {
            chrome.tabs.sendMessage(activeTab.id, { action: "getBlockedAds" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Content script non disponibile:", chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.blockedAds && response.blockedAds.length > 0) {
                    blockedList.style.display = "block";
                    blockedList.innerHTML = ""; // Clear previous entries
                    totalCount.textContent = response.blockedAds.length;

                    response.blockedAds.forEach(ad => {
                        const div = document.createElement('div');
                        div.className = 'blocked-item';
                        div.textContent = ad;
                        blockedList.appendChild(div);
                    });
                } else {
                    blockedList.style.display = "none";
                    const noAdsMessage = document.createElement('div');
                    noAdsMessage.className = 'no-ads-message';
                    noAdsMessage.textContent = 'No ads blocked yet.';
                    document.body.appendChild(noAdsMessage);
                }
            });
        } catch (error) {
            console.error("Errore nell'invio del messaggio:", error);
        }
    });
});
