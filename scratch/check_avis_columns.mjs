import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
// Simule la requête de la RPC get_my_chat_clients pour un vrai livreur ayant une conversation
const {data:chat}=await admin.from('chats_livraison').select('rider_id,client_id').limit(1).maybeSingle();
if(!chat){ console.log('Aucune conversation réelle pour tester.'); process.exit(0); }
console.log('Conversation réelle: rider', chat.rider_id?.substring(0,8), '<-> client', chat.client_id?.substring(0,8));
// La logique de la fonction : DISTINCT c.id, c.name FROM clients JOIN chats ON client_id WHERE rider_id = <rider>
const {data:join}=await admin.from('chats_livraison').select('client_id, clients_livraison(id,name)').eq('rider_id',chat.rider_id);
const names=[...new Map((join||[]).filter(j=>j.clients_livraison).map(j=>[j.clients_livraison.id, j.clients_livraison.name])).values()];
console.log('Noms que la fonction renverra à ce livreur:', JSON.stringify(names));
console.log(names.length>0 && names[0] ? '✅ La fonction renverra bien le NOM du client (et pas "Client")' : '⚠️ Nom vide (le client n a peut-être pas de nom)');
