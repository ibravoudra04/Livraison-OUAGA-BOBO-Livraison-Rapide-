import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { compressImage } from '@/utils/compressImage';

// Sans timeout, une requête peut rester suspendue indéfiniment sur un réseau
// mobile instable et le livreur reste bloqué sur "Inscription en cours..."
const withTimeout = <T,>(promise: PromiseLike<T>, ms: number): Promise<T> =>
  Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("La connexion est trop lente ou instable. Vérifiez votre réseau (Wi-Fi ou données mobiles) puis réessayez.")), ms)
    ),
  ]);

export function useDriverOnboarding() {
  const { supabase, formatPhoneForDB } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (file: File, path: string) => {
    const compressed = await compressImage(file);
    const { error } = await withTimeout(
      supabase.storage.from('identities').upload(path, compressed, { contentType: 'image/jpeg' }),
      90000
    );

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('identities')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  };

  const registerDriver = async (formData: {
    name: string;
    phone: string;
    pin: string;
    vehicle: string;
    lat: number;
    lng: number;
    city?: string;
    cniRecto?: File;
    cniVerso?: File;
    selfie?: File;
  }) => {
    setLoading(true);
    setError(null);

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error("Pas de connexion internet. Activez vos données mobiles ou le Wi-Fi puis réessayez.");
      }

      const phoneNormalized = formatPhoneForDB(formData.phone);
      const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
      const securePassword = formData.pin.length < 6 ? formData.pin + "_secure_pad" : formData.pin;

      // Create auth user
      setProgress('Création de votre compte...');
      let { data: authData, error: authError } = await withTimeout(supabase.auth.signUp({
        email: virtualEmail,
        password: securePassword,
        options: {
          data: {
            role: 'rider',
            name: formData.name,
            phone: phoneNormalized,
            vehicle: formData.vehicle,
            lat: formData.lat,
            lng: formData.lng,
            initial: formData.name.charAt(0).toUpperCase(),
            city: formData.city || 'ouaga',
            status: 'en attente',
            subscription_paid: false
          }
        }
      }), 45000);

      // If user already exists but onboarding failed previously, try logging them in
      if (authError && authError.message.toLowerCase().includes('already registered')) {
        const { data: loginData, error: loginError } = await withTimeout(supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: securePassword,
        }), 45000);

        if (loginError) throw new Error("Ce numéro est déjà inscrit. Vérifiez votre mot de passe secret ou contactez le support.");

        if (loginData.user?.user_metadata?.role && loginData.user.user_metadata.role !== 'rider') {
          await supabase.auth.signOut();
          throw new Error("Ce numéro est déjà utilisé par un compte client. Utilisez un autre numéro pour devenir livreur.");
        }

        authData = loginData;
        authError = null;
      }

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erreur de création de profil");

      // Upload files if provided
      const updatePayload: any = {};

      if (formData.cniRecto) {
        setProgress('Envoi des documents (1/3)...');
        updatePayload.cni_recto = await uploadDocument(formData.cniRecto, `${userId}/cni_recto_${Date.now()}`);
      }
      if (formData.cniVerso) {
        setProgress('Envoi des documents (2/3)...');
        updatePayload.cni_verso = await uploadDocument(formData.cniVerso, `${userId}/cni_verso_${Date.now()}`);
      }
      if (formData.selfie) {
        setProgress('Envoi des documents (3/3)...');
        updatePayload.selfie = await uploadDocument(formData.selfie, `${userId}/selfie_${Date.now()}`);
      }

      // If we have files, update the livreurs profile created by the trigger
      if (Object.keys(updatePayload).length > 0) {
        setProgress('Finalisation...');
        const { error: updateError } = await withTimeout(
          supabase
            .from('livreurs')
            .update(updatePayload)
            .eq('id', userId),
          30000
        );

        if (updateError) console.error("Could not link documents:", updateError);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
      return { success: false, error: err };
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return { registerDriver, loading, progress, error };
}
