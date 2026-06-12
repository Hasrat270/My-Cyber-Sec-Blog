/**
 * Global Theme Toggling Logic
 */
function setGlobalTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("color-scheme", theme);
    document.querySelector('meta[name="color-scheme"]').content = (theme === "light") ? "light" : "dark";
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
