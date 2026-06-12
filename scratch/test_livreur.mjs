import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const PHONE='09000003'; const EMAIL='22609000003@livraison.com'; // 3e compte test (livreur via UI)
const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},
  geolocation:{latitude:12.37,longitude:-1.52},permissions:['geolocation']});
const page=await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);

// Ouvrir "Devenir livreur"
await page.locator('text=Devenir livreur').click(); await page.waitForTimeout(1500);
await page.screenshot({path:SHOT+'18_livreur_inscription.png'});
ok('Formulaire inscription livreur ouvert', await page.locator('text=/Rejoindre|Nom complet|Documents de vérification/i').count()>0);

// Remplir le formulaire
await page.locator('input[name="name"]').fill('ZZ Livreur UI AUDIT');
await page.locator('input[name="phone"]').fill(PHONE);
await page.locator('input[name="pin"]').fill('1234');
// Véhicule Moto déjà sélectionné par défaut
// Géolocalisation
await page.locator('button:has-text("Me géolocaliser")').click().catch(()=>{}); await page.waitForTimeout(2500);
await page.screenshot({path:SHOT+'19_livreur_geoloc.png'});
const geoOk = await page.locator('text=/Position enregistrée/i').count();
ok('Géolocalisation enregistrée', geoOk>0);

// Uploader les 3 documents
const inputs = page.locator('.file-upload-grid input[type="file"]');
const nInputs = await inputs.count();
console.log('   champs upload trouvés:', nInputs);
for(let i=0;i<Math.min(nInputs,3);i++){ await inputs.nth(i).setInputFiles('scratch/fake_cni.jpg'); await page.waitForTimeout(400); }
await page.screenshot({path:SHOT+'20_livreur_docs.png'});

// Soumettre
await page.locator('button:has-text("Soumettre mon inscription")').click();
// attendre la fin (le bouton repasse de "Inscription en cours" à autre chose / succès)
await page.waitForTimeout(8000);
await page.screenshot({path:SHOT+'21_livreur_resultat.png'});
const bodyTxt = await page.locator('body').innerText();
console.log('   Texte après soumission (extrait):', bodyTxt.replace(/\n+/g,' ').substring(0,200));

// Vérif en base
await new Promise(r=>setTimeout(r,1500));
const {data:drv}=await admin.from('livreurs').select('id,name,status,city,cni_recto,selfie,lat,lng').eq('id',(await getId())).maybeSingle();
async function getId(){ const {data}=await admin.auth.admin.listUsers({perPage:1000}); const u=data.users.find(x=>x.email===EMAIL); return u?.id; }
ok('Compte livreur créé en base', !!drv);
if(drv){
  console.log('   ', JSON.stringify(drv));
  ok('Statut = en attente', drv.status==='en attente');
  ok('Documents (selfie/cni) liés', !!(drv.selfie||drv.cni_recto));
}

fs.writeFileSync('scratch/_livreur_logs.txt',logs.join('\n'));
console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error|RLS|policy/i.test(l)).slice(0,8).join('\n'));
// enregistrer pour nettoyage
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
if(drv && !acc.ids.includes(drv.id)){ acc.ids.push(drv.id); acc.emails.push(EMAIL); acc.uiDriverId=drv.id; fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2)); }
await browser.close();
console.log('\n=== RESUME LIVREUR ===\n'+R.join('\n'));
