const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const raw = fs.readFileSync(path.join(__dirname, '..', 'conversation_raw.json'), 'utf8');
const messages = JSON.parse(raw.replace(/^﻿/, ''));

// Clean up ide_opened_file tags and tool artifacts from messages
function clean(text) {
  // Remove ide_opened_file tags
  text = text.replace(/<ide_opened_file>[\s\S]*?<\/ide_opened_file>/g, '');
  // Remove ide_selection tags
  text = text.replace(/<ide_selection>[\s\S]*?<\/ide_selection>/g, '');
  // Remove system-reminder tags
  text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
  // Remove antml tags
  text = text.replace(/<[^>]*>[\s\S]*?<\/antml:[^>]*>/g, '');
  // Trim
  text = text.trim();
  return text;
}

// Convert markdown-like text to simple HTML
function toHtml(text) {
  // Escape HTML
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headers
  text = text.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  text = text.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  // Bullet lists
  text = text.replace(/^[•·\-] (.+)$/gm, '<li>$1</li>');
  text = text.replace(/^(\d+)\. (.+)$/gm, '<li><span class="num">$1.</span> $2</li>');
  // Wrap consecutive <li> in <ul>
  text = text.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  // Line breaks
  text = text.replace(/\n\n+/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  text = `<p>${text}</p>`;
  // Clean empty paragraphs
  text = text.replace(/<p>\s*<\/p>/g, '');

  return text;
}

// Filter out empty messages
const filtered = messages
  .map(m => ({ ...m, text: clean(m.text) }))
  .filter(m => m.text.length > 5);

const htmlPath = path.join(os.tmpdir(), 'conversation_full.html');
const pdfPath = path.join(__dirname, '..', 'CONVERSATION_COMPLETE_2026-06-09.pdf');

let msgNumber = 0;
const bubbles = filtered.map(m => {
  const isUser = m.role === 'Utilisateur';
  msgNumber++;
  return `
    <div class="msg ${isUser ? 'user' : 'claude'}">
      <div class="msg-header">
        <span class="badge ${isUser ? 'badge-user' : 'badge-claude'}">${m.role}</span>
        <span class="msg-num">#${msgNumber}</span>
      </div>
      <div class="bubble">${toHtml(m.text)}</div>
    </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Conversation Complète — Claude Code × Utilisateur — 9 juin 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f6f9;
      color: #1a1a2e;
      font-size: 10.5pt;
    }

    /* === COVER === */
    .cover {
      min-height: 100vh;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center; text-align: center;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      color: white; padding: 60px 40px;
      page-break-after: always;
    }
    .cover-icon { font-size: 72px; margin-bottom: 28px; }
    .cover h1 { font-size: 28pt; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
    .cover .sub { font-size: 13pt; color: rgba(255,255,255,0.65); margin-bottom: 40px; }
    .cover-meta {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px; padding: 24px 48px;
      font-size: 10.5pt; line-height: 2.2; text-align: left;
    }
    .cover-meta span { color: rgba(255,255,255,0.5); margin-right: 8px; }
    .cover-meta strong { color: white; }

    /* === CONTENT === */
    .content { max-width: 860px; margin: 0 auto; padding: 50px 40px; }

    .page-header {
      text-align: center; margin-bottom: 40px;
      padding-bottom: 24px; border-bottom: 2px solid #e0e4ef;
    }
    .page-header h2 { font-size: 15pt; color: #1a1a2e; font-weight: 700; }
    .page-header p { color: #6b7280; font-size: 9.5pt; margin-top: 6px; }

    /* === MESSAGES === */
    .messages { display: flex; flex-direction: column; gap: 16px; }

    .msg { page-break-inside: avoid; }

    .msg-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 6px;
    }
    .msg.user .msg-header { flex-direction: row-reverse; }

    .badge {
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 1.2px; text-transform: uppercase;
      padding: 3px 12px; border-radius: 100px;
    }
    .badge-user { background: #dbeafe; color: #1d4ed8; }
    .badge-claude { background: #fef3c7; color: #92400e; }

    .msg-num {
      font-size: 0.65rem; color: #9ca3af; font-weight: 500;
    }

    .bubble {
      padding: 14px 18px;
      border-radius: 18px;
      line-height: 1.7;
      max-width: 92%;
      box-shadow: 0 2px 10px rgba(0,0,0,0.07);
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .user .bubble {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border-bottom-right-radius: 4px;
      margin-left: auto;
    }
    .claude .bubble {
      background: white;
      color: #1a1a2e;
      border-bottom-left-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .bubble p { margin: 0 0 8px 0; }
    .bubble p:last-child { margin-bottom: 0; }
    .bubble h2, .bubble h3, .bubble h4 {
      font-weight: 700; margin: 10px 0 4px;
    }
    .bubble h2 { font-size: 11pt; }
    .bubble h3 { font-size: 10.5pt; }
    .bubble h4 { font-size: 10pt; }
    .bubble ul { padding-left: 20px; margin: 6px 0; }
    .bubble li { margin: 2px 0; }
    .bubble .num { font-weight: 700; margin-right: 4px; }

    .claude .bubble code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 8.8pt;
      background: #f1f5f9;
      color: #dc2626;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .user .bubble code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 8.8pt;
      background: rgba(255,255,255,0.2);
      padding: 1px 5px;
      border-radius: 4px;
    }
    .claude .bubble strong { color: #111827; }

    /* === FOOTER === */
    .footer {
      margin-top: 50px; text-align: center;
      font-size: 9pt; color: #9ca3af;
      border-top: 1px solid #e5e7eb; padding-top: 20px;
    }

    /* === PRINT === */
    @page { size: A4; margin: 0; }
    @media print {
      body { background: white; }
      .cover {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .user .bubble {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-icon">💬</div>
    <h1>Conversation Complète</h1>
    <div class="sub">Claude Code &times; Utilisateur</div>
    <div class="cover-meta">
      <div><span>Date :</span> <strong>9 juin 2026</strong></div>
      <div><span>Projet :</span> <strong>Livraison Rapide OUAGA &amp; BOBO</strong></div>
      <div><span>Modèle IA :</span> <strong>Claude Sonnet 4.6 (Anthropic)</strong></div>
      <div><span>Échanges :</span> <strong>${filtered.length} messages</strong></div>
      <div><span>Sujets :</span> <strong>Sécurité · Dashboard Admin · Chat · Performance · Analytics</strong></div>
    </div>
  </div>

  <!-- CONVERSATION -->
  <div class="content">
    <div class="page-header">
      <h2>Historique complet de la session — 9 juin 2026</h2>
      <p>Tous les échanges entre l'Utilisateur et Claude Code · Projet Livraison Rapide OUAGA &amp; BOBO</p>
    </div>
    <div class="messages">
      ${bubbles}
    </div>
    <div class="footer">
      Conversation complète générée le 9 juin 2026 &nbsp;·&nbsp;
      Livraison Rapide OUAGA &amp; BOBO &nbsp;·&nbsp;
      ${filtered.length} messages &nbsp;·&nbsp;
      Claude Sonnet 4.6
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML écrit :', htmlPath, `(${Math.round(html.length/1024)}KB)`);

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromeExe}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${htmlPath}"`;

try {
  execSync(cmd, { stdio: 'inherit', timeout: 60000 });
  const size = fs.statSync(pdfPath).size;
  console.log(`\n✅ PDF généré : ${pdfPath} (${Math.round(size/1024)}KB)`);
} catch (err) {
  console.error('Erreur Chrome:', err.message);
  process.exit(1);
}
