import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Charger manuellement .env.local
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.trim();
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

console.log("\n=== VÉRIFICATION DES CLÉS DE L'IA ET BASE DE DONNÉES ===");
console.log("NEXT_PUBLIC_SUPABASE_URL :", url ? `🟢 OK` : "🔴 MANQUANT");
console.log("SUPABASE_SERVICE_ROLE_KEY :", serviceKey ? `🟢 OK (${serviceKey.substring(0, 10)}...)` : "🔴 MANQUANT");
console.log("GEMINI_API_KEY :", geminiKey ? `🟢 OK (${geminiKey.substring(0, 5)}...)` : "🔴 MANQUANT");

if (!url || !serviceKey || !geminiKey) {
  console.log("\n❌ Erreur : Certaines variables indispensables sont vides dans '.env.local'.");
  console.log("Assurez-vous qu'elles soient définies localement pour vos tests locaux, et également sur Vercel pour la version en ligne.\n");
  process.exit(1);
}

// 1. Test de la connexion Supabase Admin (Service Role)
const supabase = createClient(url, serviceKey);

supabase.from('paiements').select('id').limit(1)
  .then(({ error }) => {
    if (error) {
      console.log("❌ Connexion Supabase échouée :", error.message);
    } else {
      console.log("✅ Connexion Supabase réussie ! Accès en mode administrateur OK.");
    }
  })
  .catch(err => {
    console.log("❌ Erreur critique Supabase :", err.message);
  });

// 2. Test de la connexion Gemini 2.5 Flash
try {
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Bonjour, dis juste "OK" si tu reçois ce message.'
  })
  .then(res => {
    console.log("✅ Connexion à l'API Gemini réussie ! Réponse de l'IA :", res.text ? res.text.trim() : "Aucune");
  })
  .catch(err => {
    console.log("❌ Connexion à l'API Gemini échouée (Clé invalide ou problème réseau) :", err.message);
  });
} catch (e) {
  console.log("❌ Erreur d'initialisation de Gemini :", e.message);
}
