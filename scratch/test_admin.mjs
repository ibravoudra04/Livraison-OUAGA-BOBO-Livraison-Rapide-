import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844}});const page=await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
// Connexion ADMIN (67 37 09 09 / 1234)
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000009');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000); await page.setViewportSize({width:1280,height:900}); await page.waitForTimeout(1500);
await page.screenshot({path:SHOT+'25_admin_overview.png'});
ok('Connexion admin => Espace Administration', await page.locator('text=/Espace Administration/i').count()>0);

// Vérifier les cartes de la vue globale
const cards = ['Gestion des Livreurs','Gestion des Clients','Candidatures en Attente','Discussions','Statistiques','Reçus de Paiement','Litiges'];
for(const c of cards){ ok('Carte "'+c+'" présente', await page.locator('text='+c).count()>0); }

// Onglet Candidatures en attente
await page.locator('text=Candidatures en Attente').first().click(); await page.waitForTimeout(2000);
await page.screenshot({path:SHOT+'26_admin_pending.png'});
const testCandidate = page.locator('text=/ZZ Livreur UI AUDIT|ZZ Test Livreur AUDIT/').first();
ok('Candidature de test visible', await testCandidate.count()>0);

// Ouvrir le dossier du candidat de test (UI driver = en attente)
if(await testCandidate.count()>0){
  await testCandidate.click(); await page.waitForTimeout(2000);
  await page.screenshot({path:SHOT+'27_admin_inspecteur.png'});
  ok('Inspecteur dossier ouvert (photos)', await page.locator('text=/Inspecteur|PIÈCES|PHOTO DE PROFIL/i').count()>0);
  // Valider la candidature de test
  const validBtn = page.locator('button:has-text("Valider la candidature")');
  if(await validBtn.count()>0){
    await validBtn.click(); await page.waitForTimeout(2500);
    await page.screenshot({path:SHOT+'28_admin_valide.png'});
    // Vérif base
    const {data:drv}=await admin.from('livreurs').select('status').eq('id',acc.uiDriverId).maybeSingle();
    ok('Candidature validée en base (statut actif)', drv?.status==='actif');
    console.log('   statut UI driver en base:', drv?.status);
  } else ok('Bouton Valider présent', false);
}

// Onglet Statistiques
await page.locator('button:has-text("Retour")').first().click().catch(()=>{}); await page.waitForTimeout(800);
await page.locator('button:has-text("Retour")').first().click().catch(()=>{}); await page.waitForTimeout(1500);
await page.locator('text=Statistiques Plateforme').first().click().catch(()=>{}); await page.waitForTimeout(2000);
await page.screenshot({path:SHOT+'29_admin_stats.png'});
ok('Onglet Statistiques affiche des métriques', await page.locator('text=/Revenus|Déblocages|Nouveaux Livreurs/i').count()>0);

console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error/i.test(l)).slice(0,8).join('\n'));
await browser.close();
console.log('\n=== RESUME ADMIN ===\n'+R.join('\n'));
