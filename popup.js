/**
 * Initializes the popup functionality when the DOM content is loaded.
 * Sets up event listeners and manage the ad blocker's state.
 *
 */
document.addEventListener('DOMContentLoaded', () => {
    const blockedList = document.getElementById('blocked-list');
    const totalCount = document.getElementById('total-count');
    const disableSwitch = document.getElementById('disable-plugin');
    const pluginIcon = document.getElementById('plugin-icon');
    const statsContainer = document.getElementById('stats-container');

    chrome.storage.sync.get({pluginDisabled: false}, (data) => {
        disableSwitch.checked = data.pluginDisabled;

        // Reflect the state on the icon and blocked list
        if (data.pluginDisabled) {
            pluginIcon.classList.remove('active');
            blockedList.style.display = "none";
            statsContainer.style.display = "none";
            showMessage('Ad Blocker is disabled.');
        } else {
            pluginIcon.classList.add('active');
            // Fetch and display blocked ads from the content script
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs.length === 0) return;
                const activeTab = tabs[0];
                if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com')) {
                    // Content script isn't allowed on this page.
                    return;
                }
                try {
                    chrome.tabs.sendMessage(activeTab.id, {action: "getBlockedAds"}, (response) => {
                        if (chrome.runtime.lastError) {
                            // Content script not available
                            return;
                        }
                        if (response && response.blockedAds && response.blockedAds.length > 0) {
                            blockedList.style.display = "block";
                            blockedList.innerHTML = "";
                            totalCount.textContent = String(response.blockedAds.length);
                            response.blockedAds.forEach(ad => {
                                const div = document.createElement('div');
                                div.className = 'blocked-item';

                                div.textContent = ad;
                                blockedList.appendChild(div);
                            });
                        } else {
                            blockedList.style.display = "none";
                            showMessage('No ads blocked yet.');
                        }
                    });
                } catch (error) {
                    console.error("Error sending message:", error);
                }
            });
        }
    });

    disableSwitch.addEventListener('change', (event) => {
        const isDisabled = event.target.checked;
        chrome.storage.sync.set({pluginDisabled: isDisabled}, () => {
            if (isDisabled) {
                pluginIcon.classList.remove('active');
                blockedList.style.display = "none";
                statsContainer.style.display = "none";
                showMessage('Ad Blocker is disabled.');
            } else {
                statsContainer.style.display = "flex";
                pluginIcon.classList.add('active');
                location.reload();
            }
        });
    });

    /**
     * Displays a message in the popup UI.
     * Removes any existing message before showing the new one.
     *
     * @param {string} message - The message to display
     */
    function showMessage(message) {
        const existingMsg = document.querySelector('.no-ads-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        const msgDiv = document.createElement('div');
        msgDiv.className = 'no-ads-message';
        msgDiv.textContent = message;

        const footer = document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(msgDiv, footer);
        } else {
            document.body.appendChild(msgDiv);
        }
    }
});