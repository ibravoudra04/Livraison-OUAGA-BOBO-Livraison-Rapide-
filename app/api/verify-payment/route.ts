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
              text: "Tu es un agent de vérification de reçus de paiement Orange Money pour le Burkina Faso.\n" +
                    "Analyse cette capture d'écran (qui peut être un SMS, un pop-up USSD sur l'écran d'appel, ou une confirmation d'application).\n" +
                    "Le destinataire de l'argent doit impérativement être 'OUEDRAOGO IBRAHIM' (ou 'IBRAHIM', ou 'IBRAHIM OUEDRAOGO', ou le numéro de téléphone '67370909' / '67 37 09 09').\n\n" +
                    "ATTENTION IMPORTANTE :\n" +
                    "1. Les pop-ups USSD de confirmation de transfert s'affichent souvent par-dessus un clavier de numérotation téléphonique (clavier de numérotation en arrière-plan). Ces images sont TOUT À FAIT VALIDES. Ne les rejette pas sous prétexte qu'il y a un clavier visible en arrière-plan. Si le pop-up indique que le transfert a réussi (ex: 'Cher client, vous avez transfere...') et contient un ID de transaction (ex: 'ID Trans : PP...'), tu dois la valider (is_orange_money = true).\n" +
                    "2. En revanche, un écran de SAISIE DE CODE PIN (où l'utilisateur doit taper son code secret, par exemple avec un message 'Veuillez entrer votre code secret pour confirmer le transfert' ou 'Enter PIN:') est INVALIDE (is_orange_money = false) car le paiement n'est pas encore effectué et aucun ID de transaction n'est généré.\n" +
                    "3. S'il s'agit d'une capture d'un fil de discussion SMS ou d'un historique de transactions contenant plusieurs messages successifs, tu dois impérativement identifier le MESSAGE LE PLUS RÉCENT (qui est situé tout en bas de la capture d'écran). Extrais uniquement les informations de ce DERNIER message (en bas) et ignore tous les messages plus anciens situés plus haut dans la capture.\n\n" +
                    "Voici des exemples pour t'entraîner :\n" +
                    "- Exemple 1 (SMS valide) :\n" +
                    "  Texte : 'Cher client, vous avez transfere 200.00 FCFA au numero 67370909,IBRAHIM. Votre solde est de... ID Trans: PP260608.1929.19338345.'\n" +
                    "  Résultat attendu : { \"is_orange_money\": true, \"transaction_id\": \"PP260608.1929.19338345\", \"montant\": 200 }\n" +
                    "- Exemple 2 (Pop-up USSD valide sur fond de clavier) :\n" +
                    "  Texte : L'image montre le clavier de numérotation d'un téléphone, mais au premier plan il y a un pop-up disant 'Cher client, vous avez transfere 200 FCFA au numero 67370909 IBRAHIM OUEDRAOGO ID Trans : PP260608.1554.45366665' avec un bouton OK.\n" +
                    "  Résultat attendu : { \"is_orange_money\": true, \"transaction_id\": \"PP260608.1554.45366665\", \"montant\": 200 }\n" +
                    "- Exemple 3 (Invalide - Écran de saisie du PIN secret) :\n" +
                    "  Texte : L'image montre un clavier et une invite de saisie du code PIN Orange Money (ex: 'Entrer code secret' ou 'Veuillez entrer votre code PIN de 4 chiffres pour confirmer le transfert de 200 FCFA vers 67370909'). Aucun ID de transaction n'est présent.\n" +
                    "  Résultat attendu : { \"is_orange_money\": false, \"transaction_id\": null, \"montant\": null }\n" +
                    "- Exemple 4 (Fil de discussion SMS / Historique contenant plusieurs messages) :\n" +
                    "  Texte : L'image montre une conversation SMS avec OrangeMoney affichant deux messages successifs :\n" +
                    "    - Message du haut (ancien) : 'Cher client, vous avez transfere 20,000.00 FCFA au numero 67370909,IBRAHIM. ID Trans: PP260608.1458.19309166.'\n" +
                    "    - Message du bas (le plus récent) : 'Cher client, vous avez transfere 200.00 FCFA au numero 67370909,IBRAHIM. ID Trans: PP260608.1929.19338345.'\n" +
                    "  Résultat attendu : { \"is_orange_money\": true, \"transaction_id\": \"PP260608.1929.19338345\", \"montant\": 200 }\n\n" +
                    "Extrais les informations suivantes au format JSON :\n" +
                    "{\n" +
                    "  \"is_orange_money\": true (si c'est un reçu ou confirmation Orange Money BF valide envoyé à OUEDRAOGO IBRAHIM / 67370909, sinon false),\n" +
                    "  \"transaction_id\": \"ID de transaction brut extrait (ex: PP260608.1554.45366665 - extrais UNIQUEMENT le code lui-même sans labels comme 'ID Trans' ni colons/espaces)\",\n" +
                    "  \"montant\": montant transféré en nombre (ex: 200)\n" +
                    "}\n" +
                    "Si le destinataire ou le numéro de réception ne correspond pas à OUEDRAOGO IBRAHIM / 67370909, ou si l'image n'est pas une confirmation de transfert finalisée (comme le dernier SMS du fil), renvoie is_orange_money: false."
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

    // Nettoyage robuste de l'ID de transaction (suppression des préfixes éventuels comme "ID Trans:", ":" et espaces)
    let cleanTxId = dataIA.transaction_id.trim();
    // Recherche un motif standard de transaction Orange Money : commence par 2 lettres (ex: PP), suivi de chiffres/lettres/points
    const txMatch = cleanTxId.match(/[A-Z]{2}[0-9A-Z.]+/i);
    if (txMatch) {
      cleanTxId = txMatch[0];
    }

    // Regex basique pour Orange Money BF (ex: commence par 2 lettres, puis des chiffres/lettres)
    const txRegex = /^[A-Z]{2}[0-9A-Z.]+$/i;
    if (!txRegex.test(cleanTxId) || cleanTxId.length < 10) {
       return NextResponse.json({ success: false, message: "Reçu non validé. Le format de la référence de transaction extrait semble incorrect. Veuillez uploader la capture d'écran originale du SMS." }, { status: 400 });
    }

    // Assigner l'ID nettoyé
    dataIA.transaction_id = cleanTxId;

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
