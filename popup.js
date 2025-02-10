document.addEventListener('DOMContentLoaded', () => {
    const disableSwitch = document.getElementById('disable-plugin');
    const pluginIcon = document.getElementById('plugin-icon');
    const statsContainer = document.getElementById('stats-container');
    const actionContainer = document.getElementById('actions-container');
    const addWhitelistBtn = document.getElementById('whitelist-toggle');
    const viewAdsBtn = document.getElementById('view-ads');

    function initPopup() {
        chrome.storage.sync.get({pluginDisabled: false}, (data) => {
            disableSwitch.checked = data.pluginDisabled;

            if (data.pluginDisabled) {
                pluginIcon.classList.remove('active');
                statsContainer.style.display = "none";
                actionContainer.style.display = "none";
                showMessage('Ad Blocker is disabled. Reload the page to apply.');
            } else {
                pluginIcon.classList.add('active');
                statsContainer.style.display = "flex";
                actionContainer.style.display = "flex";
            }
        });
    }

    disableSwitch.addEventListener('change', (event) => {
        const isDisabled = event.target.checked;
        chrome.storage.sync.set({pluginDisabled: isDisabled}, () => {
            if (isDisabled) {
                pluginIcon.classList.remove('active');
                statsContainer.style.display = "none";
                actionContainer.style.display = "none";
                showMessage('Ad Blocker is disabled. Reload the page to apply.');
            } else {
                statsContainer.style.display = "flex";
                actionContainer.style.display = "flex";
                pluginIcon.classList.add('active');
            }
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0] && tabs[0].id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    // Add the current site to the whitelist.
    /*addWhitelistBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs.length) return;
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                chrome.storage.sync.get({whitelist: []}, (data) => {
                    const whitelist = data.whitelist;
                    if (!whitelist.includes(hostname)) {
                        whitelist.push(hostname);
                        chrome.storage.sync.set({whitelist: whitelist}, () => {
                            alert(`Added ${hostname} to your whitelist.`);
                        });
                    } else {
                        alert(`${hostname} is already in your whitelist.`);
                    }
                });
            } catch (error) {
                console.error("Error retrieving current site:", error);
            }
        });
    });*/

    viewAdsBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) return;
            const activeTab = tabs[0];
            if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com')) {
                alert("Content script not available on this page.");
                return;
            }
            try {
                chrome.tabs.sendMessage(activeTab.id, {action: "getBlockedAds"}, (response) => {
                    if (chrome.runtime.lastError) {
                        alert("No blocked ads list available on this page.");
                        return;
                    }
                    if (response && response.blockedAds && response.blockedAds.length > 0) {
                        alert("Blocked Ads:\n" + response.blockedAds.join('\n'));
                    } else {
                        alert("No ads blocked yet.");
                    }
                });
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });
    });

    const showMessage = (message) => {
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

    initPopup();
});