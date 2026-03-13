'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Paperclip, Mic, Image as ImageIcon, Play, Square, MessageSquare } from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'audio';
  created_at: string;
  read_at?: string | null;
}

interface ChatInterfaceProps {
  currentUser: { id: string; name: string };
  otherUser: { id: string; name: string; matchId?: string | null };
  onClose: () => void;
}

export default function ChatInterface({ currentUser, otherUser, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOnline, setIsOnline] = useState(false);

  const matchId = otherUser.matchId;

  useEffect(() => {
    if (!matchId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data);
        
        // Mark unread messages as read
        const unreadMessageIds = data
          .filter(msg => msg.sender_id !== currentUser.id && !msg.read_at)
          .map(msg => msg.id);
          
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessageIds);
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, async (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        
        // Mark as read if it's from the other user
        if (newMsg.sender_id !== currentUser.id) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id);
        }
      })
      .subscribe();

    // Presence for online status
    const presenceChannel = supabase.channel(`presence_${matchId}`, {
      config: { presence: { key: currentUser.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const otherUserOnline = Object.keys(state).some(key => key !== currentUser.id);
        setIsOnline(otherUserOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [matchId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() && !matchId) return;

    const contentPayload = {
      text: inputText.trim()
    };

    const newMessage = {
      match_id: matchId,
      sender_id: currentUser.id,
      content: JSON.stringify(contentPayload)
    };

    // Optimistic update
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { ...newMessage, id: tempId, created_at: new Date().toISOString() } as Message]);
    setInputText('');

    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !matchId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const mediaUrl = event.target?.result as string;
      
      const contentPayload = {
        text: '',
        mediaUrl,
        mediaType: 'image'
      };

      const newMessage = {
        match_id: matchId,
        sender_id: currentUser.id,
        content: JSON.stringify(contentPayload)
      };

      const tempId = Date.now().toString();
      setMessages((prev) => [...prev, { ...newMessage, id: tempId, created_at: new Date().toISOString() } as Message]);

      await supabase.from('messages').insert(newMessage);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (event) => {
          const mediaUrl = event.target?.result as string;
          
          const contentPayload = {
            text: '',
            mediaUrl,
            mediaType: 'audio'
          };

          const newMessage = {
            match_id: matchId,
            sender_id: currentUser.id,
            content: JSON.stringify(contentPayload)
          };

          const tempId = Date.now().toString();
          setMessages((prev) => [...prev, { ...newMessage, id: tempId, created_at: new Date().toISOString() } as Message]);

          await supabase.from('messages').insert(newMessage);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl h-[80vh] bg-white dark:bg-[#111] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-display text-xl uppercase">
              {otherUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-display text-xl uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
                {otherUser.name}
              </h3>
              {isOnline ? (
                <span className="font-mono text-[10px] text-green-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Offline</span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-white/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#0a0a0a]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-400" />
              <p className="font-mono text-xs uppercase tracking-widest text-gray-500">No messages yet</p>
              <p className="font-sans text-sm text-gray-400 mt-2">Say hi to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser.id;
              let parsedContent = { text: '', mediaUrl: '', mediaType: '' };
              try {
                parsedContent = JSON.parse(msg.content);
              } catch (e) {
                parsedContent.text = msg.content;
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] rounded-2xl p-3 ${
                      isMe 
                        ? 'bg-orange-500 text-white rounded-tr-sm' 
                        : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-tl-sm'
                    }`}
                  >
                    {parsedContent.mediaType === 'image' && parsedContent.mediaUrl && (
                      <img src={parsedContent.mediaUrl} alt="Shared media" className="max-w-full rounded-xl mb-2" />
                    )}
                    {parsedContent.mediaType === 'audio' && parsedContent.mediaUrl && (
                      <audio controls src={parsedContent.mediaUrl} className="max-w-full h-10 mb-2" />
                    )}
                    {parsedContent.text && <p className="font-sans text-sm whitespace-pre-wrap">{parsedContent.text}</p>}
                    <div className={`text-[10px] mt-1 font-mono opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
          {isRecording ? (
            <div className="flex items-center gap-4 bg-red-500/10 text-red-500 p-3 rounded-full border border-red-500/30">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-sm flex-1">Recording... {formatTime(recordingTime)}</span>
              <button 
                onClick={stopRecording}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none min-h-[48px] max-h-[120px] font-sans text-sm text-gray-900 dark:text-white"
                  rows={1}
                />
                <button 
                  onClick={startRecording}
                  className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
