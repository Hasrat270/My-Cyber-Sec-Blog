# 💻 Hasrat.Sec — Cybersecurity Portfolio & Blog

A premium, interactive, and fully responsive cybersecurity portfolio and research blog featuring a terminal simulator, dynamic API stats integration, and hidden CTF challenges.

---

## 🚀 Key Features

*   **Interactive Terminal Simulator**: Run active shell commands like `help`, `about`, `skills`, `posts`, `cat`, `theme`, and `flag`.
*   **Modular Reading View Drawer**: Clean slide-out reader with dynamic code syntax highlighting (via Highlight.js) and horizontal-scroll-resilient copy buttons.
*   **Real-time Stats Integration**: Custom script integration to display up-to-date stats from **Hack The Box** and **TryHackMe**.
*   **Dynamic GitHub Projects Showcase**: Integrated pagination fetching repositories dynamically from GitHub API.
*   **CTF & Easter Egg**: A hidden ROT13 CTF flag. Locate, decrypt, and validate it to unlock the custom **Matrix "God Mode" Theme**!
*   **Responsive Styling**: Curated HSL color system supporting Light, Dark, and Matrix/God Mode visual themes.

---

## 🛠️ Commands available in the Terminal Simulator

| Command | Description | Example |
| :--- | :--- | :--- |
| `help` | Lists all available commands | `help` |
| `about` | Displays author background and platforms | `about` |
| `posts` | Lists all published cybersecurity write-ups | `posts` |
| `cat` | Reads a write-up by its number or views flag files | `cat 3`, `cat flag.txt` |
| `skills` | Lists technical competencies and tooling arsenal | `skills` |
| `theme` | Switches the visual color scheme | `theme light`, `theme dark` |
| `flag` | Validates a decrypted CTF flag to unlock system roots | `flag FLAG{...}` |
| `clear` | Clears console history and output | `clear` |

---

## 📂 Project Structure

```text
├── css/
│   ├── base.css        # Base HTML settings, resets, and layout system
│   ├── theme.css       # Dynamic theme definitions (light, dark, god-mode)
│   ├── components.css  # Modular components (terminal, cards, drawer, badges)
│   └── utilities.css   # Helper classes and layout utility mappings
├── js/
│   ├── config.js       # User IDs, platform credentials, and profile settings
│   ├── writeups-data.js# Database containing blog posts and write-ups content
│   ├── theme.js        # Core theme toggling logic
│   ├── drawer.js       # Code highlighting and reader drawer container handler
│   ├── ctf.js          # ROT13 checking and CTF form submit handlers
│   ├── terminal.js     # Console command execution, parser, and history
│   ├── blog.js         # Blog cards grid, filtering, and search engine
│   ├── stats.js        # HTB / THM statistics API sync
│   ├── github.js       # GitHub API projects loader & pagination
│   └── main.js         # Application bootstrapper
├── index.html          # Main HTML structure
└── styles.css          # Legacy fallback styles
```

---

## 🏁 Getting Started

Simply clone this repository and open the `index.html` file in any modern web browser:

```bash
git clone https://github.com/Hasrat270/My-Cyber-Sec-Blog.git
cd My-Cyber-Sec-Blog
# Open index.html directly or serve using Python:
python3 -m http.server 8000
```
