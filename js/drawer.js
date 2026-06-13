/**
 * Sliding Reader Drawer UI Logic
 */

/**
 * Listen for Giscus metadata messages to grab GitHub username.
 * Giscus emits a message with viewer info when data-emit-metadata="1".
 * We use this to personalise the terminal prompt.
 */
window.addEventListener("message", (event) => {
    if (event.origin !== "https://giscus.app") return;
    const data = event.data?.giscus;
    if (!data) return;

    // Giscus sends viewer login when metadata is enabled
    const username = data?.discussion?.viewer?.login || data?.viewer?.login;
    if (username) {
        window.terminalUser = username;
        // Update terminal title bar
        const titleUser = document.getElementById("terminal-username");
        if (titleUser) titleUser.textContent = username;
        // Update terminal input prompt
        const promptUser = document.getElementById("terminal-prompt-user");
        if (promptUser) promptUser.textContent = username;
    }
});


function initReaderDrawer() {
    const drawer = document.getElementById("reader-drawer");
    if (!drawer) return;

    const closeBtn = document.getElementById("drawer-close-btn");
    const closeOverlay = document.getElementById("drawer-close-overlay");
    const themeBtn = document.getElementById("drawer-theme-toggle");

    // Store original title to restore on close
    const originalTitle = document.title;

    // Close handlers
    function closeDrawer() {
        drawer.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // restore scroll
        document.title = originalTitle; // restore tab title
        // Clear URL hash so refresh doesn't reopen drawer
        history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (closeOverlay) closeOverlay.addEventListener("click", closeDrawer);
    
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.getAttribute("aria-hidden") === "false") {
            closeDrawer();
        }
    });

    // Theme toggle within drawer (adds independent element scoping for code reading contrast)
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.dataset.theme || "dark";
            const newTheme = currentTheme === "dark" || currentTheme === "god-mode" ? "light" : "dark";
            setGlobalTheme(newTheme);
        });
    }

    // Click handler for blog list buttons
    document.addEventListener("click", (e) => {
        const readBtn = e.target.closest(".read-post-btn");
        if (readBtn) {
            const postId = readBtn.dataset.postId;
            openReaderDrawer(postId);
        }
    });
}

function openReaderDrawer(postId) {
    const drawer = document.getElementById("reader-drawer");
    const bodyArticle = document.getElementById("drawer-article-content");
    if (!drawer || !bodyArticle) return;
    
    const post = POSTS_DATA[postId];
    if (!post) return;

    // Render contents inside drawer
    bodyArticle.innerHTML = `
        <div class="post-header">
            <div class="post-meta-top">
                <span><i class="fa-regular fa-calendar"></i> ${post.date}</span>
                <span><i class="fa-regular fa-clock"></i> ${post.readTime}</span>
            </div>
            <h1 class="post-title">${post.title}</h1>
            <div class="post-tags">
                ${post.tags.map(t => `<span class="tag">${t}</span>`).join("")}
            </div>
        </div>
        <div class="post-content">
            ${post.content}
        </div>
        <div class="post-comments-section">
            <h3 class="comments-title"><i class="fa-regular fa-comments"></i> Discussion & Comments</h3>
            <div class="giscus" id="giscus-comments-container"></div>
        </div>
    `;

    // Set dynamic tab title to current post
    document.title = `${post.title} | Hasrat Blog`;

    // Persist post in URL hash so refresh restores it
    history.replaceState(null, "", `#post-${postId}`);

    // Open drawer
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // block background scroll

    // Add copy button to each pre code block
    bodyArticle.querySelectorAll("pre").forEach(pre => {
        const codeEl = pre.querySelector("code");
        const codeText = codeEl ? codeEl.textContent : pre.textContent;

        // Wrap pre inside a relative positioned container to keep copy button statically pinned on scroll
        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement("button");
        copyBtn.className = "pre-copy-btn";
        copyBtn.setAttribute("aria-label", "Copy code");
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i><span>Copy</span>';
        
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(codeText).then(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--accent-color);"></i><span>Copied!</span>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i><span>Copy</span>';
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy code block: ", err);
            });
        });
        
        wrapper.appendChild(copyBtn);
    });

    // Trigger syntax highlighting
    if (window.hljs) {
        bodyArticle.querySelectorAll("pre code").forEach(el => {
            window.hljs.highlightElement(el);
        });
    }

    // Load Giscus Comments
    loadGiscusComments();
}

function loadGiscusComments() {
    const container = document.getElementById("giscus-comments-container");
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    
    script.setAttribute("data-repo", "Hasrat270/My-Cyber-Sec-Blog");
    script.setAttribute("data-repo-id", "R_kgDOS46uYw");
    script.setAttribute("data-category", "Announcements");
    script.setAttribute("data-category-id", "DIC_kwDOS46uY84C_Cap");
    
    script.setAttribute("data-mapping", "og:title");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "1");
    script.setAttribute("data-input-position", "bottom");
    
    // Align comment theme with active portfolio theme
    const currentTheme = document.documentElement.dataset.theme || "dark";
    let giscusTheme = "dark_dimmed";
    if (currentTheme === "light") {
        giscusTheme = "light";
    } else if (currentTheme === "god-mode") {
        giscusTheme = "transparent_dark";
    }
    script.setAttribute("data-theme", giscusTheme);
    
    script.setAttribute("data-lang", "en");
    script.async = true;

    container.appendChild(script);
}
