/**
 * Blog Filter, Search & Pagination Logic
 */
let visiblePostsLimit = 3;
let activeCategory = "all";
let searchQuery = "";

function renderBlogPosts() {
    const grid = document.getElementById("blog-posts-grid");
    const loadMoreWrapper = document.getElementById("blog-load-more-wrapper");
    if (!grid) return;

    // Filter posts from POSTS_DATA
    const keys = Object.keys(POSTS_DATA);
    
    // Sort keys descending (assuming higher ID is newer)
    const sortedKeys = keys.sort((a, b) => Number(b) - Number(a));

    const filteredKeys = sortedKeys.filter(id => {
        const post = POSTS_DATA[id];
        const matchesCategory = (activeCategory === "all" || post.category === activeCategory);
        
        const searchStr = `${post.title} ${post.summary} ${post.tags.join(" ")}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    // Determine how many posts to render
    const slicedKeys = filteredKeys.slice(0, visiblePostsLimit);

    if (slicedKeys.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary); font-family: var(--font-mono);">No writeups match your search or filter criteria.</div>`;
        if (loadMoreWrapper) loadMoreWrapper.style.display = "none";
        return;
    }

    // Render cards
    grid.innerHTML = slicedKeys.map(id => {
        const post = POSTS_DATA[id];
        return `
            <article class="blog-card" data-categories="${post.category}">
                <div class="blog-card-meta">
                    <span class="blog-date"><i class="fa-regular fa-calendar"></i> ${post.date}</span>
                    <span class="blog-read-time"><i class="fa-regular fa-clock"></i> ${post.readTime}</span>
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-summary">${post.summary}</p>
                <div class="blog-card-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
                </div>
                <button class="btn btn-text read-post-btn" data-post-id="${id}">Read Exploit Analysis <i class="fa-solid fa-arrow-right-long"></i></button>
            </article>
        `;
    }).join("");

    // Show/hide Load More button
    if (loadMoreWrapper) {
        if (filteredKeys.length > visiblePostsLimit) {
            loadMoreWrapper.style.display = "flex";
        } else {
            loadMoreWrapper.style.display = "none";
        }
    }
}

function initBlogSearchAndFilters() {
    const searchInput = document.getElementById("blog-search");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const loadMoreBtn = document.getElementById("blog-load-more-btn");
    
    // Initial Render
    renderBlogPosts();

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.trim();
            visiblePostsLimit = 3; // reset pagination on search
            renderBlogPosts();
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.category;
            visiblePostsLimit = 3; // reset pagination on category filter
            renderBlogPosts();
        });
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            visiblePostsLimit += 3;
            renderBlogPosts();
        });
    }
}
