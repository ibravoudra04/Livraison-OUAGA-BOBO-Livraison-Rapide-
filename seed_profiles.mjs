import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERREUR: Variables d'environnement Supabase introuvables dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const profiles = [
  {
    name: "Administrateur",
    phone: "67 37 09 09",
    email: "22667370909@livraison.com",
    password: "12345678",
    role: "client" // Sera mis à jour en 'admin' via SQL
  },
  {
    name: "Client Premium",
    phone: "70 99 99 99",
    email: "22670999999@livraison.com",
    password: "1234_secure_pad", // Comme défini dans sanitizePassword pour les PINs courts
    role: "client"
  },
  {
    name: "Souleymane Barry",
    phone: "76 45 82 10",
    email: "22676458210@livraison.com",
    password: "1234_secure_pad",
    role: "rider",
    meta: {
      vehicle: "Moto",
      city: "ouaga",
      initial: "SB",
      lat: 12.3714,
      lng: -1.5197
    }
  }
];

async function seedProfiles() {
  console.log("🚀 Lancement de la mise en place des profils...");
  
  for (const profile of profiles) {
    console.log(`\nCréation du profil: ${profile.name} (${profile.phone})...`);
    
    // Déconnexion préalable au cas où
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.signUp({
      email: profile.email,
      password: profile.password,
      options: {
        data: {
          role: profile.role,
          name: profile.name,
          phone: profile.phone.replace(/\s+/g, ''),
          ...profile.meta
        }
      }
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`✅ Le profil ${profile.name} existe déjà.`);
      } else {
        console.error(`❌ Erreur pour ${profile.name}:`, error.message);
      }
    } else {
      console.log(`✅ Profil ${profile.name} créé avec succès (ID: ${data.user?.id})`);
    }
  }
  
  console.log("\n🎉 Mise en place terminée !");
}

seedProfiles();
