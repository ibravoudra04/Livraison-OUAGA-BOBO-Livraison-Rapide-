// AUDIT LECTURE SEULE de la base Supabase — Phase 1
// N'écrit RIEN. Compte les lignes, échantillonne, teste l'isolation RLS.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const g = (k) => { const m = env.match(new RegExp(k + '=(.+)')); return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null; };
const url = g('NEXT_PUBLIC_SUPABASE_URL');
const anon = g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const service = g('SUPABASE_SERVICE_ROLE_KEY');

const admin = createClient(url, service, { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });

const TABLES = ['clients_livraison', 'livreurs', 'deblocages', 'avis', 'chats_livraison', 'annonces', 'tickets_support', 'paiements', 'push_subscriptions'];

async function main() {
  console.log('=== 1. NOMBRE DE LIGNES PAR TABLE (service role) ===');
  for (const t of TABLES) {
    const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t.padEnd(22)} : ${error ? 'ERREUR ' + error.message : count + ' lignes'}`);
  }

  console.log('\n=== 2. COLONNES RÉELLES (échantillon 1 ligne) ===');
  for (const t of TABLES) {
    const { data, error } = await admin.from(t).select('*').limit(1);
    if (error) { console.log(`${t}: ERREUR ${error.message}`); continue; }
    console.log(`${t}: ${data && data[0] ? Object.keys(data[0]).join(', ') : '(vide)'}`);
  }

  console.log('\n=== 3. TABLE avis : structure réelle (rating vs stars) ===');
  const { data: avisSample } = await admin.from('avis').select('*').limit(3);
  console.log(JSON.stringify(avisSample, null, 2));

  console.log('\n=== 4. STATUTS DES LIVREURS ===');
  const { data: livs } = await admin.from('livreurs').select('status, city, subscription_paid, contacts_count, is_verified');
  if (livs) {
    const byStatus = {};
    const byCity = {};
    for (const l of livs) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      byCity[l.city] = (byCity[l.city] || 0) + 1;
    }
    console.log('Par statut :', byStatus);
    console.log('Par ville  :', byCity);
    console.log('Vérifiés   :', livs.filter(l => l.is_verified).length);
    console.log('Abonnés payés :', livs.filter(l => l.subscription_paid).length);
  }

  console.log('\n=== 5. TEST ISOLATION RLS (client anonyme/non connecté) ===');
  for (const t of TABLES) {
    const { data, error, count } = await pub.from(t).select('*', { count: 'exact', head: true });
    console.log(`anon lecture ${t.padEnd(22)} : ${error ? 'BLOQUÉ (' + error.code + ')' : (count || 0) + ' lignes visibles'}`);
  }

  console.log('\n=== 6. VUE livreurs_view (anon) — fuite du téléphone ? ===');
  const { data: vAnon, error: vErr } = await pub.from('livreurs_view').select('name, phone_display, is_unlocked').limit(5);
  console.log('Erreur:', vErr?.message || 'aucune');
  console.log(JSON.stringify(vAnon, null, 2));

  console.log('\n=== 7. Colonne brute phone exposée par la vue ? ===');
  const { error: phoneErr } = await pub.from('livreurs_view').select('phone').limit(1);
  console.log('Tentative SELECT phone sur la vue (anon):', phoneErr ? 'BLOQUÉ ✓' : 'EXPOSÉ ✗ !!!');
  const { data: rawPhone, error: rawErr } = await pub.from('livreurs').select('phone').limit(1);
  console.log('Tentative SELECT phone sur table livreurs (anon):', rawErr ? 'BLOQUÉ ✓ (' + rawErr.code + ')' : 'EXPOSÉ ✗ -> ' + JSON.stringify(rawPhone));

  console.log('\n=== 8. Paiements : doublons transaction_id ? ===');
  const { data: pays } = await admin.from('paiements').select('transaction_id, montant, statut, client_id, created_at');
  if (pays) {
    console.log('Total paiements:', pays.length);
    const ids = pays.map(p => p.transaction_id);
    const dups = ids.filter((id, i) => id && ids.indexOf(id) !== i);
    console.log('Doublons transaction_id:', dups.length ? dups : 'aucun');
    console.log('Échantillon:', JSON.stringify(pays.slice(0, 3), null, 2));
  }

  console.log('\n=== 9. Cohérence : déblocages orphelins / chats orphelins ===');
  const { data: debl } = await admin.from('deblocages').select('client_id, rider_id');
  const { data: clientIds } = await admin.from('clients_livraison').select('id');
  const { data: riderIds } = await admin.from('livreurs').select('id');
  const cset = new Set((clientIds || []).map(c => c.id));
  const rset = new Set((riderIds || []).map(r => r.id));
  if (debl) {
    console.log('Déblocages avec client inexistant:', debl.filter(d => d.client_id && !cset.has(d.client_id)).length);
    console.log('Déblocages avec rider inexistant :', debl.filter(d => d.rider_id && !rset.has(d.rider_id)).length);
  }

  console.log('\n=== 10. Utilisateurs auth : rôles & métadonnées admin ===');
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authUsers) {
    const roles = {};
    let adminCount = 0;
    for (const u of authUsers.users) {
      const r = u.user_metadata?.role || 'inconnu';
      roles[r] = (roles[r] || 0) + 1;
      if (u.app_metadata?.role === 'admin') adminCount++;
    }
    console.log('Total users auth:', authUsers.users.length);
    console.log('Rôles (user_metadata):', roles);
    console.log('Admins (app_metadata.role=admin):', adminCount);
    const adminUser = authUsers.users.find(u => u.app_metadata?.role === 'admin');
    if (adminUser) console.log('Compte admin:', adminUser.email, '| app_metadata:', JSON.stringify(adminUser.app_metadata));
  }
}

main().catch(e => { console.error('ECHEC AUDIT:', e); process.exit(1); });
