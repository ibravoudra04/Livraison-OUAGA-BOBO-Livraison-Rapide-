import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );
};

const getGoogleAI = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder_key' });
};

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const ai = getGoogleAI();
  try {
    const { imageBase64, montantAttendu, userId } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, message: "Image manquante" }, { status: 400 });
    }

    // 1. Appeler Gemini pour extraire les informations de l'image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
              }
            },
            {
              text: "Tu es un agent de vérification de reçus de paiement Orange Money pour le Burkina Faso. Analyse cette capture d'écran. Extrais les informations suivantes au format JSON : `is_orange_money` (boolean : est-ce un vrai format de SMS Orange Money ?), `transaction_id` (string : ex: CI260607...), `montant` (number). Si l'image n'est pas un reçu Orange Money, renvoie `is_orange_money: false`."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      return NextResponse.json({ success: false, message: "Erreur d'analyse de l'IA" }, { status: 500 });
    }

    const dataIA = JSON.parse(response.text);

    // 2. Vérification mathématique (Regex + Montant)
    if (!dataIA.is_orange_money) {
      return NextResponse.json({ success: false, message: "Reçu non validé. Après vérification, cette image ne correspond pas à un SMS de confirmation Orange Money valide. Veuillez uploader la capture d'écran originale du SMS reçu après votre paiement." }, { status: 400 });
    }

    if (dataIA.montant < montantAttendu) {
      return NextResponse.json({ success: false, message: `Vérification échouée. Le montant identifié est insuffisant (Attendu : ${montantAttendu} FCFA, Trouvé : ${dataIA.montant} FCFA).` }, { status: 400 });
    }

    if (!dataIA.transaction_id) {
      return NextResponse.json({ success: false, message: "Reçu non validé. Impossible de lire l'identifiant unique de la transaction. Veuillez vous assurer que la capture d'écran est nette et lisible." }, { status: 400 });
    }

    // Regex basique pour Orange Money BF (ex: commence par 2 lettres, puis des chiffres/lettres)
    const txRegex = /^[A-Z]{2}[0-9A-Z.]+$/i;
    if (!txRegex.test(dataIA.transaction_id) || dataIA.transaction_id.length < 10) {
       return NextResponse.json({ success: false, message: "Reçu non validé. Le format de la référence de transaction extrait semble incorrect. Veuillez uploader la capture d'écran originale du SMS." }, { status: 400 });
    }

    // 3. Upload de l'image sur Supabase Storage (optionnel pour l'admin)
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const fileName = `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recus-paiements')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    let imageUrl = '';
    if (!uploadError && uploadData) {
       const { data: publicUrlData } = supabase.storage.from('recus-paiements').getPublicUrl(fileName);
       imageUrl = publicUrlData.publicUrl;
    }

    // 4. Anti-fraude : Vérifier si l'ID a déjà été utilisé
    const { data: transactionExistante } = await supabase
      .from('paiements')
      .select('transaction_id')
      .eq('transaction_id', dataIA.transaction_id)
      .single();

    if (transactionExistante) {
      return NextResponse.json({ success: false, message: "Reçu rejeté. Ce reçu de paiement a déjà été enregistré et validé pour un autre déblocage." }, { status: 400 });
    }

    // 5. Enregistrer le paiement validé
    const { error: insertError } = await supabase.from('paiements').insert([
      { 
        transaction_id: dataIA.transaction_id, 
        montant: dataIA.montant, 
        statut: 'VALIDE',
        image_url: imageUrl,
        client_id: userId || null
      }
    ]);

    if (insertError) {
      return NextResponse.json({ success: false, message: "Erreur lors de l'enregistrement du paiement." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Paiement validé avec succès !", data: dataIA });

  } catch (error: any) {
    console.error("API Payment Error:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la vérification." }, { status: 500 });
  }
}
