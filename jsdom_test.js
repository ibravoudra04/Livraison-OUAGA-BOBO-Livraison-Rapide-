const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  resources: 'usable'
});

dom.window.console.log = (...args) => console.log('[DOM LOG]', ...args);
dom.window.console.error = (...args) => console.error('[DOM ERR]', ...args);
dom.window.console.warn = (...args) => console.warn('[DOM WARN]', ...args);

// We need to wait a bit for scripts to load
setTimeout(() => {
  console.log('Checking STATE in app.js after 3 seconds...');
  try {
    // Note: STATE is not global, it is inside DOMContentLoaded listener
    console.log('Done waiting.');
  } catch(e) {
    console.error(e);
  }
}, 3000);
