/**
 * CTF & Easter Egg Logic
 */
const ACTUAL_FLAG = "FLAG{a1ways_check_the_console}";

function validateCtfFlag(submitted) {
    const cleanSubmit = submitted.trim().toLowerCase();
    const targetFlag = ACTUAL_FLAG.toLowerCase();
    if (cleanSubmit === targetFlag) {
        // Unlock God Mode!
        setGlobalTheme("god-mode");
        
        return {
            success: true,
            message: "[+] ACCESS GRANTED. ROOT PRIVILEGES ENABLED. God-mode style initialized."
        };
    } else {
        return {
            success: false,
            message: "[-] INVALID DECRYPTION FLAG. Attempt logged to syslog."
        };
    }
}

function initCtfForm() {
    const form = document.getElementById("ctf-flag-form");
    if (!form) return;
    
    const input = document.getElementById("ctf-flag-input");
    const feedback = document.getElementById("ctf-feedback-msg");
    const inputGroup = form.querySelector(".ctf-input-group");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;

        const result = validateCtfFlag(value);
        
        // Clear old visual cues
        if (inputGroup) inputGroup.classList.remove("shake-error");
        
        if (result.success) {
            if (feedback) {
                feedback.style.color = "var(--accent-color)";
                feedback.textContent = result.message;
            }
            input.value = "";
        } else {
            if (feedback) {
                feedback.style.color = "#ff5f56";
                feedback.textContent = result.message;
            }
            
            // Trigger shake animation
            if (inputGroup) {
                inputGroup.classList.add("shake-error");
                setTimeout(() => {
                    inputGroup.classList.remove("shake-error");
                }, 500);
            }
        }
    });
}
