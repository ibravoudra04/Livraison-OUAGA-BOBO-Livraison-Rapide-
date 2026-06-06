import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface ChatMessage {
  id: string;
  rider_id: string;
  client_id: string;
  sender: 'client' | 'rider';
  text: string | null;
  image_url?: string | null;
  time: string;
  created_at: string;
}

export function useChatRealtime(riderId?: string, clientId?: string, currentRole?: 'client' | 'rider') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!riderId || !clientId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('chats_livraison')
        .select('*')
        .eq('rider_id', riderId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channelName = `chat_${riderId}_${clientId}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats_livraison',
          filter: `rider_id=eq.${riderId}`, // Cannot apply multiple filters easily in realtime URL
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage.client_id === clientId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, clientId, supabase]);

  const sendMessage = async (text: string | null, imageUrl: string | null = null) => {
    if (!riderId || !clientId || !currentRole) return null;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { data, error: sendError } = await supabase
      .from('chats_livraison')
      .insert([
        {
          rider_id: riderId,
          client_id: clientId,
          sender: currentRole,
          text,
          image_url: imageUrl,
          time
        }
      ])
      .select()
      .single();

    if (sendError) {
      setError(sendError.message);
      return null;
    }

    // Déclenchement de la notification Push pour le destinataire
    try {
      const recipientId = currentRole === 'client' ? riderId : clientId;
      const title = currentRole === 'client' ? 'Nouveau message Client' : 'Nouveau message Livreur';
      const pushMessage = text ? text : (imageUrl ? 'Fichier joint' : 'Nouveau message');
      
      fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, title, message: pushMessage, url: '/' })
      }).catch(err => console.error("Erreur d'appel push API:", err));
    } catch (e) {
      console.error("Erreur lors de l'envoi de la notification push:", e);
    }

    // Optionally optimistic update is handled by the insert returning data or realtime
    return data;
  };

  return { messages, loading, error, sendMessage };
}
