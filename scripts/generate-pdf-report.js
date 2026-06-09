const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const mdPath = path.join(__dirname, '..', 'RAPPORT_SECURITE_ET_AMELIORATIONS.md');
const htmlPath = path.join(os.tmpdir(), 'rapport_livraison_rapide.html');
const pdfPath = path.join(__dirname, '..', 'RAPPORT_SECURITE_ET_AMELIORATIONS.pdf');

const md = fs.readFileSync(mdPath, 'utf8');

function mdToHtml(text) {
  let html = text;

  // Escape HTML special chars in code blocks first (protect them)
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const idx = codeBlocks.push(`<pre><code class="lang-${lang||'text'}">${escaped}</code></pre>`) - 1;
    return `\x00CODEBLOCK${idx}\x00`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, c) => {
    const escaped = c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<code>${escaped}</code>`;
  });

  // Headers
  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables
  html = html.replace(/((?:^\|.+\|\n)+)/gm, (table) => {
    const rows = table.trim().split('\n');
    let result = '<table><thead>';
    rows.forEach((row, i) => {
      if (i === 1 && /^\|[\s:-]+\|/.test(row)) {
        result += '</thead><tbody>';
        return;
      }
      const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
      const tag = i === 0 ? 'th' : 'td';
      result += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    });
    result += '</tbody></table>';
    return result;
  });

  // Unordered lists (group consecutive items)
  html = html.replace(/((?:^[-*]\s+.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-*]\s+/, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s+.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs (blank lines = new paragraph)
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs around block elements
  html = html.replace(/<p>(<(?:h[1-6]|hr|table|ul|ol|blockquote|pre)[^]*?<\/(?:h[1-6]|table|ul|ol|blockquote|pre)>|<hr>)<\/p>/g, '$1');
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Restore code blocks
  html = html.replace(/\x00CODEBLOCK(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);

  return html;
}

const body = mdToHtml(md);

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Sécurité & Améliorations — Livraison Rapide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Fira+Mono:wght@400;500&display=swap');

    :root {
      --brown: #8D5537;
      --brown-light: #f5ede7;
      --green: #1e8e3e;
      --red: #d93025;
      --blue: #1a73e8;
      --gray: #5f6368;
      --bg: #fafafa;
      --border: #e0e0e0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #202124;
      background: white;
      padding: 0;
    }

    /* Cover page */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #8D5537 0%, #5a3322 100%);
      color: white;
      padding: 60px 40px;
      page-break-after: always;
    }
    .cover .logo {
      font-size: 56px;
      margin-bottom: 24px;
    }
    .cover h1 {
      font-size: 28pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
      color: white;
      border: none;
    }
    .cover .subtitle {
      font-size: 15pt;
      color: rgba(255,255,255,0.8);
      margin-bottom: 40px;
    }
    .cover .meta {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 16px;
      padding: 24px 40px;
      display: inline-block;
      font-size: 11pt;
      line-height: 2;
    }
    .cover .meta strong { color: rgba(255,255,255,0.95); }
    .cover .badge {
      margin-top: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 100px;
      padding: 8px 24px;
      font-size: 10pt;
      color: rgba(255,255,255,0.9);
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Content wrapper */
    .content {
      max-width: 780px;
      margin: 0 auto;
      padding: 50px 60px;
    }

    /* Typography */
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: var(--brown);
      margin: 40px 0 16px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--brown);
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #202124;
      margin: 36px 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      font-weight: 700;
      color: var(--brown);
      margin: 28px 0 10px;
      page-break-after: avoid;
    }
    h4 {
      font-size: 11pt;
      font-weight: 700;
      color: #202124;
      margin: 20px 0 8px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 12px;
      orphans: 3;
      widows: 3;
    }

    /* Links */
    a { color: var(--blue); text-decoration: none; }

    /* Code */
    code {
      font-family: 'Fira Mono', 'Courier New', monospace;
      font-size: 9pt;
      background: #f1f3f4;
      color: #c0392b;
      padding: 2px 5px;
      border-radius: 4px;
    }

    pre {
      background: #1e1e1e;
      border-radius: 10px;
      padding: 20px;
      margin: 16px 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    pre code {
      font-size: 9pt;
      background: none;
      color: #e8eaed;
      padding: 0;
      border-radius: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th {
      background: var(--brown);
      color: white;
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 9.5pt;
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #fafafa; }
    tr:hover td { background: var(--brown-light); }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; }

    /* Lists */
    ul, ol {
      margin: 10px 0 14px 24px;
      padding: 0;
    }
    li { margin-bottom: 6px; }
    li > strong:first-child { color: var(--brown); }

    /* Blockquote */
    blockquote {
      border-left: 4px solid #f39c12;
      background: #fefce8;
      padding: 14px 20px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #78350f;
      page-break-inside: avoid;
    }

    /* HR */
    hr {
      border: none;
      border-top: 2px solid var(--border);
      margin: 30px 0;
    }

    /* Section containers for security items */
    h3 + p, h3 ~ p { }

    /* Italic */
    em { color: var(--gray); }

    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid var(--border);
      text-align: center;
      font-size: 9pt;
      color: var(--gray);
    }

    /* Print settings */
    @page {
      size: A4;
      margin: 0;
    }
    @page :first { margin: 0; }

    @media print {
      .cover { min-height: 100vh; }
      .content { padding: 40px 50px; }
      pre { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="logo">🛵</div>
    <h1>Rapport Sécurité<br>&amp; Améliorations</h1>
    <div class="subtitle">Livraison Rapide OUAGA &amp; BOBO</div>
    <div class="meta">
      <strong>Date :</strong> 9 juin 2026<br>
      <strong>Auteur :</strong> Claude Sonnet 4.6 (Anthropic)<br>
      <strong>Projet :</strong> Plateforme de livraison — Burkina Faso<br>
      <strong>Stack :</strong> Next.js · Supabase · TypeScript · PWA
    </div>
    <div class="badge">Confidentiel — Usage interne</div>
  </div>

  <!-- Report Content -->
  <div class="content">
    ${body}
    <div class="footer">
      Rapport généré automatiquement le 9 juin 2026 · Livraison Rapide OUAGA &amp; BOBO
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML écrit :', htmlPath);

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromeExe}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${htmlPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n✅ PDF généré avec succès :');
  console.log('  ', pdfPath);
} catch (err) {
  console.error('Erreur Chrome headless :', err.message);
  process.exit(1);
}
