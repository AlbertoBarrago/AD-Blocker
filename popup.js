document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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
        });
    });
});
