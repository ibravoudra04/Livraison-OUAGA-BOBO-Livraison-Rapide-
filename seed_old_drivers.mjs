import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local variables manually since this is a Node script
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'xxx';

if (!SUPABASE_URL.startsWith('http') || SUPABASE_KEY === 'xxx') {
  // If not injected by environment, try to read from .env.local
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        const value = values.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') process.env.NEXT_PUBLIC_SUPABASE_URL = value;
        if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = value;
      }
    });
  } catch (e) {
    console.warn("⚠️ Impossible de lire .env.local", e.message);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ ERREUR: Variables d'environnement Supabase introuvables");
  process.exit(1);
}

const supabase = createClient(url, key);

async function restoreOldDrivers() {
  console.log("🚀 Lancement de la restauration des anciens livreurs...");
  
  try {
    const rawData = fs.readFileSync('livreurs_data.json', 'utf8');
    const oldDrivers = JSON.parse(rawData);
    
    for (const driver of oldDrivers) {
      // Extract the raw phone from phone_display (e.g. "+226 54 59 41 04" -> "54 59 41 04")
      const rawPhone = driver.phone_display ? driver.phone_display.replace('+226', '').trim() : '00 00 00 00';
      const cleanPhone = rawPhone.replace(/\s+/g, '');
      const email = `226${cleanPhone}@livraison.com`;
      
      console.log(`\nRe-création du profil: ${driver.name} (${rawPhone})...`);
      
      // Déconnexion préalable au cas où
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: "1234_secure_pad", // Standard password/PIN
        options: {
          data: {
            role: "rider",
            name: driver.name,
            phone: cleanPhone,
            vehicle: driver.vehicle,
            city: driver.city,
            initial: driver.initial,
            lat: driver.lat,
            lng: driver.lng,
            status: driver.status,
            subscription_paid: driver.subscription_paid,
            selfie: driver.selfie // This will restore their photo!
          }
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          console.log(`✅ Le profil ${driver.name} a déjà été migré.`);
        } else {
          console.error(`❌ Erreur pour ${driver.name}:`, error.message);
        }
      } else {
        console.log(`✅ Profil ${driver.name} restauré avec succès (Nouvel ID: ${data.user?.id})`);
      }
    }
    
    console.log("\n🎉 Restauration des anciens livreurs terminée !");
    
  } catch (err) {
    console.error("❌ Erreur de lecture ou de restauration :", err.message);
  }
}

restoreOldDrivers();
