/**
 * GitHub Repos Fetcher, Filtering & Pagination
 */
let fetchedSecurityRepos = [];
let visibleProjectsLimit = 3;

const MOCK_REPOS_FALLBACK = [
    {
        name: "Active-Directory-Kerberoasting-Toolkit",
        description: "A Python implementation of Kerberoasting, AS-REP roasting, and delegation abusing scripts optimized for automated red teaming assessments.",
        html_url: "https://github.com/HasratSec/Active-Directory-Kerberoasting-Toolkit",
        topics: ["active-directory", "kerberos", "red-teaming", "python"],
        stargazers_count: 12,
        language: "Python"
    },
    {
        name: "ROP-Chain-Generator-x86",
        description: "An exploit helper tool that scans DLL files for bad characters, automatically structures a VirtualProtect ROP chain, and formats output as Python exploit payloads.",
        html_url: "https://github.com/HasratSec/ROP-Chain-Generator-x86",
        topics: ["exploit-development", "rop-chain", "aslr-bypass", "cpp"],
        stargazers_count: 8,
        language: "C++"
    },
    {
        name: "PortSwigger-WebSec-Exploits",
        description: "A repository compiling custom POC exploits solved in the PortSwigger Web Security Academy including SSRF, blind SQLi, and CORS bypasses.",
        html_url: "https://github.com/HasratSec/PortSwigger-WebSec-Exploits",
        topics: ["web-security", "ssrf", "sqli", "cors-bypass"],
        stargazers_count: 15,
        language: "Python"
    }
];

function renderGithubProjects() {
    const grid = document.getElementById("github-projects-grid");
    const loadMoreWrapper = document.getElementById("github-load-more-wrapper");
    if (!grid) return;

    if (fetchedSecurityRepos.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">No security projects found on this account.</div>`;
        if (loadMoreWrapper) loadMoreWrapper.style.display = "none";
        return;
    }

    // Determine how many projects to render
    const slicedRepos = fetchedSecurityRepos.slice(0, visibleProjectsLimit);

    // Render projects
    grid.innerHTML = slicedRepos.map(repo => {
        // Get top 3 topics/tags excluding profile name
        const tags = (repo.topics || [])
            .filter(t => t !== PROFILE_CONFIG.githubUsername.toLowerCase())
            .slice(0, 3);
        
        if (repo.language && !tags.includes(repo.language.toLowerCase())) {
            tags.unshift(repo.language);
        }

        const starBadge = repo.stargazers_count > 0 
            ? `<span style="font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${repo.stargazers_count}</span>` 
            : "";

        return `
            <div class="project-card">
                <div class="project-card-header">
                    <div class="project-folder-icon"><i class="fa-regular fa-folder-open"></i></div>
                    <div class="project-links">
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository" title="GitHub Repo"><i class="fa-brands fa-github"></i></a>
                        ${starBadge}
                    </div>
                </div>
                <h3 class="project-title">${repo.name}</h3>
                <p class="project-desc">${repo.description || "No description provided."}</p>
                <div class="project-tech">
                    ${tags.map(tag => `<span class="tech-tag">${tag}</span>`).join("")}
                </div>
            </div>
        `;
    }).join("");

    // Show/hide Load More button
    if (loadMoreWrapper) {
        if (fetchedSecurityRepos.length > visibleProjectsLimit) {
            loadMoreWrapper.style.display = "flex";
        } else {
            loadMoreWrapper.style.display = "none";
        }
    }
}

async function fetchGithubProjects() {
    const grid = document.getElementById("github-projects-grid");
    if (!grid || !PROFILE_CONFIG.githubUsername) return;

    try {
        const response = await fetch(`https://api.github.com/users/${PROFILE_CONFIG.githubUsername}/repos?per_page=100&sort=pushed`);
        if (response.ok) {
            const repos = await response.json();
            
            // Filter security repos
            const keywords = /(security|pentest|exploit|payload|cve|portswigger|burp|hacking|vuln|rop|attack|relay|reverse|malware|bypass|kali-linux)/i;
            const blacklist = /(hasrat|mock|DSA|utility|travel|tea|uni|solar|page|react|parallax|web|mastery|mern|interview|Body_mass_index|CSS-Card|CSS_Card|Daily_Challenges_Tracking_Site|Form-Challenge|Git|Github-Basics|Git-Preparation|HTML-Forms|My-Portfolio|skills-copilot-codespaces-vscode|Python_Course)/i;
            fetchedSecurityRepos = repos.filter(repo => {
                const nameMatch = keywords.test(repo.name);
                const descMatch = repo.description ? keywords.test(repo.description) : false;
                const topicsMatch = repo.topics ? repo.topics.some(topic => keywords.test(topic)) : false;
                const isBlacklisted = blacklist.test(repo.name);
                return (nameMatch || descMatch || topicsMatch) && !isBlacklisted;
            });

            renderGithubProjects();
        } else {
            console.warn("GitHub API rate limit exceeded or returned an error. Using offline fallbacks.");
            useGithubFallback();
        }
    } catch (e) {
        console.error("[-] Failed to fetch GitHub repositories:", e);
        useGithubFallback();
    }
}

function useGithubFallback() {
    fetchedSecurityRepos = MOCK_REPOS_FALLBACK;
    renderGithubProjects();
    
    // Append notice
    const grid = document.getElementById("github-projects-grid");
    if (!grid) return;
    const notice = document.createElement("div");
    notice.style.gridColumn = "1 / -1";
    notice.style.textAlign = "center";
    notice.style.fontSize = "0.8rem";
    notice.style.fontFamily = "var(--font-mono)";
    notice.style.color = "var(--text-secondary)";
    notice.style.marginTop = "1.5rem";
    notice.style.opacity = "0.75";
    notice.innerHTML = `<i class="fa-solid fa-circle-info" style="color: var(--accent-color);"></i> Displaying showcase highlight projects (GitHub API rate-limited/offline)`;
    grid.appendChild(notice);
}

function initGithubLoadMore() {
    const loadMoreBtn = document.getElementById("github-load-more-btn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            visibleProjectsLimit += 3;
            renderGithubProjects();
            // Re-append notice if using fallback
            if (fetchedSecurityRepos === MOCK_REPOS_FALLBACK) {
                // Remove old notice first
                const grid = document.getElementById("github-projects-grid");
                const oldNotices = grid ? grid.querySelectorAll("div") : [];
                oldNotices.forEach(n => {
                    if (n.innerHTML.includes("GitHub API rate-limited")) {
                        n.remove();
                    }
                });
                useGithubFallback();
            }
        });
    }
}
