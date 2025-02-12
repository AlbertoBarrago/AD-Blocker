chrome.storage.sync.get({pluginDisabled: false, whitelist: []}, (result) => {
    if (result.pluginDisabled) {
        // Disable ad blocking functionality if disabled
        return;
    }

    const currentHostname = window.location.hostname;
    if (result.whitelist && result.whitelist.includes(currentHostname)) {
        // Skip ad blocking for white_listed site
        return;
    }

    // Special handling for specific sites that have ads in the video player
    const sensitiveHosts = ['youtube.com', 'www.youtube.com'];
    if (sensitiveHosts.some(host => currentHostname.includes(host))) {
        const youtubeSpecificRules = `
            .video-ads,
            .ytp-ad-overlay-container,
            .ytd-display-ad-renderer,
            .ytd-companion-slot-renderer {
                display: none !important;
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.textContent = youtubeSpecificRules;
        document.documentElement.appendChild(styleSheet);
        return;
    }

    (function () {
        const styleBannerRules = `
        .banner:not([class*="player"]):not([class*="video"]), 
        .banner-ad, 
        .sticky-banner,
        div[class*="ad-"]:not([class*="player"]):not([class*="video"]),
        div[class*="-ad"]:not([class*="player"]):not([class*="video"]),
        div[class*="sponsored"],
        div[class*="promotion"]:not([class*="video"]),
        div[id^="google_ads"],
        div[class^="google_ad"] {
            display: none !important;
        }
    `;

        const styleSheet = document.createElement("style");
        styleSheet.textContent = styleBannerRules;
        document.documentElement.appendChild(styleSheet);

        const blockedAds = new Set();

        /**
         * Updates the extension badge with the count of blocked ads
         * @param {number} count - The number of blocked ads to display on the badge
         */
        function updateBadgeCount(count) {
            if (chrome?.runtime?.sendMessage) {
                chrome.runtime.sendMessage({action: "updateBadge", count});
            }
        }

        /**
         * Removes advertisement elements from the page and tracks them
         */
        function removeAds() {
            const adSelectors = `
            [id*="google_ads"], 
            [class*="ads"]:not([class*="player"]):not([class*="video"]):not([class*="form"]),
            [class*="advertisement"],
            [id*="advert"], 
            iframe[id*="google_ads_iframe"],
            [class*="sponsored"]:not([class*="player"]):not([class*="video"]):not([class*="form"]),
            [class*="adsbox"],
            [class*="adsbygoogle"],
            [class*="ad-slot"],
            [data-ad-client],
            [id*="div-gpt-ad"],
            iframe[src*="doubleclick.net"],
            iframe[src*="ad."],
            [id*="adunit"]
        `;

            const adElements = document.querySelectorAll(adSelectors);

            adElements.forEach(ad => {
                if (ad && (ad.id || ad.className)) {
                    const identifier = ad.id || ad.className;
                    if (!blockedAds.has(identifier)) {
                        blockedAds.add(identifier);
                        updateBadgeCount(blockedAds.size);
                    }
                    requestAnimationFrame(() => ad.remove());
                }
            });
        }

        // Listen for message requests (e.g., from the popup) and provide list of blocked ads.
        chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
            if (message.action === "getBlockedAds") {
                sendResponse({blockedAds: Array.from(blockedAds)});
            }
            return true;
        });

        /**
         * Initializes the mutation observer to watch for new ad elements.
         * If document.body isn't ready, sets up an observer to wait for it.
         */
        function initObserver() {
            if (!document.body) {
                const observer = new MutationObserver(() => {
                    if (document.body) {
                        observer.disconnect();
                        initObserver();
                    }
                });
                observer.observe(document.documentElement, {childList: true});
                return;
            }

            const mutationObserver = new MutationObserver(() => removeAds());
            mutationObserver.observe(document.body, {childList: true, subtree: true});

            removeAds();
        }

        document.addEventListener("DOMContentLoaded", initObserver);
        initObserver();
    })();
});
