/**
 * Application Entry & Page Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme toggle initialization
    initThemeToggler();
    
    // 2. Initialize terminal simulator
    window.terminalInstance = new TerminalSimulator();
    
    // 3. Initialize search and filtering
    initBlogSearchAndFilters();
    
    // 3b. Initialize GitHub Load More
    initGithubLoadMore();
    
    // 4. Initialize reader drawer
    initReaderDrawer();
    
    // 5. Initialize CTF checker
    initCtfForm();
 
    // 6. Fetch HTB and THM statistics
    fetchCyberStats();
 
    // 7. Fetch GitHub security projects
    fetchGithubProjects();
 
    // 7b. Initialize PGP copy button
    const pgpCopyBtn = document.getElementById("pgp-copy-btn");
    const pgpCode = document.getElementById("pgp-fingerprint");
    if (pgpCopyBtn && pgpCode) {
        pgpCopyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(pgpCode.textContent.trim()).then(() => {
                pgpCopyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--accent-color);"></i>';
                setTimeout(() => {
                    pgpCopyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy PGP fingerprint: ", err);
            });
        });
    }

    // 8. Dynamic Scroll Actions: Shrink Header
    const header = document.getElementById("site-header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }

    // 8b. Dynamic Scroll Actions: Scroll Spy Highlight
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section[id]");

    function scrollSpy() {
        let currentSectionId = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Align trigger point with viewport top minus header height buffer
            if (window.scrollY >= sectionTop - 120) {
                currentSectionId = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", scrollSpy);
    scrollSpy(); // trigger on load to set active state

    // 9. Log console hint for curious security students (Standard CTF tactic)
    console.log(
        "%c[i] Looking for the flag file? Try listing or reading flag.txt in the landing page terminal simulator! or inspect source.", 
        "color: #00ff66; font-family: monospace; font-size: 13px; font-weight: bold;"
    );
});
