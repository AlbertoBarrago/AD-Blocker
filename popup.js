document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getBlockedAds"}, (response) => {
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
                }

                if (response && response.blockedAds.length === 0) {
                    const noAdsMessage = document.createElement('div');
                    noAdsMessage.className = 'no-ads-message';
                    noAdsMessage.textContent = 'No ads blocked yet.';
                    blockedList.appendChild(noAdsMessage);
                }
            });
        }
    });
});
