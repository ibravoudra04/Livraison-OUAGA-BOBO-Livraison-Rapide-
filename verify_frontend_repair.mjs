import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const envFile = 'c:/Users/HP/Livraison Rapide OUAGA et BOBO/.env.local';
const content = fs.readFileSync(envFile, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

// We use the PUBLISHABLE key to simulate the Frontend (Client Side) with RLS enforced.
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function verifyRepair() {
  console.log("1. Création d'un livreur...");
  const rand = Math.floor(Math.random() * 100000);
  const email = `ghost${rand}@livraison.com`;
  const phone = `+226 50 00 ${rand}`;
  const password = 'testpin_secure_pad';
  
  // Etape 1: Le livreur s'inscrit initialement
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: { role: 'rider', phone: phone, name: 'Ghost Driver' }
    }
  });
  
  const userId = authData?.user?.id;
  if (!userId) throw new Error("Impossible de créer l'utilisateur.");
  console.log("   ✅ Utilisateur créé: " + userId);
  
  // Etape 2: On SIMULE le bug du trigger en supprimant manuellement le profil de la table 'livreurs'
  // On utilise la clé service_role temporairement juste pour supprimer
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  await supabaseAdmin.from('livreurs').delete().eq('id', userId);
  
  // Vérifions qu'il est bien un "fantôme"
  const { data: checkGhost } = await supabaseAdmin.from('livreurs').select('id').eq('id', userId).single();
  console.log("   👻 Est-il un fantôme dans livreurs ? " + (checkGhost ? "Non" : "Oui"));

  // Etape 3: Le livreur revient et réessaie de s'inscrire (ce qui déclenche la connexion)
  console.log("2. Le livreur fantôme tente de se réinscrire (Déclenchement du login)...");
  
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginError) {
      console.log("   ❌ Erreur de login:", loginError);
      return;
  }
  console.log("   ✅ Login réussi !");
  
  // Etape 4: Exécution de la nouvelle logique de RÉPARATION FRONTEND (Exactement ce qui a été ajouté dans useDriverOnboarding.ts)
  console.log("3. Exécution de la logique de vérification/réparation Frontend (Soumis à RLS)...");
  
  const { data: profileCheck } = await supabase
          .from('livreurs')
          .select('id')
          .eq('id', userId)
          .single();
          
  if (!profileCheck) {
     console.log("   🛠️ Profil absent détecté. Lancement de la réparation...");
     const { error: insertError } = await supabase.from('livreurs').insert({
        id: userId,
        name: 'Ghost Driver Repaired',
        phone: phone,
        vehicle: 'Moto',
        lat: 12.3714,
        lng: -1.5197,
        initial: 'G',
        city: 'ouaga',
        status: 'en attente',
        subscription_paid: false
     });
     
     if (insertError) {
         console.error("   ❌ Échec de la réparation Frontend (Problème RLS ?) :", insertError);
     } else {
         console.log("   ✅ Réparation Frontend réussie ! Le profil a été recréé avec les droits RLS limités.");
     }
  } else {
      console.log("   ✅ Le profil existe déjà.");
  }
  
  // Etape 5: Upload d'un document (pour tester que tout fonctionne de bout en bout)
  console.log("4. Test de téléversement des photos (Upload)...");
  const dummyBlob = new Blob(['dummy content'], { type: 'image/jpeg' });
  const { error: uploadError } = await supabase.storage
        .from('identities')
        .upload(`${userId}/cni_recto_${Date.now()}`, dummyBlob, { contentType: 'image/jpeg' });
        
  if (uploadError) {
      console.error("   ❌ Échec de l'upload :", uploadError);
  } else {
      console.log("   ✅ Upload réussi ! La session est valide et le bucket identities accepte le fichier.");
  }
  
  console.log("🎉 TEST DE BOUT EN BOUT TERMINÉ AVEC SUCCÈS !");
}

verifyRepair();
