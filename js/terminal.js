/**
 * Interactive Terminal Simulator
 */
class TerminalSimulator {
    constructor() {
        this.input = document.getElementById("terminal-input");
        this.form = document.getElementById("terminal-form");
        this.outputContainer = document.getElementById("terminal-output-container");
        this.widget = document.getElementById("terminal-widget");
        this.clearBtn = document.getElementById("terminal-clear-btn");
        
        if (!this.input || !this.form || !this.outputContainer || !this.widget) return;
        
        this.history = [];
        this.historyIndex = -1;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            const cmd = this.input.value.trim();
            if (cmd) {
                this.executeCommand(cmd);
            }
        });

        // Focus input when clicking anywhere inside the terminal body
        this.widget.addEventListener("click", () => {
            this.input.focus();
        });

        if (this.clearBtn) {
            this.clearBtn.addEventListener("click", () => {
                this.clear();
            });
        }

        // Key listeners for history
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.history.length - 1 - this.historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.history.length - 1 - this.historyIndex];
                } else if (this.historyIndex === 0) {
                    this.historyIndex = -1;
                    this.input.value = "";
                }
            }
        });
    }

    writeLine(text, cssClass = "") {
        const line = document.createElement("div");
        line.className = `terminal-line ${cssClass}`;
        
        // Preserve code layout or html content if needed
        if (text.startsWith("<pre") || text.includes("<div") || text.includes("<code")) {
            line.innerHTML = text;
        } else {
            line.textContent = text;
        }
        
        this.outputContainer.appendChild(line);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const consoleEl = document.getElementById("terminal-console");
        if (consoleEl) {
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }

    clear() {
        this.outputContainer.innerHTML = "";
        this.writeLine("Console cleared. guest-shell active.");
        this.writeLine("Type 'help' for instructions.");
        this.writeLine(" ");
    }

    executeCommand(cmdLine) {
        // Add to history
        this.history.push(cmdLine);
        this.historyIndex = -1;
        
        // Echo input line
        this.writeLine(`guest@hasrat-sec:~$ ${cmdLine}`, "terminal-echo");
        this.input.value = "";

        // Parse args, collapsing multiple spaces
        const args = cmdLine.trim().split(/\s+/);
        const baseCmd = args[0].toLowerCase();

        switch (baseCmd) {
            case "help":
                this.writeLine("Available Commands:", "text-accent");
                this.writeLine("  about        - Display bio and developer profiles.");
                this.writeLine("  posts        - List security writeups & exploit write-ups.");
                this.writeLine("  skills       - View competencies in cyber security.");
                this.writeLine("  cat [id]     - View writeup (e.g. 'cat 1' to view Constrained Delegation).");
                this.writeLine("  theme [name] - Switch visual theme ('light', 'dark', 'matrix').");
                this.writeLine("  rot13 [text] - Decrypt or encrypt a ROT13 cipher string.");
                this.writeLine("  clear        - Clear console output.");
                this.writeLine("  flag [flag]  - Submit a CTF flag (e.g. flag FLAG{...}).");
                break;
            case "about":
                this.writeLine("================ ABOUT HASRAT ================", "text-accent");
                this.writeLine("Hasrat is an offensive security student. Focused on Active Directory Pentesting,");
                this.writeLine("exploit development, and security assessment tooling.");
                this.writeLine("Active platforms: Hack The Box, TryHackMe, and PortSwigger.");
                this.writeLine("==============================================");
                break;
            case "skills":
                this.writeLine("=== TECHNICAL SKILLS & Arsenal ===", "text-accent");
                this.writeLine("  - Penetration Testing: Active Directory, Network Pivoting, Kerberos.");
                this.writeLine("  - Software & Exploit: x86/x64 Buffer overflows, ROP Chains, Python, Go.");
                this.writeLine("  - Tools: Metasploit, Burp Suite, Impacket, Ghidra, Rubeus, PowerView.");
                break;
            case "posts":
                this.writeLine("=== SECURITY WRITEUPS ===", "text-accent");
                const sortedKeys = Object.keys(POSTS_DATA).sort((a, b) => Number(b) - Number(a));
                sortedKeys.forEach((id, index) => {
                    const post = POSTS_DATA[id];
                    this.writeLine(`  [${index + 1}] ${post.title} (${post.date})`);
                });
                this.writeLine("Tip: Type 'cat [number]' to read a writeup right here.");
                break;
            case "cat":
                if (!args[1]) {
                    this.writeLine("Error: Missing argument. Usage: cat [number] or cat flag.txt", "text-muted");
                } else if (args[1] === "flag.txt" || args[1] === "flag") {
                    this.writeLine("[+] Flag file found!", "text-accent");
                    this.writeLine("It looks like it is encrypted in ROT13 cipher to prevent tampering:");
                    this.writeLine("  SYNT{n1jnlf_purpx_gur_pbafbyr}", "text-accent");
                    this.writeLine("Decrypt the flag and submit it using the submit input at the bottom of the page, or run 'flag [FLAG_VALUE]' here.");
                } else {
                    const keys = Object.keys(POSTS_DATA).sort((a, b) => Number(b) - Number(a));
                    const indexVal = parseInt(args[1], 10);
                    let targetId = null;

                    if (!isNaN(indexVal) && indexVal >= 1 && indexVal <= keys.length) {
                        targetId = keys[indexVal - 1];
                    } else if (POSTS_DATA[args[1]]) {
                        targetId = args[1];
                    }

                    if (targetId && POSTS_DATA[targetId]) {
                        const post = POSTS_DATA[targetId];
                        openReaderDrawer(targetId);
                        this.writeLine(`[+] Opening reading view for: "${post.title}"`);
                    } else {
                        this.writeLine(`Error: Writeup '${args[1]}' not found. Type 'posts' to list.`, "text-muted");
                    }
                }
                break;
            case "theme":
                if (!args[1]) {
                    this.writeLine("Usage: theme [light | dark | matrix]");
                } else {
                    const requestedTheme = args[1].toLowerCase();
                    if (requestedTheme === "light") {
                        setGlobalTheme("light");
                        this.writeLine("[+] Theme changed to Light mode.");
                    } else if (requestedTheme === "dark") {
                        setGlobalTheme("dark");
                        this.writeLine("[+] Theme changed to Dark mode.");
                    } else if (requestedTheme === "matrix" || requestedTheme === "god-mode") {
                        this.writeLine("[-] Access denied: requires root permission. Submit the root CTF flag to unlock.");
                    } else {
                        this.writeLine(`Unknown theme: '${args[1]}'. Try light or dark.`);
                    }
                }
                break;
            case "rot13":
            case "decrypt":
                if (!args[1]) {
                    this.writeLine("Usage: rot13 [ciphertext] or decrypt [ciphertext]");
                } else {
                    const cipherText = args.slice(1).join(" ");
                    const decrypted = cipherText.replace(/[a-zA-Z]/g, function (c) {
                        return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
                    });
                    this.writeLine(`[+] Decrypted output: ${decrypted}`, "text-accent");
                }
                break;
            case "flag":
                if (!args[1]) {
                    this.writeLine("Usage: flag FLAG{...}");
                } else {
                    const flagResult = validateCtfFlag(args[1]);
                    this.writeLine(flagResult.message, flagResult.success ? "text-accent" : "text-muted");
                }
                break;
            case "clear":
                this.clear();
                break;
            default:
                this.writeLine(`bash: command not found: ${args[0]}. Type 'help' to see list of valid commands.`, "text-muted");
        }
        this.writeLine(" ");
    }
}
