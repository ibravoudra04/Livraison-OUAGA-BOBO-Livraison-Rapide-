import React, { useState, useRef, useEffect } from 'react';
import Drawer from '@/components/Drawer/Drawer';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { createClient } from '@/utils/supabase/client';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  riderId: string;
  clientId: string;
  currentRole: 'client' | 'rider';
  otherPartyName: string;
}

const SUPABASE_HOSTNAME = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname; } catch { return ''; }
})();

const isSafeMediaUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return hostname === SUPABASE_HOSTNAME || hostname.endsWith('.supabase.co');
  } catch { return false; }
};

export default function ChatDrawer({ isOpen, onClose, riderId, clientId, currentRole, otherPartyName }: ChatDrawerProps) {
  const { messages, loading, error: chatError, sendMessage } = useChatRealtime(riderId, clientId, currentRole);
  const [inputText, setInputText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !uploadingImage) return;
    
    await sendMessage(inputText.trim());
    setInputText("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${clientId}_${riderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      await sendMessage(null, publicUrlData.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors du téléchargement du fichier.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLocationShare = () => {
    if (navigator.geolocation) {
      setUploadingImage(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const text = `📍 Ma position actuelle :\nhttps://maps.google.com/?q=${lat},${lng}`;
          await sendMessage(text);
          setUploadingImage(false);
          setShowAttachMenu(false);
        },
        (error) => {
          alert("Erreur lors de la géolocalisation.");
          setUploadingImage(false);
          setShowAttachMenu(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre appareil.");
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: isOpen ? 'translate(-50%, 0)' : 'translate(-50%, 120%)',
        width: '100%',
        maxWidth: '480px',
        height: '85vh',
        backgroundColor: '#EAE8E3',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header personnalisé */}
      <div style={{ padding: '20px 20px 10px 20px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            border: '1px solid rgba(0,0,0,0.1)', 
            backgroundColor: 'rgba(0,0,0,0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.85rem', 
            fontWeight: 'bold',
            color: 'var(--color-charcoal)',
            cursor: 'pointer'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Retour
        </button>
        
        <h2 style={{ textAlign: 'center', margin: 0, fontSize: '1.4rem', color: '#8D5537', fontWeight: 800 }}>Discussion</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
          <div style={{ 
            width: '45px', 
            height: '45px', 
            backgroundColor: '#F5F2EC', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4B3A70" stroke="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#3A2E28', fontWeight: 700 }}>{otherPartyName}</h3>
            <span style={{ fontSize: '0.85rem', color: '#27AE60', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#27AE60', borderRadius: '50%', display: 'inline-block' }}></span>
              En ligne
            </span>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ 
          alignSelf: 'center', 
          backgroundColor: '#DCD9D2', 
          color: '#5B4E47', 
          fontSize: '0.8rem', 
          padding: '10px 20px', 
          borderRadius: '12px', 
          textAlign: 'center',
          maxWidth: '85%',
          lineHeight: '1.4'
        }}>
          <em>Début de votre discussion sécurisée<br/>avec <strong>{otherPartyName}</strong>.</em>
        </div>
        
        {loading && <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-charcoal-light)' }}>Chargement des messages...</div>}
        {chatError && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'white', backgroundColor: 'var(--color-primary-red)', padding: '8px', borderRadius: '12px' }}>
            Erreur: {chatError}
          </div>
        )}
        
        {messages.map((msg) => {
          const isMine = msg.sender === currentRole;
          return (
            <div key={msg.id} style={{
              alignSelf: isMine ? 'flex-end' : 'flex-start',
              backgroundColor: isMine ? '#8D5537' : '#FFFFFF',
              color: isMine ? 'white' : '#3A2E28',
              padding: '12px 16px',
              borderRadius: '20px',
              borderBottomRightRadius: isMine ? '4px' : '20px',
              borderBottomLeftRadius: !isMine ? '4px' : '20px',
              maxWidth: '85%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              fontSize: '0.95rem'
            }}>
              {msg.image_url && isSafeMediaUrl(msg.image_url) && (
                <div style={{ marginBottom: '8px' }}>
                  {msg.image_url.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i) ? (
                    <img src={msg.image_url} alt="Photo" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                  ) : (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', color: 'inherit', textDecoration: 'none' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      Fichier joint
                    </a>
                  )}
                </div>
              )}
              {msg.text && <div style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</div>}
              <div style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : '#9D8E87', textAlign: 'right', marginTop: '6px' }}>
                {msg.time}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div style={{ padding: '15px 20px', paddingBottom: '30px', position: 'relative' }}>
        
        {/* Menu des pièces jointes */}
        {showAttachMenu && (
          <div style={{ 
            position: 'absolute', 
            bottom: '70px', 
            left: '20px', 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(14px)',
            borderRadius: '16px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
            padding: '10px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px', 
            zIndex: 10,
            border: '1px solid rgba(0,0,0,0.05)',
            animation: 'fadeInUp 0.2s ease-out'
          }}>
            <button type="button" onClick={() => { setShowAttachMenu(false); photoInputRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', transition: 'background 0.2s', fontWeight: 600, color: 'var(--color-charcoal)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
              <div style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>
              Prendre une photo
            </button>
            <button type="button" onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', transition: 'background 0.2s', fontWeight: 600, color: 'var(--color-charcoal)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
              <div style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
              Envoyer un fichier
            </button>
            <button type="button" onClick={handleLocationShare} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '10px', transition: 'background 0.2s', fontWeight: 600, color: 'var(--color-charcoal)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
              <div style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
              Partager ma position
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center', 
          backgroundColor: '#FFFFFF', 
          padding: '8px 12px 8px 16px', 
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          {/* File input normal */}
          <input 
            type="file" 
            accept="*/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageUpload} 
          />
          {/* File input photo capture */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={photoInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageUpload} 
          />
          
          <button 
            type="button" 
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={uploadingImage}
            style={{ background: 'none', border: 'none', cursor: uploadingImage ? 'wait' : 'pointer', color: '#8D5537', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          </button>
          
          <input 
            type="text" 
            placeholder="Écrivez un message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '1rem', color: '#3A2E28' }}
          />
          
          <button 
            type="submit" 
            disabled={(!inputText.trim() && !uploadingImage)}
            style={{ 
              background: inputText.trim() ? 'linear-gradient(135deg, #27AE60 0%, #1e8e3e 100%)' : '#C7BDB6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              width: '45px', 
              height: '45px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: inputText.trim() ? 'scale(1.05)' : 'scale(1)',
              boxShadow: inputText.trim() ? '0 5px 15px rgba(39, 174, 96, 0.4)' : 'none',
              marginLeft: '6px'
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-2px) translateY(1px)' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
