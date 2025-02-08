document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            try {
                chrome.tabs.sendMessage(tabs[0].id, {action: "getBlockedAds"}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Content script non disponibile:", chrome.runtime.lastError.message);
                        return;
                    }

                    const blockedList = document.getElementById('blocked-list');
                    const totalCount = document.getElementById('total-count');

                    if (response && response.blockedAds) {
                        totalCount.textContent = response.blockedAds.length;

                        response.blockedAds.forEach(ad => {
                            const div = document.createElement('div');
                            div.className = 'blocked-item';
                            div.textContent = ad;
                            blockedList.appendChild(div);
                        });
                    } else {
                        const noAdsMessage = document.createElement('div');
                        noAdsMessage.className = 'no-ads-message';
                        noAdsMessage.textContent = 'No ads blocked yet.';
                        blockedList.appendChild(noAdsMessage);
                    }
                });
            } catch (error) {
                console.error("Errore nell'invio del messaggio:", error);
            }
        }
    });
});
