(function () {
    const styleBannerRules = `
        /* Nasconde banner, sticky ads e overlay */
        .banner, .banner-ad, .sticky-banner, .top-banner, .header-banner,
        .promotional-banner, .floating-banner, .adk_interstitial-creativeless,
        aside[class*="banner"], section[class*="banner"], div[class*="banner"],
        div[id*="banner"], div[class*="adv"], div[class*="sticky"][class*="ad"],
        div[style*="position: fixed"], div[style*="position:fixed"],
        div[style*="z-index: 9999"], div[style*="z-index:9999"],
        div[class*="ad-"], div[class*="-ad"], div[class*="sponsored"],
        div[class*="promotion"], div[class*="promoted"], div[id^="google_ads"],
        div[class^="google_ad"], div[id*="sponsored"], div[class*="sponsored"],
        div[id*="promoted"], div[class*="promoted"] {
            display: none !important;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styleBannerRules;
    document.documentElement.appendChild(styleSheet);

    const blockedAds = new Set();

    function updateBadgeCount(count) {
        if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ action: "updateBadge", count });
        }
    }

    function removeAds() {
        const adSelectors = `
            [id*="google_ads"], [id*="banner"], [class*="ads"], [class*="advertisement"],
            [id*="advert"], iframe[id*="google_ads_iframe"], [class*="ad-container"],
            [class*="sponsored"], [class*="adk_interstitial"], [id*="carbonads"],
            [id*="__lxG__bsticky_lx_728768"], [class*="adsbox"], [class*="adsbygoogle"],
            [class*="ad-slot"], [class*="ad-wrapper"], [data-ad-client],
            [id*="div-gpt-ad"], [class*="adv"], iframe[src*="doubleclick.net"],
            iframe[src*="ad."], div[aria-label*="advertisement"], [id*="adunit"],
            [class*="promo"], div[class*="overlay-ad"], div[class*="popup-ad"],
            div[class*="fullscreen-ad"], div[style*="z-index: 9999"],
            div[class*="sticky-ad"], aside[class*="ad"], section[class*="ad"],
            div[class*="sponsor"], div[class*="partner-ad"]
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

    chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
        if (message.action === "getBlockedAds") {
            sendResponse({ blockedAds: Array.from(blockedAds) });
        }
        return true;
    });

    function initObserver() {
        if (!document.body) {
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    initObserver();
                }
            });
            observer.observe(document.documentElement, { childList: true });
            return;
        }

        const mutationObserver = new MutationObserver(() => removeAds());
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        removeAds();
    }

    document.addEventListener("DOMContentLoaded", initObserver);
    initObserver();
})();
