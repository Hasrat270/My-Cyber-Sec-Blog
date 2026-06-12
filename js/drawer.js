/**
 * Sliding Reader Drawer UI Logic
 */
function initReaderDrawer() {
    const drawer = document.getElementById("reader-drawer");
    if (!drawer) return;

    const closeBtn = document.getElementById("drawer-close-btn");
    const closeOverlay = document.getElementById("drawer-close-overlay");
    const themeBtn = document.getElementById("drawer-theme-toggle");

    // Close handlers
    function closeDrawer() {
        drawer.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // restore scroll
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
    
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    
    // Align comment theme with active portfolio theme (theme-matching colors)
    const currentTheme = document.documentElement.dataset.theme || "dark";
    let giscusTheme = "dark_dimmed";
    if (currentTheme === "light") {
        giscusTheme = "light";
    } else if (currentTheme === "god-mode") {
        giscusTheme = "noborder_dark";
    }
    script.setAttribute("data-theme", giscusTheme);
    
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    container.appendChild(script);
}
