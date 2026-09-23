// Favicon fetching with multiple fallback strategies
async function fetchFavicon(appUrl, imgElement) {
    try {
        const url = new URL(appUrl);
        const origin = `${url.protocol}//${url.host}`;

        // Strategy 1: Try to fetch the page and parse favicon link
        try {
            const response = await fetch(origin, { mode: 'cors', cache: 'no-store' });
            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Look for favicon in head
                const faviconLink =
                    doc.querySelector('link[rel="icon"]') ||
                    doc.querySelector('link[rel="shortcut icon"]') ||
                    doc.querySelector('link[rel="apple-touch-icon"]');

                if (faviconLink?.href) {
                    let faviconUrl = faviconLink.href;
                    // Make absolute URL if relative
                    if (!faviconUrl.startsWith('http')) {
                        faviconUrl = faviconUrl.startsWith('/')
                            ? origin + faviconUrl
                            : origin + '/' + faviconUrl.replace(/^\/+/g, '');
                    }

                    imgElement.src = faviconUrl + '?t=' + Date.now(); // Cache buster
                    return;
                }
            }
        } catch (fetchError) {
            console.warn('Could not fetch page content:', fetchError.message);
        }

        // Strategy 2: Default favicon locations
        const fallbacks = [
            `${origin}/favicon.ico`,
            `${origin}/favicon.png`,
            `${origin}/apple-touch-icon.png`,
            `${origin}/images/favicon.png`,
            `${origin}/assets/favicon.ico`
        ];

        // Try each fallback sequentially
        for (const fallback of fallbacks) {
            try {
                const test = await fetch(fallback, { method: 'HEAD', mode: 'no-cors' });
                // For no-cors, we can't check status, so just try the first one
                imgElement.src = fallback + '?t=' + Date.now();
                return;
            } catch {}
        }

        // Strategy 3: Fallback to generic icon
        throw new Error('All fallbacks failed');

    } catch (error) {
        console.error('Favicon fetch failed for', appUrl, error.message);
        // Final fallback: Bootstrap icon placeholder
        imgElement.src = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#6d4aff">
                <rect width="100" height="100" rx="15"/>
                <text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-family="sans-serif">?</text>
            </svg>
        `);
    } finally {
        imgElement.classList.remove('loading');
    }
}

// Initialize all favicons
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.app-card');

    cards.forEach((card, index) => {
        const img = card.querySelector('.favicon[data-src]');
        if (img && card.href) {
            // Stagger loading to avoid overwhelming
            setTimeout(() => {
                fetchFavicon(card.href, img);
            }, index * 100);
        }
    });
});
