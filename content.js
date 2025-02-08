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
  aside[class*="banner"],
  section[class*="banner"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    height: 0 !important;
    width: 0 !important;
    position: absolute !important;
    z-index: -9999 !important;
  }

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

function removeAds() {
    const adElements = document.querySelectorAll(`
        [id*="google_ads"],
        [id*="banner"],
        [class*="ads"],
        [class*="advertisement"],
        [id*="advert"],
        iframe[id*="google_ads_iframe"],
        [class*="ad-container"],
        [class*="sponsored"],
        [id*="carbonads"],
        [class*="adsbox"]
    `);
    adElements.forEach(ad => {
        if (ad.id || ad.className) {
            blockedAds.push(ad.id || ad.className);
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

if (document.body) {
    const observer = new MutationObserver(removeAds);
    observer.observe(document.body, {childList: true, subtree: true});
    removeAds();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const observer = new MutationObserver(removeAds);
        observer.observe(document.body, {childList: true, subtree: true});
        removeAds();
    });
}
