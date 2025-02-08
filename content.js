const styleBannerRules = `
  .banner,
  .banner-ad,
  div[class*="banner"],
  div[id*="banner"],
  .sticky-banner,
  .top-banner,
  .header-banner,
  .promotional-banner,
  .floating-banner,
  .adk_interstitial-creativeless,
  aside[class*="banner"],
  section[class*="banner"],
  div[class*="adv"],
  div[class*="sticky"][class*="ad"],
  div[style*="position: fixed"],
  div[style*="position:fixed"] {
    display: none !important;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styleBannerRules;
document.documentElement.appendChild(styleSheet);

let blockedAds = [];

function updateBadgeCount(count) {
    chrome.runtime.sendMessage({
        action: "updateBadge",
        count: count
    });
}

function removeAds() {
    const adSelectors = `
        [id*="google_ads"],
        [id*="banner"],
        [class*="ads"],
        [class*="advertisement"],
        [id*="advert"],
        iframe[id*="google_ads_iframe"],
        [class*="ad-container"],
        [class*="sponsored"],
        [class*="adk_interstitial"],
        [id*="carbonads"],
        [id*="__lxG__bsticky_lx_728768"],
        [class*="adsbox"],
        [class*="adsbygoogle"],
        [class*="ad-slot"],
        [class*="ad-wrapper"],
        [data-ad-client],
        [id*="div-gpt-ad"],
        [class*=adv],
        iframe[src*="doubleclick.net"],
        iframe[src*="ad."],
        div[aria-label*="advertisement"]
    `;

    const adElements = document.querySelectorAll(adSelectors);

    adElements.forEach(ad => {
        if (ad && (ad.id || ad.className)) {
            const identifier = ad.id || ad.className;
            if (!blockedAds.includes(identifier)) {
                blockedAds.push(identifier);
                updateBadgeCount(blockedAds.length);
            }
            ad.remove();
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBlockedAds") {
        sendResponse({blockedAds: [...new Set(blockedAds)]});
    }
    return true;
});

document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(removeAds);
    observer.observe(document.body, {childList: true, subtree: true});
    removeAds();
});
