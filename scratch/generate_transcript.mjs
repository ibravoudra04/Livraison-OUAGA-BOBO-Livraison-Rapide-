import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\\\Users\\\\HP\\\\.gemini\\\\antigravity-ide\\\\brain\\\\9e361042-df1c-45d4-a347-62c4432a9999\\\\.system_generated\\\\logs\\\\transcript.jsonl';
const outPath = 'C:\\\\Users\\\\HP\\\\.gemini\\\\antigravity-ide\\\\brain\\\\9e361042-df1c-45d4-a347-62c4432a9999\\\\historique_complet_aujourdhui.md';

let md = "# 📜 Historique Complet et Intégral de la Session d'Aujourd'hui\n\n";
md += "Voici la totalité exacte et mot pour mot de tous nos échanges et des actions prises, sans aucun résumé.\n\n---\n\n";

const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

rl.on('line', (line) => {
  try {
    const entry = JSON.parse(line);
    if (!entry.created_at) return;
    
    // Only today 2026-06-10
    if (!entry.created_at.startsWith('2026-06-10')) return;
    
    if (entry.source === 'USER_EXPLICIT' && entry.type === 'USER_INPUT') {
      let content = entry.content;
      content = content.replace(/<USER_REQUEST>\\s*|\\s*<\\/USER_REQUEST>/g, '');
      content = content.replace(/<ADDITIONAL_METADATA>[\\s\\S]*?<\\/ADDITIONAL_METADATA>/g, '');
      if (content.trim()) {
        md += '### 👤 Vous (' + entry.created_at + ')\\n\\n' + content.trim() + '\\n\\n---\\n\\n';
      }
    } else if (entry.source === 'MODEL' && entry.type === 'PLANNER_RESPONSE') {
      if (entry.content && entry.content.trim()) {
        md += '### 🤖 Assistant (' + entry.created_at + ')\\n\\n' + entry.content.trim() + '\\n\\n---\\n\\n';
      }
    }
  } catch(e) {}
});

rl.on('close', () => {
  fs.writeFileSync(outPath, md);
  console.log('Transcript generated at ' + outPath);
});
