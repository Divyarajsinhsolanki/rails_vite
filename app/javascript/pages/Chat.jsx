import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiMoreVertical,
  FiSearch,
  FiPlus,
  FiArrowLeft,
  FiUsers,
  FiHash,
  FiCheck,
  FiX,
  FiEdit,
  FiMessageSquare
} from "react-icons/fi";
import { fetchConversation, fetchConversations, getUsers, sendMessage, createConversation, startDirectConversation } from "../components/api";
import { AuthContext } from "../context/AuthContext";
import { subscribeToConversationChat, subscribeToUserChat } from "../lib/chatCable";

// --- Components ---

const Avatar = ({ name, src, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg",
  };
  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (src && src !== "null") {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm ${currentSizeClass} ${className}`}
      />
    );
  }
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div
      className={`rounded-full ${colors[colorIndex]} text-white flex items-center justify-center font-bold ring-2 ring-white dark:ring-zinc-800 shadow-sm ${currentSizeClass} ${className}`}
    >
      {initial}
    </div>
  );
};

const ConversationItem = ({ conversation, isActive, user }) => {
  const isUnread = conversation.unread_count > 0;
  const isDirect = conversation.conversation_type === "direct";

  // For direct chats, find the other participant to show their avatar
  const otherParticipant = isDirect
    ? conversation.participants?.find(p => p.id !== user?.id)
    : null;

  const displayName = isDirect && otherParticipant ? otherParticipant.name : conversation.title;
  const displayImage = isDirect && otherParticipant ? otherParticipant.profile_picture : null; // Use null for group avatar fallback

  const lastMessageTime = conversation.updated_at ? new Date(conversation.updated_at) : null;
  const timeString = lastMessageTime ? (isToday(lastMessageTime) ? format(lastMessageTime, "h:mm a") : isYesterday(lastMessageTime) ? "Yesterday" : format(lastMessageTime, "d MMM")) : "";

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
        ? "bg-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color)]/20"
        : "hover:bg-slate-100 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-slate-200"
        }`}
    >
      <div className="relative shrink-0">
        {isDirect ? (
          <Avatar name={displayName} src={displayImage} size="md" />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 ring-2 ring-white dark:ring-zinc-800`}>
            <FiUsers />
          </div>
        )}
        {/* Simple online indicator logic could go here if available */}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className={`font-semibold truncate ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
            {displayName}
          </span>
          <span className={`text-[10px] shrink-0 opacity-70 ${isActive ? "text-white" : "text-slate-400"}`}>
            {timeString}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-xs truncate ${isActive ? "text-blue-100" : isUnread ? "text-slate-900 font-semibold dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
            {conversation.last_message || "Start chatting"}
          </p>
          {isUnread && (
            <span className={`ml-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white text-[var(--theme-color)]" : "bg-red-500 text-white"}`}>
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const MessageBubble = ({ message, isMe, showAvatar }) => {
  const time = new Date(message.created_at);
  const timeString = format(time, "h:mm a");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-4 ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {!isMe && (
          <div className="flex flex-col justify-end">
            {showAvatar ? <Avatar name={message.user_name} src={message.user_profile_picture} size="sm" /> : <div className="w-8" />}
          </div>
        )}

        <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {!isMe && showAvatar && (
            <span className="text-[10px] text-slate-500 ml-1 mb-1 block">{message.user_name}</span>
          )}

          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm relative group text-sm leading-relaxed ${isMe
              ? "bg-[var(--theme-color)] text-white rounded-tr-sm"
              : "bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-800 dark:text-slate-200 rounded-tl-sm"
              }`}
          >
            {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}

            {message.attachments?.length > 0 && (
              <div className={`grid gap-2 mt-2 ${message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {message.attachments.map(att => (
                  <div key={att.id} className="relative group/att rounded-lg overflow-hidden border border-black/10">
                    {att.content_type?.startsWith("image/") ? (
                      <img src={att.url} alt={att.filename} className="max-w-full h-auto object-cover" />
                    ) : (
                      <div className="p-3 bg-white/20 backdrop-blur-sm flex items-center gap-2">
                        <FiPaperclip />
                        <span className="text-xs truncate max-w-[150px]">{att.filename}</span>
                      </div>
                    )}
                    <a href={att.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {timeString}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Chat Component ---

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const messageListRef = useRef(null);
  const fileInputRef = useRef(null);
  const [conversations, setConversations] = useState({ direct: [], group: [] });
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);

  const [messageBody, setMessageBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // New Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatStep, setNewChatStep] = useState("select"); // 'select' | 'details'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const fetchAllData = useCallback(async () => {
    try {
      const { data } = await fetchConversations();
      const directs = [];
      const groups = [];

      (Array.isArray(data) ? data : []).forEach(c => {
        if (c.conversation_type === "direct") directs.push(c);
        else groups.push(c);
      });

      setConversations({ direct: directs, group: groups });
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    try {
      const { data } = await fetchConversation(id);
      setActiveConversation(data);
    } catch (e) {
      console.error("Failed to load conversation details", e);
    }
  }, []);

  // Initial Load & Users
  useEffect(() => {
    fetchAllData();
    getUsers().then(({ data }) => setUsers(Array.isArray(data) ? data : []));
  }, [fetchAllData]);

  // Route Change
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setActiveConversation(null);
    }
  }, [conversationId, loadConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messageListRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }, 100);
    }
  }, [activeConversation?.messages?.length, conversationId]);

  // --- Realtime Subscriptions ---

  useEffect(() => {
    const userSub = subscribeToUserChat((payload) => {
      if (payload?.type === "conversation_refresh") {
        fetchAllData();
        // If current conversation was updated, reload it too to get things like title changes or participant updates
        if (conversationId && payload.conversation_id === parseInt(conversationId)) {
          loadConversation(conversationId);
        }
      }
    });

    return () => userSub.unsubscribe();
  }, [conversationId, fetchAllData, loadConversation]);

  useEffect(() => {
    if (!conversationId) return;

    const convSub = subscribeToConversationChat(conversationId, (payload) => {
      if (payload?.type === "message_created" && Number(payload.conversation_id) === Number(conversationId)) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          // Deduplicate
          if (prev.messages?.some(m => m.id === payload.message.id)) return prev;

          return {
            ...prev,
            messages: [...(prev.messages || []), payload.message]
          };
        });
        fetchAllData(); // Update sidebar "last message"
      }
    });

    return () => convSub.unsubscribe();
  }, [conversationId, fetchAllData]);


  // --- Handlers ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageBody.trim() && attachments.length === 0) || !conversationId) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("message[body]", messageBody);
      attachments.forEach(file => formData.append("message[attachments][]", file));

      const { data: newMessage } = await sendMessage(conversationId, formData);

      // Optimistic update
      setActiveConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        }
      });

      setMessageBody("");
      setAttachments([]);
      fetchAllData(); // Update sidebar
    } catch (error) {
      console.error("Failed to send", error);
    } finally {
      setIsSending(false);
    }
  };

  const startDirectChat = async (userId) => {
    try {
      // Find existing or create new
      // Ideally API handles this "find or create" logic
      // For now let's assume createConversation handles it or we filter manually.
      // Actually, createConversation (POST /conversations) creates generic ones. 
      // We need a specific "Start Direct" endpoint or logic.
      // Looking at backend, there IS a `start_direct` endpoint!

      // Wait, I need to check api.js if I exported it. I did: `startDirectConversation`
      // Let's import it.
      // Oh wait, I didn't import `startDirectConversation` at top of file. I should.

      // Fallback: Use standard create for now if I forget import, but `startDirectConversation` is better.
      // Let's optimize: I will use `createConversation` with type 'direct' which backend might handle, 
      // BUT my backend `create` action just creates a NEW one every time.
      // `start_direct` action in controller handles "find or create".
      // I will use `startDirectConversation` but I need to import it properly.
    } catch (e) {
      console.error(e);
    }
  };

  // Since I can't easily change imports in this single file write without context of what I imported,
  // I will check if I imported `startDirectConversation`. 
  // I imported: `createConversation, fetchConversation, fetchConversations, getUsers, sendMessage`.
  // I missed `startDirectConversation`.
  // I'll implement a helper using `api.post('/conversations/start_direct', ...)` manually if needed or just use `createConversation` and handle duplicates? 
  // No, `create` in backend always creates clean new one.
  // I will just add `startDirectConversation` to the imports list in the file content I am writing.

  const handleCreateNew = async () => {
    if (selectedUserIds.length === 0) return;

    if (newChatStep === 'select' && selectedUserIds.length === 1) {
      // Direct Chat
      const targetUserId = selectedUserIds[0];
      // Use the API to find/create direct chat
      // To be safe, I'll use the generic api structure here since I might not have imported the specific function
      // But wait, I am WRITING the file, so I CAN add the import.
      // Yes, I added `createConversation`. I will also add `startDirectConversation` to imports.
      // ...

      // Actually, for simplicity in "Select Users" -> if 1 user, go to direct. If multiple, ask for group name.
      if (selectedUserIds.length === 1) {
        // Direct
        // I'll use a direct API call here to ensure it works
        // I will add the import to the top of the file I'm generating.
      } else {
        setNewChatStep('details');
        return;
      }
    }

    // Group Create
    if (selectedUserIds.length > 1 && !newGroupTitle.trim()) return;

    try {
      const { data } = await createConversation({
        title: newGroupTitle,
        conversation_type: 'group',
        participant_ids: selectedUserIds
      });

      setIsNewChatModalOpen(false);
      setNewGroupTitle("");
      setSelectedUserIds([]);
      setNewChatStep('select');
      navigate(`/chat/${data.id}`);
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Users for Modal
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u =>
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-white dark:bg-zinc-900 overflow-hidden">

      {/* --- Sidebar --- */}
      <aside className={`flex flex-col w-full md:w-80 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 ${conversationId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Messages</h1>
          <button
            onClick={() => { setIsNewChatModalOpen(true); setNewChatStep('select'); setSelectedUserIds([]); }}
            className="p-2 bg-[var(--theme-color)] text-white rounded-lg shadow-sm hover:brightness-110 transition"
          >
            <FiEdit className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--theme-color)] outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Direct Messages */}
          <div>
            <h2 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Messages</h2>
            <div className="space-y-1">
              {conversations.direct.length === 0 && <p className="px-2 text-sm text-slate-400 italic">No messages yet</p>}
              {conversations.direct.map(c => (
                <ConversationItem key={c.id} conversation={c} isActive={Number(conversationId) === c.id} user={user} />
              ))}
            </div>
          </div>

          {/* Groups */}
          <div>
            <h2 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
              Groups
              <button onClick={() => { setIsNewChatModalOpen(true); setNewChatStep('details'); }} className="text-[var(--theme-color)] hover:underline text-[10px]">
                + New
              </button>
            </h2>
            <div className="space-y-1">
              {conversations.group.length === 0 && <p className="px-2 text-sm text-slate-400 italic">No groups yet</p>}
              {conversations.group.map(c => (
                <ConversationItem key={c.id} conversation={c} isActive={Number(conversationId) === c.id} user={user} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Chat Area --- */}
      <main className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30 dark:bg-zinc-900/30">
            <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <FiMessageSquare className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Your Messages</h3>
            <p className="max-w-xs text-sm">Select a conversation from the sidebar or start a new one to begin messaging.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-8 px-6 py-2.5 bg-[var(--theme-color)] text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-16 px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <Link to="/chat" className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                  <FiArrowLeft />
                </Link>

                {activeConversation.conversation_type === 'direct' ? (
                  <Avatar
                    name={activeConversation.participants.find(p => p.id !== user?.id)?.name || activeConversation.title}
                    src={activeConversation.participants.find(p => p.id !== user?.id)?.profile_picture}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FiUsers />
                  </div>
                )}

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white leading-tight">
                    {activeConversation.conversation_type === 'direct'
                      ? (activeConversation.participants.find(p => p.id !== user?.id)?.name || activeConversation.title)
                      : activeConversation.title}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    {activeConversation.conversation_type === 'group'
                      ? `${activeConversation.participants.length} participants`
                      : "Active now"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition">
                  <FiSearch />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition">
                  <FiMoreVertical />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-zinc-900/50 scroll-smooth"
              ref={messageListRef}
            >
              {/* Date separators concept: group messages by date, insert header. Simplified here just list. */}
              {activeConversation.messages?.length === 0 && (
                <div className="text-center py-20 opacity-50">
                  <p className="text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}

              {activeConversation.messages?.map((msg, i) => {
                const prevMsg = activeConversation.messages[i - 1];
                const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id; // Simple logic
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={msg.user_id === user?.id}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 shrink-0">
              {attachments.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {attachments.map((file, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files)])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-[var(--theme-color)] hover:bg-slate-50 rounded-xl transition"
                >
                  <FiPaperclip className="w-5 h-5" />
                </button>

                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl px-4 py-3 max-h-32 focus:ring-2 focus:ring-[var(--theme-color)]/20 outline-none resize-none overflow-hidden"
                  style={{ minHeight: '44px' }}
                />

                <button
                  disabled={isSending || (!messageBody.trim() && attachments.length === 0)}
                  className="p-3 bg-[var(--theme-color)] text-white rounded-xl shadow-lg shadow-[var(--theme-color)]/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                >
                  <FiSend className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* --- New Chat Modal --- */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsNewChatModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">
                  {newChatStep === 'select' ? "New Message" : "New Group Details"}
                </h3>
                <button onClick={() => setIsNewChatModalOpen(false)}><FiX className="text-slate-400" /></button>
              </div>

              {newChatStep === 'select' ? (
                <>
                  <div className="p-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-3 text-slate-400" />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search people..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {filteredUsers.map(u => {
                      const selected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserIds(prev => selected ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selected ? "bg-[var(--theme-color-light)]/10" : "hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                        >
                          <div className="relative">
                            <Avatar name={u.full_name} src={u.profile_picture_url} />
                            {selected && (
                              <div className="absolute -bottom-1 -right-1 bg-[var(--theme-color)] text-white rounded-full p-0.5 border-2 border-white">
                                <FiCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${selected ? "text-[var(--theme-color)]" : "text-slate-900 dark:text-white"}`}>{u.full_name}</p>
                            <p className="text-xs text-slate-500">{u.job_title || u.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-500">{selectedUserIds.length} selected</span>
                    <button
                      disabled={selectedUserIds.length === 0}
                      onClick={async () => {
                        if (selectedUserIds.length === 1) {
                          // Direct chat start
                          try {
                            const { data } = await startDirectConversation(selectedUserIds[0]);
                            navigate(`/chat/${data.id}`);
                            setIsNewChatModalOpen(false);
                            fetchAllData();
                          } catch (e) {
                            console.error(e);
                          }
                        } else {
                          setNewChatStep('details');
                        }
                      }}
                      className="px-6 py-2 bg-[var(--theme-color)] text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50"
                    >
                      {selectedUserIds.length > 1 ? "Next" : "Chat"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                    <input
                      value={newGroupTitle}
                      onChange={(e) => setNewGroupTitle(e.target.value)}
                      placeholder="e.g. Marketing Team"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
                      autoFocus
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => setNewChatStep('select')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Back</button>
                    <button
                      onClick={handleCreateNew}
                      disabled={!newGroupTitle.trim()}
                      className="px-6 py-2 bg-[var(--theme-color)] text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50"
                    >
                      Create Group
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Chat;
