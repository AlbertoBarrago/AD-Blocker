/**
 * Initializes the popup functionality for the ad blocker extension.
 * Handles plugin disable/enable, allowlist management, and blocked ads viewing.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const disableSwitch = document.getElementById('disable-plugin');
    const statsContainer = document.getElementById('stats-container');
    const actionContainer = document.getElementById('actions-container');
    const whitelistToggleBtn = document.getElementById('whitelist-toggle');
    const viewAdsBtn = document.getElementById('view-ads');

    /**
     * Initializes the popup state by checking plugin status and updating UI.
     * @function
     */
    const initPopup = () => {
        chrome.storage.sync.get({pluginDisabled: false}, (data) => {
            disableSwitch.checked = data.pluginDisabled;

            if (data.pluginDisabled) {
                _showMessage('Ad Blocker is disabled.');
            }
        });
        _updateWhitelistButton()
    }

    /**
     * Handles the plugin enable/disable switch state changes.
     * @param {Event} event - The change event from the switch.
     */
    disableSwitch.addEventListener('change', (event) => {
        const isDisabled = event.target.checked;
        chrome.storage.sync.set({pluginDisabled: isDisabled}, () => {
            if (isDisabled) {
                statsContainer.style.display = "none";
                actionContainer.style.display = "none";
                _showMessage('Ad Blocker is disabled.');
            } else {
                statsContainer.style.display = "flex";
                actionContainer.style.display = "flex";
            }
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0] && tabs[0].id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    /**
     * Handles the whitelist toggle button click events.
     * Adds or removes the current site from the whitelist.
     * @listens click
     */
    whitelistToggleBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs.length) return;
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                chrome.storage.sync.get({whitelist: []}, (data) => {
                    let whitelist = data.whitelist || [];
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

    /**
     * Handles the view blocked ads button click events.
     * Displays a list of blocked ads for the current page.
     * @listens click
     */
    viewAdsBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) return;
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {action: "getBlockedAds"}, (response) => {
                if (response && Array.isArray(response.blockedAds)) {
                    if (response.blockedAds.length > 0) {
                        alert("Blocked Ads:\n" + response.blockedAds.join('\n'));
                    } else {
                        alert("No ads blocked on this page");
                    }
                } else {
                    alert("No blocked ads data available");
                }
            });
        });
    });

    /**
     * Displays a message in the popup UI.
     * @param {string} message - The message to display.
     * @private
     */
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

    /**
     * Updates the whitelist button state based on current site status.
     * @private
     */
    const _updateWhitelistButton = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs.length) return;
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                chrome.storage.sync.get({whitelist: []}, (data) => {
                    const isWhitelisted = data.whitelist.includes(hostname);
                    if (isWhitelisted) {
                        whitelistToggleBtn.textContent = 'Remove from Whitelist';
                        whitelistToggleBtn.classList.add('red-button');
                    } else {
                        whitelistToggleBtn.textContent = 'Add to Whitelist';
                        whitelistToggleBtn.classList.remove('red-button');
                    }
                });
            } catch (error) {
                console.error("Error updating whitelist button:", error);
            }
        });
    }

    initPopup();
    _updateWhitelistButton();
});