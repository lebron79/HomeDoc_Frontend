import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Loader2, MessageCircle, User, Smile, Paperclip, X, Download, FileText, Image as ImageIcon } from 'lucide-react';

// Avatar mapping
const AVATAR_OPTIONS = [
  { id: 'avatar-1', seed: 'Felix' },
  { id: 'avatar-2', seed: 'Aneka' },
  { id: 'avatar-3', seed: 'Max' },
  { id: 'avatar-4', seed: 'Sophie' },
  { id: 'avatar-5', seed: 'Oliver' },
  { id: 'avatar-6', seed: 'Emma' },
  { id: 'avatar-7', seed: 'Jack' },
  { id: 'avatar-8', seed: 'Luna' },
  { id: 'avatar-9', seed: 'Leo' },
  { id: 'avatar-10', seed: 'Mia' },
  { id: 'avatar-11', seed: 'Noah' },
  { id: 'avatar-12', seed: 'Zoe' },
  { id: 'avatar-13', seed: 'Liam' },
  { id: 'avatar-14', seed: 'Olivia' },
  { id: 'avatar-15', seed: 'Ethan' },
  { id: 'avatar-16', seed: 'Ava' },
  { id: 'avatar-17', seed: 'Mason' },
  { id: 'avatar-18', seed: 'Isabella' },
  { id: 'avatar-19', seed: 'James' },
  { id: 'avatar-20', seed: 'Charlotte' },
  { id: 'avatar-21', seed: 'Benjamin' },
  { id: 'avatar-22', seed: 'Amelia' },
  { id: 'avatar-23', seed: 'Lucas' },
  { id: 'avatar-24', seed: 'Harper' },
  { id: 'avatar-25', seed: 'Henry' },
  { id: 'avatar-26', seed: 'Evelyn' },
  { id: 'avatar-27', seed: 'Alexander' },
  { id: 'avatar-28', seed: 'Abigail' },
  { id: 'avatar-29', seed: 'Michael' },
  { id: 'avatar-30', seed: 'Emily' },
  { id: 'avatar-31', seed: 'Daniel' },
  { id: 'avatar-32', seed: 'Elizabeth' },
  { id: 'avatar-33', seed: 'Jackson' },
  { id: 'avatar-34', seed: 'Sofia' },
  { id: 'avatar-35', seed: 'Sebastian' },
  { id: 'avatar-36', seed: 'Avery' },
  { id: 'avatar-37', seed: 'David' },
  { id: 'avatar-38', seed: 'Ella' },
  { id: 'avatar-39', seed: 'Joseph' },
  { id: 'avatar-40', seed: 'Scarlett' },
  { id: 'avatar-41', seed: 'Carter' },
  { id: 'avatar-42', seed: 'Grace' },
  { id: 'avatar-43', seed: 'Owen' },
  { id: 'avatar-44', seed: 'Chloe' },
  { id: 'avatar-45', seed: 'Wyatt' },
  { id: 'avatar-46', seed: 'Victoria' },
  { id: 'avatar-47', seed: 'Matthew' },
  { id: 'avatar-48', seed: 'Lily' },
];

const getAvatarUrl = (avatarId?: string) => {
  if (!avatarId) return null;
  const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return avatar ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.seed}` : null;
};

interface Patient {
  id: string;
  full_name: string;
  age?: number;
  avatar?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

interface Conversation {
  id: string;
  patient: Patient;
  last_message_at: string;
  unread_count: number;
}

interface DoctorMessagingProps {
  initialCaseId?: string | null;
  initialPatientId?: string | null;
}

export function DoctorMessaging({ initialCaseId, initialPatientId }: DoctorMessagingProps = {}) {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '💊', '🩺', '💉', '🏥', '🚑', '⚕️', '🧬', '🔬', '🩹', '🤒', '😷', '🤧', '🤕'];

  useEffect(() => {
    if (profile) {
      loadConversations();
    }
  }, [profile]);

  // Auto-select conversation when initialPatientId is provided
  useEffect(() => {
    async function selectOrCreateConversation() {
      if (!initialPatientId || !profile) return;
      
      await loadConversations(); // Ensure conversations are loaded
      
      // Wait a bit for conversations to load
      setTimeout(async () => {
        const conversation = conversations.find(c => c.patient?.id === initialPatientId);
        
        if (conversation) {
          console.log('Found existing conversation:', conversation);
          setSelectedConversation(conversation);
        } else {
          console.log('No conversation found, creating new one for patient:', initialPatientId);
          
          // Create new conversation
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              patient_id: initialPatientId,
              doctor_id: profile.id,
            })
            .select()
            .single();

          if (error) {
            // If conversation already exists (duplicate key), just reload to find it
            if (error.code === '23505') {
              console.log('Conversation already exists, reloading...');
              await loadConversations();
              // Try to find and select it again after reload
              setTimeout(() => {
                const existingConv = conversations.find(c => c.patient?.id === initialPatientId);
                if (existingConv) {
                  setSelectedConversation(existingConv);
                }
              }, 300);
            } else {
              console.error('Error creating conversation:', error);
            }
          } else if (newConv) {
            // Reload conversations to include the new one
            await loadConversations();
            setTimeout(() => {
              const conv = conversations.find(c => c.patient?.id === initialPatientId);
              if (conv) setSelectedConversation(conv);
            }, 300);
          }
        }
      }, 500);
    }
    
    selectOrCreateConversation();
  }, [initialPatientId, profile]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      prevMessagesLengthRef.current = 0;
      isUserScrollingRef.current = false;
      isInitialLoadRef.current = true;
      setShouldAutoScroll(false);
      
      // NO AUTO-SCROLL ON INITIAL LOAD - Let user scroll manually
    }
  }, [selectedConversation]);

  useEffect(() => {
    // COMPLETELY DISABLE AUTO-SCROLL FROM MESSAGE UPDATES
    // User must manually scroll - no automatic behavior
    prevMessagesLengthRef.current = messages.length;
  }, [messages, shouldAutoScroll]);

  // Detect user scrolling
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Mark that user is scrolling
    isUserScrollingRef.current = true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    
    // If user scrolled to bottom, enable auto-scroll
    if (isAtBottom) {
      setShouldAutoScroll(true);
    } else {
      // User scrolled away from bottom, disable auto-scroll
      setShouldAutoScroll(false);
    }
    
    // Reset scrolling flag after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  };

  // Real-time subscription for new messages
  useEffect(() => {
    if (!profile || !selectedConversation) return;

    const channel = supabase
      .channel(`conversation_${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Add message to current conversation if not already there
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
          
          // Mark as read if it's received by us
          if (newMsg.receiver_id === profile.id) {
            markMessagesAsRead(selectedConversation.id);
          }
          
          // Refresh conversation list to update timestamps and unread counts
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        () => {
          // Refresh conversations when messages are marked as read
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, selectedConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  };

  const loadConversations = async () => {
    if (!profile) return;

    try {
      const { data: convData, error } = await supabase
        .from('conversations')
        .select('id, patient_id, last_message_at')
        .eq('doctor_id', profile.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get patient details and unread counts for each conversation
      const conversationsWithCounts = await Promise.all(
        (convData || []).map(async (conv: any) => {
          // Get patient profile with avatar
          const { data: patientData, error: patientError } = await supabase
            .from('user_profiles')
            .select('id, full_name, age, avatar')
            .eq('id', conv.patient_id)
            .single();

          if (patientError) {
            console.error('Error fetching patient:', patientError);
          }

          console.log('Patient data loaded:', patientData); // Debug log

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', profile.id)
            .eq('is_read', false);

          return {
            id: conv.id,
            patient: patientData || { id: conv.patient_id, full_name: 'Unknown Patient', age: 0 },
            last_message_at: conv.last_message_at,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithCounts.filter(c => c.patient));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!profile) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      // Refresh conversations to update unread counts
      loadConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !profile) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentType = null;
      let attachmentSize = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${profile.id}/${selectedConversation.patient.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(uploadData.path);

        attachmentUrl = publicUrl;
        attachmentName = selectedFile.name;
        attachmentType = selectedFile.type;
        attachmentSize = selectedFile.size;
        
        setSelectedFile(null);
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: profile.id,
        receiver_id: selectedConversation.patient.id,
        message_text: messageText || (selectedFile ? 'Sent an attachment' : ''),
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        attachment_size: attachmentSize,
      });

      if (error) throw error;
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 via-white to-rose-50 rounded-2xl shadow-xl overflow-hidden h-[600px] flex flex-col border border-red-100">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-4 flex items-center gap-3 shadow-md">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">
            {selectedConversation ? selectedConversation.patient.full_name : 'Patient Messages'}
          </h2>
          {selectedConversation && selectedConversation.patient.age && (
            <p className="text-xs text-red-100">Age: {selectedConversation.patient.age} years</p>
          )}
        </div>
        {selectedConversation && (
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white font-medium">Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-red-100 overflow-y-auto bg-white/50 backdrop-blur-sm`}>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-semibold text-gray-700">No patient messages yet</p>
              <p className="text-sm mt-1">Patients will appear here when they contact you</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-red-50 hover:bg-red-50 transition-all text-left group ${
                  selectedConversation?.id === conv.id ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {conv.patient.avatar ? (
                          <img
                            src={getAvatarUrl(conv.patient.avatar) || ''}
                            alt={conv.patient.full_name}
                            className="w-12 h-12 rounded-full ring-2 ring-red-200 group-hover:ring-red-400 transition-all"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full ring-2 ring-red-200 group-hover:ring-red-400 transition-all bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600">
                              {conv.patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {conv.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate">
                          {conv.patient.full_name}
                        </h3>
                        {conv.patient.age && (
                          <p className="text-xs text-gray-500">Age: {conv.patient.age}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.last_message_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Messages Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-red-50/30 to-rose-50/30">
            {/* Messages List */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((message) => {
                const isSentByMe = message.sender_id === profile?.id;
                const hasAttachment = message.attachment_url;
                const isImage = message.attachment_type?.startsWith('image/');
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div className="flex items-end gap-2 max-w-[75%]">
                      {!isSentByMe && (
                        selectedConversation.patient.avatar ? (
                          <img
                            src={getAvatarUrl(selectedConversation.patient.avatar) || ''}
                            alt=""
                            className="w-8 h-8 rounded-full ring-2 ring-red-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full ring-2 ring-red-200 flex-shrink-0 bg-red-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-red-600">
                              {selectedConversation.patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md ${
                          isSentByMe
                            ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-red-100'
                        }`}
                      >
                        {message.message_text && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
                        )}
                        
                        {hasAttachment && (
                          <div className={`${message.message_text ? 'mt-2' : ''}`}>
                            {isImage ? (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                              >
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="rounded-lg max-w-xs max-h-64 object-cover border-2 border-white/20 group-hover:border-white/40 transition-all"
                                />
                              </a>
                            ) : (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                  isSentByMe
                                    ? 'bg-white/10 hover:bg-white/20'
                                    : 'bg-red-50 hover:bg-red-100'
                                }`}
                              >
                                <FileText className={`w-8 h-8 flex-shrink-0 ${isSentByMe ? 'text-white' : 'text-red-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isSentByMe ? 'text-white' : 'text-gray-900'}`}>
                                    {message.attachment_name}
                                  </p>
                                  <p className={`text-xs ${isSentByMe ? 'text-red-100' : 'text-gray-500'}`}>
                                    {formatFileSize(message.attachment_size)}
                                  </p>
                                </div>
                                <Download className={`w-4 h-4 flex-shrink-0 ${isSentByMe ? 'text-white' : 'text-red-600'}`} />
                              </a>
                            )}
                          </div>
                        )}
                        
                        <p
                          className={`text-xs mt-2 ${
                            isSentByMe ? 'text-red-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-red-100">
              {selectedFile && (
                <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border-2 border-red-200 focus-within:border-red-400 transition-all shadow-sm">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-3 hover:bg-red-50 rounded-l-xl transition-colors"
                    >
                      <Smile className="w-5 h-5 text-red-600" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 p-4 bg-white rounded-xl shadow-2xl border-2 border-red-200 z-50 w-72">
                        <div className="grid grid-cols-6 gap-3">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="text-3xl hover:scale-125 transition-transform p-2 hover:bg-red-50 rounded flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 py-3 outline-none bg-transparent text-gray-900 placeholder-gray-400"
                    disabled={sending}
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 hover:bg-red-50 transition-colors"
                    disabled={sending}
                  >
                    <Paperclip className="w-5 h-5 text-red-600" />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={sending || (!newMessage.trim() && !selectedFile)}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg font-medium"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-white via-red-50/20 to-rose-50/20">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-gray-600 font-medium">Select a patient to start messaging</p>
              <p className="text-sm text-gray-400 mt-1">Your conversations will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
