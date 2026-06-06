import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export function useDriverOnboarding() {
  const { supabase, formatPhoneForDB } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('identities')
      .upload(path, file);
    
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
      const phoneNormalized = formatPhoneForDB(formData.phone);
      const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
      const securePassword = formData.pin.length < 6 ? formData.pin + "_secure_pad" : formData.pin;

      // Create auth user
      let { data: authData, error: authError } = await supabase.auth.signUp({
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
      });

      // If user already exists but onboarding failed previously, try logging them in
      if (authError && authError.message.toLowerCase().includes('already registered')) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: securePassword,
        });
        
        if (loginError) throw new Error("Ce numéro est déjà inscrit. Vérifiez votre mot de passe secret ou contactez le support.");
        
        authData = loginData;
        authError = null;
      }

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erreur de création de profil");

      // Upload files if provided
      const updatePayload: any = {};
      
      if (formData.cniRecto) {
        updatePayload.cni_recto = await uploadDocument(formData.cniRecto, `${userId}/cni_recto_${Date.now()}`);
      }
      if (formData.cniVerso) {
        updatePayload.cni_verso = await uploadDocument(formData.cniVerso, `${userId}/cni_verso_${Date.now()}`);
      }
      if (formData.selfie) {
        updatePayload.selfie = await uploadDocument(formData.selfie, `${userId}/selfie_${Date.now()}`);
      }

      // If we have files, update the livreurs profile created by the trigger
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from('livreurs')
          .update(updatePayload)
          .eq('id', userId);
          
        if (updateError) console.error("Could not link documents:", updateError);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { registerDriver, loading, error };
}
