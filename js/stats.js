/**
 * Platform Progress & Statistics Fetcher (HTB, THM, PortSwigger)
 */
async function fetchCyberStats() {
    // 1. Fetch TryHackMe Stats
    if (PROFILE_CONFIG.thmUsername) {
        try {
            const thmUrl = `https://tryhackme.com/api/user/${PROFILE_CONFIG.thmUsername}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(thmUrl)}`);
            if (response.ok) {
                const wrapper = await response.json();
                const data = JSON.parse(wrapper.contents);
                if (data && !data.error) {
                    const thmRankEl = document.getElementById("stat-thm-rank");
                    const thmPointsEl = document.getElementById("stat-thm-points");
                    
                    if (thmRankEl && data.level) thmRankEl.textContent = `Level ${data.level}`;
                    if (thmPointsEl && data.points) thmPointsEl.textContent = Number(data.points).toLocaleString();
                    
                    console.log("[+] TryHackMe stats updated successfully.");
                }
            }
        } catch (e) {
            console.error("[-] Failed to fetch TryHackMe stats:", e);
        }
    }

    // 2. Fetch Hack The Box Stats
    if (PROFILE_CONFIG.htbUserId) {
        try {
            const htbUrl = `https://labs.hackthebox.com/api/v4/user/profile/public/${PROFILE_CONFIG.htbUserId}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(htbUrl)}`);
            if (response.ok) {
                const wrapper = await response.json();
                const data = JSON.parse(wrapper.contents);
                if (data && data.profile) {
                    const htbRankEl = document.getElementById("stat-htb-rank");
                    const htbOwnsEl = document.getElementById("stat-htb-owns");
                    
                    if (htbRankEl && data.profile.rank) htbRankEl.textContent = data.profile.rank;
                    if (htbOwnsEl && data.profile.system_owns !== undefined) {
                        htbOwnsEl.textContent = data.profile.system_owns;
                    }
                    console.log("[+] Hack The Box stats updated successfully.");
                }
            }
        } catch (e) {
            console.error("[-] Failed to fetch Hack The Box stats:", e);
        }
    }

    // 3. Update PortSwigger Stats
    if (PROFILE_CONFIG.portswiggerLabsCount) {
        const psEl = document.getElementById("stat-portswigger-count");
        if (psEl) psEl.textContent = `${PROFILE_CONFIG.portswiggerLabsCount}+`;
    }
}
