/**
 * Global Theme Toggling Logic
 */
function setGlobalTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("color-scheme", theme);
    document.querySelector('meta[name="color-scheme"]').content = (theme === "light") ? "light" : "dark";

    // Sync Giscus comment theme in real-time via postMessage
    syncGiscusTheme(theme);
}

/**
 * Send a postMessage to the Giscus iframe to update its theme dynamically.
 * Giscus supports this without a full reload.
 */
function syncGiscusTheme(theme) {
    let giscusTheme = "dark_dimmed";
    if (theme === "light") {
        giscusTheme = "light";
    } else if (theme === "god-mode") {
        giscusTheme = "transparent_dark";
    }

    const iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe) return; // drawer not open or Giscus not loaded yet

    iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        "https://giscus.app"
    );
}

function initThemeToggler() {
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.dataset.theme || "dark";
            const newTheme = currentTheme === "dark" || currentTheme === "god-mode" ? "light" : "dark";
            setGlobalTheme(newTheme);
        });
    }
}
