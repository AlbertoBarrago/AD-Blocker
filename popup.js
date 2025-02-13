document.addEventListener('DOMContentLoaded', () => {
    const disableSwitch = document.getElementById('disable-plugin');
    const pluginIcon = document.getElementById('plugin-icon');
    const statsContainer = document.getElementById('stats-container');
    const actionContainer = document.getElementById('actions-container');
    const whitelistToggleBtn = document.getElementById('whitelist-toggle');
    const viewAdsBtn = document.getElementById('view-ads');

    const initPopup = () => {
        chrome.storage.sync.get({pluginDisabled: false}, (data) => {
            disableSwitch.checked = data.pluginDisabled;

            if (data.pluginDisabled) {
                pluginIcon.classList.remove('active');
                statsContainer.style.display = "none";
                actionContainer.style.display = "none";
                _showMessage('Ad Blocker is disabled.');
            } else {
                pluginIcon.classList.add('active');
                statsContainer.style.display = "flex";
                actionContainer.style.display = "flex";
            }
        });
        _updateWhitelistButton()
    }

    disableSwitch.addEventListener('change', (event) => {
        const isDisabled = event.target.checked;
        chrome.storage.sync.set({pluginDisabled: isDisabled}, () => {
            if (isDisabled) {
                pluginIcon.classList.remove('active');
                statsContainer.style.display = "none";
                actionContainer.style.display = "none";
                _showMessage('Ad Blocker is disabled.');
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

    whitelistToggleBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs.length) return;
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                chrome.storage.sync.get({whitelist: []}, (data) => {
                    const whitelist = data.whitelist;
                    if (whitelist.includes(hostname)) {
                        const updatedWhitelist = whitelist.filter(site => site !== hostname);
                        chrome.storage.sync.set({whitelist: updatedWhitelist}, () => {
                            alert(`Removed ${hostname} from your whitelist.`);
                            whitelistToggleBtn.textContent = 'Add to Whitelist';
                            whitelistToggleBtn.classList.remove('red-button');
                            chrome.tabs.reload(tabs[0].id);
                        });
                    } else {
                        whitelist.push(hostname);
                        chrome.storage.sync.set({whitelist: whitelist}, () => {
                            alert(`Added ${hostname} to your whitelist.`);
                            whitelistToggleBtn.textContent = 'Remove from Whitelist';
                            whitelistToggleBtn.classList.add('red-button');
                            chrome.tabs.reload(tabs[0].id);
                        });
                    }
                });
            } catch (error) {
                console.error("Error retrieving current site:", error);
            }
        });
    });

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

    const _showMessage = (message) => {
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

    const _updateWhitelistButton = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs.length) return;
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                chrome.storage.sync.get({whitelist: []}, (data) => {
                    const isWhitelisted = data.whitelist.includes(hostname);
                    
                    // Update button appearance
                    if (isWhitelisted) {
                        whitelistToggleBtn.textContent = 'Remove from Whitelist';
                        whitelistToggleBtn.classList.add('red-button');
                        // Hide stats container
                        document.getElementById('stats-container').style.display = 'none';
                    } else {
                        whitelistToggleBtn.textContent = 'Add to Whitelist';
                        whitelistToggleBtn.classList.remove('red-button');
                        // Show stats container
                        document.getElementById('stats-container').style.display = 'flex';
                    }
                });
            } catch (error) {
                console.error("Error updating whitelist button:", error);
            }
        });
    }

    const updateCounters = (count) => {
        const statsCounter = document.getElementById('stats-counter');
        const totalCounter = document.getElementById('total-counter');
        
        if (statsCounter) {
            statsCounter.textContent = count;
        }
        if (totalCounter) {
            totalCounter.textContent = count;
        }
    };

    chrome.runtime.sendMessage({action: "getCurrentCount"}, (response) => {
        updateCounters(response?.count || '0');
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "updateCounter" || message.action === "resetCounter") {
            updateCounters(message.count);
        }
    });

    initPopup();
    _updateWhitelistButton();
});