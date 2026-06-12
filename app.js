/**
 * DEPRECATED: This monolithic app.js has been split into modular files under the `js/` directory.
 * Please modify the specific files inside the `js/` directory for any future changes:
 * 
 * - js/config.js         : Global configurations (User IDs, platform settings)
 * - js/writeups-data.js  : Blog writeup database content
 * - js/theme.js          : Theme controls (light, dark, god-mode)
 * - js/drawer.js         : Side-panel writeup drawer reader
 * - js/ctf.js            : Easter Egg flags and form validation
 * - js/terminal.js       : Command line / terminal simulator class
 * - js/blog.js           : Search, filtering, and pagination of writeups
 * - js/stats.js          : Platform stats dynamically fetched via APIs
 * - js/github.js         : GitHub projects integration and pagination
 * - js/main.js           : Orchestrates startup and runs on DOM ready
 */
console.warn("[!] app.js is deprecated. The script logic is now loaded from individual files inside the js/ directory.");
