const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const htmlPath = path.join(os.tmpdir(), 'conversation_livraison_rapide.html');
const pdfPath = path.join(__dirname, '..', 'CONVERSATION_2026-06-09.pdf');

const messages = [
  { role: 'Utilisateur', text: 'Sais-tu de quel projet tu parles ?' },
  { role: 'Claude Code', text: "Oui — il s'agit de <strong>Livraison Rapide OUAGA et BOBO</strong>, une application Next.js de mise en relation entre clients et livreurs à Ouagadougou et Bobo-Dioulasso (Burkina Faso). Stack : Next.js, Supabase, TypeScript, PWA, Leaflet, Gemini AI." },
  { role: 'Utilisateur', text: "Peux-tu vérifier que ce plan d'implantation a été parfaitement exécuté ? [Plan : réparation du chat bidirectionnel — 4 problèmes identifiés, 5 modifications à apporter]" },
  { role: 'Claude Code', text: "J'ai vérifié tous les fichiers concernés :<br>✅ <code>fix_chat_image_url.sql</code> — colonne <code>image_url</code> ajoutée, Realtime activé<br>✅ <code>ClientDashboard.tsx</code> — utilise bien <code>livreurs_view</code><br>✅ <code>DriverDashboard.tsx</code> — interface <code>ChatConversation</code> correcte, useEffect chargement conversations<br>✅ <code>DriverDrawer.tsx</code> — prop <code>onChatClient</code> transmise<br>✅ <code>page.tsx</code> — état <code>chatPartner</code> gère les deux sens du chat<br><br>Le plan a été <strong>entièrement exécuté</strong>." },
  { role: 'Utilisateur', text: "C'EST FAIT" },
  { role: 'Claude Code', text: "Parfait. Le SQL a bien été appliqué dans Supabase." },
  { role: 'Utilisateur', text: "POUSSE SUR GITHUB" },
  { role: 'Claude Code', text: "Le dépôt est déjà à jour avec <code>origin/main</code> — rien à pousser." },
  { role: 'Utilisateur', text: "Qu'est-ce que les changements de ces corrections auront sur l'app ?" },
  { role: 'Claude Code', text: "J'ai effectué un audit de sécurité complet. Voici les vulnérabilités identifiées :<br><br><strong>CRITIQUES</strong><br>• C-1 : RLS basé sur <code>user_metadata</code> (modifiable par les utilisateurs) → doit utiliser <code>app_metadata</code><br>• C-2 : <code>/api/push</code> sans authentification → n'importe qui peut envoyer des notifications<br>• C-3 : <code>/api/verify-payment</code> sans auth (intentionnel — flux anonyme)<br><br><strong>HAUTES</strong><br>• H-4 : Headers de sécurité HTTP manquants (X-Frame-Options, CSP, etc.)<br>• H-5 : <code>image_url</code> dans les chats rendue sans validation d'origine<br><br><strong>MOYENNES</strong><br>• M-1 : Paywall sessionStorage côté client (intentionnel)" },
  { role: 'Utilisateur', text: "Ne touche pas à C-3 et M-1. Le compte profil admin doit avoir les accès qu'il avait. J'aimerais que tu donnes plus d'accès au compte admin — qu'il ait la capacité de faire plus et d'avoir plus de données d'analyses, qu'il ait aussi des analyses de visites journalières dans son tableau de bord. Ensuite tu peux faire les corrections. À la fin tu dois créer un fichier que je pourrai télécharger avec tout le travail que tu as fait. AS-TU COMPRIS ?" },
  { role: 'Claude Code', text: "Parfaitement compris. Voici le plan exécuté :<br><br><strong>1. Sécurité (sans toucher C-3 et M-1)</strong><br>• Créé <code>fix_security_v2.sql</code> — migre toutes les RLS vers <code>app_metadata</code><br>• Corrigé <code>useSupabaseAuth.ts</code> — supprime le fallback <code>user_metadata</code><br>• Sécurisé <code>/api/push</code> avec vérification de session SSR<br>• Ajouté headers HTTP dans <code>next.config.mjs</code><br>• Validé <code>image_url</code> dans <code>ChatDrawer.tsx</code><br><br><strong>2. Dashboard admin amélioré</strong><br>• Réécrit <code>hooks/useAdminStats.ts</code> — analytics 14 jours, stats par ville, nouveaux hooks<br>• Réécrit <code>AdminDashboard.tsx</code> — onglet Analytiques, recherche, toggle premium, export CSV, broadcast push<br>• Créé <code>/api/admin/broadcast/route.ts</code> — notifications push admin-only<br><br><strong>3. Fichier téléchargeable</strong><br>• Créé <code>RAPPORT_SECURITE_ET_AMELIORATIONS.md</code> + <code>.pdf</code>" },
  { role: 'Utilisateur', text: "C'EST FAIT [SQL appliqué dans Supabase]" },
  { role: 'Utilisateur', text: "POUSSE SUR GITHUB" },
  { role: 'Claude Code', text: "Poussé — commit <code>9ca8a9a</code> : <em>feat: security hardening + enhanced admin dashboard with daily analytics</em>" },
  { role: 'Utilisateur', text: "Combien de fois l'IA qui vérifie les captures d'écran peut être utilisée par jour ?" },
  { role: 'Claude Code', text: "Le modèle utilisé est <code>gemini-2.5-flash</code>. Aucune limite dans le code — seulement les quotas Google :<br><br>• Plan gratuit : ~500 requêtes/jour, 10 req/minute<br>• Plan payant : basé sur l'usage (~0,0002$/vérification ≈ 0,12 FCFA)<br><br>Pour 10 000 vérifications/mois → environ <strong>1 200 FCFA</strong>. Très bon marché.<br><br>⚠️ Il n'y a pas de rate limiting dans le code — je peux en ajouter si tu veux." },
  { role: 'Utilisateur', text: "Combien coûte l'abonnement payant ?" },
  { role: 'Claude Code', text: "Pas d'abonnement mensuel fixe — Google facture à l'usage :<br>• Entrée : 0,075$ / million de tokens<br>• Sortie : 0,30$ / million de tokens<br>• Par vérification : ~0,0002$ ≈ 0,12 FCFA<br><br>Le plan gratuit (500/jour) suffit largement pour démarrer. Pas besoin de passer au payant avant un volume très important." },
  { role: 'Utilisateur', text: "OK. Je me suis connecté sur l'app mais le compte profil admin affiche « chargement... » depuis un bon moment sans aucun résultat." },
  { role: 'Claude Code', text: "Trouvé — c'est une <strong>boucle infinie</strong> dans <code>useAdminStats.ts</code>.<br><br>Cause : <code>supabase = createClient()</code> crée un nouvel objet à chaque rendu, et cet objet est dans le tableau de dépendances du <code>useEffect</code> → l'effet se relance indéfiniment → <code>setLoading(true)</code> en boucle.<br><br>Fix : changé <code>[isAdmin, supabase]</code> en <code>[isAdmin]</code>. Poussé — commit <code>364b6c4</code>." },
  { role: 'Utilisateur', text: "Ça ne marche toujours pas." },
  { role: 'Claude Code', text: "Deux nouvelles corrections :<br>1. <code>useMemo(() => createClient(), [])</code> — client stable<br>2. Wrapper <code>safe()</code> — chaque requête protégée individuellement<br><br>Poussé — commit <code>a4f252c</code>." },
  { role: 'Utilisateur', text: "Ca ne donne toujours pas. C'est sûrement dû aux corrections de sécurité." },
  { role: 'Claude Code', text: "Analyse complète — deux causes identifiées :<br><br>1. <strong>Vérification téléphone supprimée</strong> : si le JWT n'a pas encore été rafraîchi avec le nouveau <code>app_metadata</code>, <code>role = null</code> → admin non reconnu<br>2. <strong>Race condition</strong> : si <code>isAdmin</code> change plusieurs fois rapidement, plusieurs appels concurrents à <code>fetchStats()</code><br><br>Fixes appliqués :<br>• Restauré le fallback numéro de téléphone dans <code>useSupabaseAuth.ts</code><br>• Ajouté <code>hasFetched.current</code> — fetchStats ne s'exécute qu'une seule fois<br>• Ajouté timeout 15 secondes pour forcer <code>loading = false</code><br><br>Poussé — commit <code>d8bba8c</code>." },
  { role: 'Utilisateur', text: "C'EST RÉGLÉ. J'aimerais que dans le compte profil admin, dans les statistiques, j'aie un bouton (Aujourd'hui, Les 7 derniers jours et Tous). Quand je clique sur une option, les données présentées suivent cette logique. AS-TU SAISI CE QUE JE VEUX DIRE ?" },
  { role: 'Claude Code', text: "Parfaitement saisi. Voici ce qui a été implémenté :<br><br>• État <code>statsPeriod: 'today' | '7days' | 'all'</code><br>• 3 boutons pill dans l'onglet Statistiques (valeur par défaut : Tout)<br>• Filtrage en temps réel de toutes les métriques selon la période choisie :<br>&nbsp;&nbsp;— Revenus confirmés, Revenus théoriques<br>&nbsp;&nbsp;— Nouveaux livreurs, Nouveaux clients<br>&nbsp;&nbsp;— Messages, Déblocages, Paiements<br>• Métriques fixes (Vues profil, Clics contact, Dossiers) restent en total<br><br>Aussi ajouté fetch des déblocages avec dates dans <code>useAdminStats.ts</code>.<br><br>Poussé — commit <code>01fd739</code>." },
  { role: 'Utilisateur', text: "Y a-t-il quelque chose à copier sur Vercel ou Supabase ?" },
  { role: 'Claude Code', text: "Non, rien. Ce commit ne contient que du code TypeScript/React — tout se déploie automatiquement sur Vercel via le git push. Aucune modification de base de données → rien à faire sur Supabase." },
  { role: 'Utilisateur', text: "Peux-tu me ressortir les références du dernier livreur qui vient de s'enregistrer ?" },
  { role: 'Claude Code', text: "Je n'ai pas accès direct à ta base de données Supabase. Pour voir le dernier livreur inscrit :<br><br>• <strong>Dashboard admin</strong> → onglet Livreurs → premier en haut (trié par date)<br>• <strong>Supabase Dashboard</strong> → Table Editor → table <code>livreurs</code> → trier par <code>created_at</code> décroissant" },
  { role: 'Utilisateur', text: "J'aimerais supprimer le compte livreur de KONATE AMADOU SIE." },
  { role: 'Claude Code', text: "Je n'ai pas accès direct à ta base. Via ton dashboard admin :<br><br>1. Connexion → profil → Espace Administration<br>2. Onglet Livreurs → recherche « Konate »<br>3. Clic sur son nom → bouton rouge « Supprimer définitivement » → confirmer<br><br>Ou via Supabase Dashboard → Table Editor → table <code>livreurs</code> → filtre sur le nom → Delete row." },
  { role: 'Utilisateur', text: "Propose des solutions pour rendre l'app plus scalable, fluide et rapide." },
  { role: 'Claude Code', text: "Voici les axes prioritaires :<br><br>🔴 <strong>Haute priorité</strong><br>1. Pagination sur les listes admin (chargement de tout en mémoire)<br>2. Index PostgreSQL manquants (scan complet à chaque requête)<br>3. Clustering des marqueurs Leaflet (lag avec 50+ livreurs)<br><br>🟠 <strong>Moyenne priorité</strong><br>4. React Query/SWR (cache + déduplication des requêtes)<br>5. Optimisation images avec next/image + Supabase transformations<br>6. Supabase Connection Pooling (PgBouncer mode Transaction)<br><br>🟡 <strong>Basse priorité</strong><br>7. Virtualisation des longues listes (react-window)<br>8. Code splitting AdminDashboard avec dynamic()<br>9. Debounce sur la recherche (300ms)<br>10. Nettoyage automatique des push subscriptions expirées<br><br>Je recommande de commencer par les index SQL et le dynamic() — 10 min de travail, impact immédiat." },
  { role: 'Utilisateur', text: "Le 8." },
  { role: 'Claude Code', text: "Remplacé l'import statique par un import dynamique dans <code>page.tsx</code> :<br><code>const AdminDashboard = dynamic(() => import('@/components/AdminDashboard/AdminDashboard'), { ssr: false });</code><br><br>Le bundle du dashboard admin (~700 lignes) n'est plus chargé par les clients et livreurs. Poussé — commit <code>6212d8e</code>." },
  { role: 'Utilisateur', text: "C'est déjà fait [index SQL]. Mets à jour le GitHub." },
  { role: 'Claude Code', text: "Créé <code>fix_indexes.sql</code> pour documenter les index appliqués, puis poussé — commit <code>9ffd117</code>." },
  { role: 'Utilisateur', text: "Mets toutes nos conversations d'aujourd'hui dans un dossier téléchargeable avec la mention « Claude Code » quand c'est toi qui parles et « Utilisateur » quand c'est moi qui parle." },
  { role: 'Claude Code', text: "Génération du fichier PDF de la conversation en cours..." },
];

const bubbles = messages.map(m => {
  const isUser = m.role === 'Utilisateur';
  return `
    <div class="msg ${isUser ? 'user' : 'claude'}">
      <div class="badge">${m.role}</div>
      <div class="bubble">${m.text}</div>
    </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Conversation — Claude Code × Utilisateur — 9 juin 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Fira+Mono:wght@400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f5f5f5; color: #202124; }

    .cover {
      min-height: 100vh; display: flex; flex-direction: column;
      justify-content: center; align-items: center; text-align: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white; padding: 60px 40px; page-break-after: always;
    }
    .cover .emoji { font-size: 64px; margin-bottom: 24px; }
    .cover h1 { font-size: 26pt; font-weight: 800; margin-bottom: 10px; }
    .cover .sub { font-size: 13pt; color: rgba(255,255,255,0.7); margin-bottom: 36px; }
    .cover .meta {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25);
      border-radius: 14px; padding: 20px 36px; font-size: 10.5pt; line-height: 2;
    }

    .content { max-width: 820px; margin: 0 auto; padding: 50px 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e0e0e0; }
    .header h2 { font-size: 16pt; color: #1a1a2e; }
    .header p { color: #5f6368; font-size: 10pt; margin-top: 6px; }

    .msg { display: flex; flex-direction: column; margin-bottom: 22px; max-width: 88%; page-break-inside: avoid; }
    .msg.user { align-self: flex-end; align-items: flex-end; margin-left: auto; }
    .msg.claude { align-self: flex-start; align-items: flex-start; }

    .badge {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
      margin-bottom: 5px; padding: 2px 10px; border-radius: 100px;
    }
    .user .badge { background: #e8f0fe; color: #1a73e8; }
    .claude .badge { background: #fce8e6; color: #c5221f; }

    .bubble {
      padding: 14px 18px; border-radius: 18px; font-size: 10.5pt; line-height: 1.65;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .user .bubble { background: #1a73e8; color: white; border-bottom-right-radius: 4px; }
    .claude .bubble { background: white; color: #202124; border-bottom-left-radius: 4px; border: 1px solid #e0e0e0; }
    .claude .bubble code {
      font-family: 'Fira Mono', monospace; font-size: 9pt;
      background: #f1f3f4; color: #c0392b; padding: 1px 5px; border-radius: 4px;
    }
    .claude .bubble strong { color: #1a1a2e; }

    .messages { display: flex; flex-direction: column; gap: 0; }

    .footer { margin-top: 50px; text-align: center; font-size: 9pt; color: #9aa0a6; border-top: 1px solid #e0e0e0; padding-top: 20px; }

    @page { size: A4; margin: 0; }
    @media print {
      body { background: white; }
      .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .user .bubble { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="emoji">💬</div>
    <h1>Conversation de Travail</h1>
    <div class="sub">Claude Code × Utilisateur</div>
    <div class="meta">
      <strong>Date :</strong> 9 juin 2026<br>
      <strong>Projet :</strong> Livraison Rapide OUAGA &amp; BOBO<br>
      <strong>Modèle IA :</strong> Claude Sonnet 4.6 (Anthropic)<br>
      <strong>Échanges :</strong> ${messages.length} messages
    </div>
  </div>
  <div class="content">
    <div class="header">
      <h2>Historique complet de la session — 9 juin 2026</h2>
      <p>Projet : Livraison Rapide OUAGA &amp; BOBO · Sécurité · Dashboard Admin · Performance</p>
    </div>
    <div class="messages">
      ${bubbles}
    </div>
    <div class="footer">Conversation générée le 9 juin 2026 · Livraison Rapide OUAGA &amp; BOBO · Claude Sonnet 4.6</div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML écrit :', htmlPath);

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromeExe}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${htmlPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n✅ PDF généré :', pdfPath);
} catch (err) {
  console.error('Erreur Chrome:', err.message);
  process.exit(1);
}
