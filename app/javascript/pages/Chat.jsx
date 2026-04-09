import React, { useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow, isSameDay, isThisYear, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiEdit,
  FiFileText,
  FiHash,
  FiImage,
  FiInfo,
  FiLayers,
  FiMessageSquare,
  FiMoreVertical,
  FiPaperclip,
  FiSearch,
  FiSend,
  FiUsers,
  FiX,
  FiZap
} from "react-icons/fi";
import {
  addMessageReaction,
  createConversation,
  fetchConversation,
  fetchConversations,
  getUsers,
  removeMessageReaction,
  sendMessage,
  startDirectConversation
} from "../components/api";
import { AuthContext } from "../context/AuthContext";
import { sendToConversation, subscribeToConversationChat, subscribeToUserChat } from "../lib/chatCable";

const REACTION_EMOJIS = ["👍", "❤️", "🎉"];
const CONVERSATION_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "direct", label: "Direct" },
  { id: "group", label: "Groups" }
];
const NEW_CHAT_MODES = [
  { id: "direct", label: "Direct" },
  { id: "group", label: "Group" }
];

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getFullUserName = (person) => {
  const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();
  return person?.name || fullName || person?.email || "Unknown";
};

const getConversationOtherParticipant = (conversation, currentUserId) => (
  conversation?.participants?.find((participant) => Number(participant.id) !== Number(currentUserId)) || null
);

const getConversationDisplayName = (conversation, currentUserId) => {
  if (!conversation) return "";
  if (conversation.conversation_type === "direct") {
    return getConversationOtherParticipant(conversation, currentUserId)?.name || conversation.title || "Direct conversation";
  }

  return conversation.title || "Untitled group";
};

const getConversationDisplayImage = (conversation, currentUserId) => {
  if (conversation?.conversation_type !== "direct") return null;
  return getConversationOtherParticipant(conversation, currentUserId)?.profile_picture || null;
};

const formatConversationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
};

const formatDayLabel = (value) => {
  const date = new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, isThisYear(date) ? "EEEE, MMM d" : "MMM d, yyyy");
};

const formatParticipantStatus = (participant, currentUserId) => {
  if (Number(participant?.id) === Number(currentUserId)) return "You";
  if (!participant?.last_read_at) return "No recent read receipt";
  return `Read ${formatDistanceToNow(new Date(participant.last_read_at), { addSuffix: true })}`;
};

const messageMatchesQuery = (message, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const attachmentText = (message.attachments || [])
    .map((attachment) => `${attachment.filename || ""} ${attachment.content_type || ""}`)
    .join(" ")
    .toLowerCase();

  return [
    message.body,
    message.user_name,
    attachmentText
  ].some((value) => value?.toLowerCase().includes(normalizedQuery));
};

const groupMessagesByDay = (messages) => {
  const groups = [];

  messages.forEach((message) => {
    const dateKey = format(new Date(message.created_at), "yyyy-MM-dd");
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || lastGroup.dateKey !== dateKey) {
      groups.push({
        dateKey,
        label: formatDayLabel(message.created_at),
        messages: [message]
      });
      return;
    }

    lastGroup.messages.push(message);
  });

  return groups;
};

const getAttachmentKindLabel = (contentType = "") => {
  if (contentType.startsWith("image/")) return "Image";
  if (contentType.includes("pdf")) return "PDF";
  if (contentType.includes("sheet")) return "Spreadsheet";
  if (contentType.includes("presentation")) return "Presentation";
  if (contentType.includes("word") || contentType.includes("document")) return "Document";
  return "File";
};

const HighlightText = ({ text = "", query }) => {
  if (!text) return null;
  if (!query.trim()) return <>{text}</>;

  const normalizedQuery = query.trim().toLowerCase();
  const matcher = new RegExp(`(${escapeRegExp(query.trim())})`, "ig");
  const parts = text.split(matcher);

  return (
    <>
      {parts.map((part, index) => (
        part.toLowerCase() === normalizedQuery ? (
          <mark key={`${part}-${index}`} className="rounded bg-amber-200/80 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        )
      ))}
    </>
  );
};

const Avatar = ({ name, src, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl"
  };
  const colors = [
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-cyan-600"
  ];

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  if (src && src !== "null") {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.7)] ${currentSizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br ${colors[colorIndex]} font-bold text-white ring-2 ring-white/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.7)] ${currentSizeClass} ${className}`}
    >
      {initial}
    </div>
  );
};

const StatCard = ({ icon, label, value, accentClass }) => (
  <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
    <div className="flex items-center justify-between gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${accentClass}`}>
        {icon}
      </div>
      <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</span>
    </div>
    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
      {label}
    </p>
  </div>
);

const ConversationItem = ({ conversation, currentUserId, isActive, searchQuery }) => {
  const isUnread = conversation.unread_count > 0;
  const isDirect = conversation.conversation_type === "direct";
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const displayImage = getConversationDisplayImage(conversation, currentUserId);
  const subtitle = isDirect ? "Direct message" : `${conversation.participants?.length || 0} members`;
  const previewText = conversation.last_message || (isDirect ? "No messages yet" : "Create a room that keeps the whole group aligned");

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={`group relative block overflow-hidden rounded-[22px] border p-3.5 transition-all duration-200 ${
        isActive
          ? "border-transparent bg-slate-950 text-white shadow-[0_22px_55px_-28px_rgba(15,23,42,0.95)]"
          : "border-white/70 bg-white/72 text-slate-700 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white/92 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-slate-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      }`}
    >
      <div
        className={`absolute inset-0 opacity-100 ${
          isActive
            ? "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_40%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.95))]"
            : ""
        }`}
      />

      <div className="relative flex items-start gap-3">
        <div className="shrink-0">
          {isDirect ? (
            <Avatar name={displayName} src={displayImage} size="md" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700 ring-2 ring-white/90 dark:from-sky-950/60 dark:to-cyan-950/40 dark:text-sky-200">
              <FiUsers className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  <HighlightText text={displayName} query={searchQuery} />
                </p>
                {isUnread && !isActive && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              </div>
              <p className={`mt-1 text-[11px] font-medium uppercase tracking-[0.2em] ${isActive ? "text-sky-100/70" : "text-slate-400 dark:text-slate-500"}`}>
                {subtitle}
              </p>
            </div>

            <span className={`shrink-0 text-[10px] font-medium ${isActive ? "text-sky-100/70" : "text-slate-400 dark:text-slate-500"}`}>
              {formatConversationTime(conversation.updated_at)}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className={`line-clamp-2 text-xs leading-5 ${isActive ? "text-sky-50/80" : isUnread ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
              <HighlightText text={previewText} query={searchQuery} />
            </p>

            {isUnread && (
              <span className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? "bg-white text-slate-950" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`}>
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const MessageAttachmentCard = ({ attachment, isMe, searchQuery }) => {
  const isImage = attachment.content_type?.startsWith("image/");
  const containerClass = isMe
    ? "border-white/20 bg-white/10 text-white"
    : "border-slate-200/80 bg-slate-50/80 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-slate-200";

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={`group/attachment relative overflow-hidden rounded-2xl border ${containerClass}`}
      >
        <img src={attachment.url} alt={attachment.filename} className="h-44 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent p-3 text-white">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/80">
            <FiImage className="h-3.5 w-3.5" />
            Image
          </div>
          <p className="mt-1 truncate text-xs font-medium">
            <HighlightText text={attachment.filename} query={searchQuery} />
          </p>
        </div>
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition hover:-translate-y-0.5 ${containerClass}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isMe ? "bg-white/10" : "bg-white text-slate-600 dark:bg-zinc-800 dark:text-slate-200"}`}>
        <FiFileText className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <HighlightText text={attachment.filename} query={searchQuery} />
        </p>
        <p className={`mt-1 text-[11px] uppercase tracking-[0.22em] ${isMe ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
          {getAttachmentKindLabel(attachment.content_type)}
        </p>
      </div>
    </a>
  );
};

const MessageBubble = ({ message, isMe, showAvatar, onToggleReaction, participants, searchQuery }) => {
  const timeString = format(new Date(message.created_at), "h:mm a");
  const reactions = message.reactions || {};
  const reactedEmojis = message.reacted_emojis || [];
  const seenBy = (participants || []).filter((participant) => (
    Number(participant.id) !== Number(message.user_id) &&
    participant.last_read_at &&
    new Date(participant.last_read_at) >= new Date(message.created_at)
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group/bubble flex w-full ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[92%] gap-3 md:max-w-[78%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {!isMe && (
          <div className="flex w-10 shrink-0 items-end justify-center">
            {showAvatar ? <Avatar name={message.user_name} src={message.user_profile_picture} size="sm" /> : <div className="h-8 w-8" />}
          </div>
        )}

        <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {!isMe && showAvatar && (
            <span className="mb-1.5 ml-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {message.user_name}
            </span>
          )}

          <div
            className={`relative overflow-hidden rounded-[24px] border px-4 py-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.5)] ${
              isMe
                ? "border-transparent bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.92))] text-white"
                : "border-white/80 bg-white/92 text-slate-800 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-slate-200"
            } ${searchQuery.trim() ? "ring-2 ring-amber-300/60" : ""}`}
          >
            {message.body && (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                <HighlightText text={message.body} query={searchQuery} />
              </p>
            )}

            {message.attachments?.length > 0 && (
              <div className={`grid gap-2 ${message.body ? "mt-3" : ""} ${message.attachments.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                {message.attachments.map((attachment) => (
                  <MessageAttachmentCard
                    key={attachment.id}
                    attachment={attachment}
                    isMe={isMe}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 px-1">
            {REACTION_EMOJIS.map((emoji) => {
              const count = reactions[emoji] || 0;
              const isActive = reactedEmojis.includes(emoji);
              if (count === 0) return null;

              return (
                <button
                  key={`${message.id}-${emoji}`}
                  type="button"
                  onClick={() => onToggleReaction(message.id, emoji, isActive)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                    isActive
                      ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800/85 dark:text-slate-300"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>

          <div className={`pointer-events-none absolute -top-9 z-20 opacity-0 transition-all duration-150 group-hover/bubble:pointer-events-auto group-hover/bubble:opacity-100 ${isMe ? "right-0" : "left-0"}`}>
            <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/92 p-1 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
              {REACTION_EMOJIS.map((emoji) => {
                const isActive = reactedEmojis.includes(emoji);
                return (
                  <button
                    key={`${message.id}-picker-${emoji}`}
                    type="button"
                    onClick={() => onToggleReaction(message.id, emoji, isActive)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-transform hover:scale-125 ${isActive ? "bg-amber-100 dark:bg-amber-900/40" : "hover:bg-slate-100 dark:hover:bg-zinc-800"}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2 px-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span>{timeString}</span>
            {isMe && (
              <span className={`inline-flex items-center gap-1 ${seenBy.length > 0 ? "text-emerald-500" : ""}`}>
                <FiCheck className="h-3.5 w-3.5" />
                {seenBy.length > 0 && <FiCheck className="-ml-1 h-3.5 w-3.5" />}
                {seenBy.length > 0 && (
                  <span className="font-medium">
                    {seenBy.length === 1 ? `Seen by ${seenBy[0].name}` : `Seen by ${seenBy.length}`}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const messageListRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerTextareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [conversations, setConversations] = useState({ direct: [], group: [] });
  const [activeConversation, setActiveConversation] = useState(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const [messageBody, setMessageBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [showInfo, setShowInfo] = useState(false);

  const [sideSearchQuery, setSideSearchQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState("");

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatMode, setNewChatMode] = useState("direct");
  const [newChatStep, setNewChatStep] = useState("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const deferredSideSearchQuery = useDeferredValue(sideSearchQuery);
  const deferredThreadSearchQuery = useDeferredValue(threadSearchQuery);
  const deferredUserSearchTerm = useDeferredValue(searchTerm);

  const allConversations = useMemo(
    () => [...conversations.direct, ...conversations.group],
    [conversations]
  );

  const totalUnreadCount = useMemo(
    () => allConversations.reduce((total, conversation) => total + (conversation.unread_count || 0), 0),
    [allConversations]
  );

  const fetchAllData = useCallback(async () => {
    try {
      const { data } = await fetchConversations();
      const direct = [];
      const group = [];

      (Array.isArray(data) ? data : []).forEach((conversation) => {
        if (conversation.conversation_type === "direct") direct.push(conversation);
        else group.push(conversation);
      });

      setConversations({ direct, group });
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    if (!id) return;

    setIsConversationLoading(true);

    try {
      const { data } = await fetchConversation(id);
      setActiveConversation(data);
    } catch (error) {
      console.error("Failed to load conversation details", error);
      setActiveConversation(null);
    } finally {
      setIsConversationLoading(false);
    }
  }, []);

  const resetNewChatModal = useCallback((mode = "direct") => {
    setNewChatMode(mode);
    setNewChatStep("select");
    setSearchTerm("");
    setSelectedUserIds([]);
    setNewGroupTitle("");
  }, []);

  const openNewChatModal = useCallback((mode = "direct") => {
    resetNewChatModal(mode);
    setIsNewChatModalOpen(true);
  }, [resetNewChatModal]);

  const sendTyping = useCallback((isTyping, targetConversationId = conversationId) => {
    if (!targetConversationId) return;

    sendToConversation(targetConversationId, "typing", {
      conversation_id: targetConversationId,
      is_typing: isTyping
    });
  }, [conversationId]);

  const markConversationAsRead = useCallback((targetConversationId) => {
    if (!targetConversationId) return;

    sendToConversation(targetConversationId, "mark_as_read", {
      conversation_id: targetConversationId
    });
  }, []);

  useEffect(() => {
    fetchAllData();
    getUsers()
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to load users", error));
  }, [fetchAllData]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      setThreadSearchQuery("");
      setIsThreadSearchOpen(false);
    } else {
      setActiveConversation(null);
      setIsConversationLoading(false);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    if (deferredThreadSearchQuery.trim()) return;

    const container = messageListRef.current;
    if (!container) return;

    const timeoutId = window.setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [activeConversation?.messages?.length, conversationId, deferredThreadSearchQuery]);

  useEffect(() => {
    const textarea = composerTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [messageBody]);

  useEffect(() => {
    const userSub = subscribeToUserChat((payload) => {
      if (payload?.type === "conversation_refresh") {
        fetchAllData();

        if (conversationId && Number(payload.conversation_id) === Number(conversationId)) {
          loadConversation(conversationId);
        }
      }
    });

    return () => userSub.unsubscribe();
  }, [conversationId, fetchAllData, loadConversation]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const convSub = subscribeToConversationChat(conversationId, (payload) => {
      if (payload?.type === "message_created" && Number(payload.conversation_id) === Number(conversationId)) {
        setActiveConversation((previous) => {
          if (!previous) return previous;
          if (previous.messages?.some((message) => message.id === payload.message.id)) return previous;

          return {
            ...previous,
            messages: [...(previous.messages || []), payload.message]
          };
        });

        fetchAllData();
        markConversationAsRead(conversationId);
      }

      if (payload?.type === "message_reactions_updated" && Number(payload.conversation_id) === Number(conversationId)) {
        setActiveConversation((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            messages: (previous.messages || []).map((message) => {
              if (message.id !== payload.message_id) return message;

              const currentCount = message.reactions?.[payload.last_actor_emoji] || 0;
              const reactedEmojis = new Set(message.reacted_emojis || []);

              if (payload.last_actor_id && Number(payload.last_actor_id) === Number(user?.id) && payload.last_actor_emoji) {
                if (payload.last_actor_action === "added") reactedEmojis.add(payload.last_actor_emoji);
                if (payload.last_actor_action === "removed" && currentCount <= 1) reactedEmojis.delete(payload.last_actor_emoji);
              }

              return {
                ...message,
                reactions: payload.reactions || {},
                reacted_emojis: Array.from(reactedEmojis)
              };
            })
          };
        });
      }

      if (payload?.type === "typing_indicator" && Number(payload.conversation_id) === Number(conversationId)) {
        if (Number(payload.user_id) === Number(user?.id)) return;

        setTypingUsers((previous) => {
          const next = { ...previous };

          if (payload.is_typing) {
            if (next[payload.user_id]?.timeout) clearTimeout(next[payload.user_id].timeout);

            next[payload.user_id] = {
              name: payload.user_name,
              timeout: window.setTimeout(() => {
                setTypingUsers((current) => {
                  const updated = { ...current };
                  delete updated[payload.user_id];
                  return updated;
                });
              }, 3000)
            };
          } else {
            if (next[payload.user_id]?.timeout) clearTimeout(next[payload.user_id].timeout);
            delete next[payload.user_id];
          }

          return next;
        });
      }

      if (payload?.type === "message_read" && Number(payload.conversation_id) === Number(conversationId)) {
        setActiveConversation((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            participants: (previous.participants || []).map((participant) => (
              Number(participant.id) === Number(payload.user_id)
                ? { ...participant, last_read_at: payload.read_at }
                : participant
            ))
          };
        });
      }
    });

    return () => convSub.unsubscribe();
  }, [conversationId, fetchAllData, markConversationAsRead, user?.id]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const activeConversationMessages = useMemo(() => {
    const messages = activeConversation?.messages || [];
    return [...messages].sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
  }, [activeConversation?.messages]);

  const attachmentPreviewUrls = useMemo(
    () => attachments.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)),
    [attachments]
  );

  useEffect(() => {
    return () => {
      attachmentPreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [attachmentPreviewUrls]);

  const activeConversationName = useMemo(
    () => getConversationDisplayName(activeConversation, user?.id),
    [activeConversation, user?.id]
  );

  const activeConversationImage = useMemo(
    () => getConversationDisplayImage(activeConversation, user?.id),
    [activeConversation, user?.id]
  );

  const activeConversationOtherParticipant = useMemo(
    () => getConversationOtherParticipant(activeConversation, user?.id),
    [activeConversation, user?.id]
  );

  const typingNames = useMemo(
    () => Object.values(typingUsers).map((entry) => entry.name),
    [typingUsers]
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = deferredSideSearchQuery.trim().toLowerCase();
    const matchesSearch = (conversation) => {
      if (!normalizedQuery) return true;
      const displayName = getConversationDisplayName(conversation, user?.id).toLowerCase();
      const lastMessage = conversation.last_message?.toLowerCase() || "";
      return displayName.includes(normalizedQuery) || lastMessage.includes(normalizedQuery);
    };

    const matchesFilter = (conversation) => {
      if (conversationFilter === "all") return true;
      if (conversationFilter === "unread") return conversation.unread_count > 0;
      return conversation.conversation_type === conversationFilter;
    };

    return {
      direct: conversations.direct.filter((conversation) => matchesFilter(conversation) && matchesSearch(conversation)),
      group: conversations.group.filter((conversation) => matchesFilter(conversation) && matchesSearch(conversation))
    };
  }, [conversationFilter, conversations, deferredSideSearchQuery, user?.id]);

  const filteredMessages = useMemo(() => {
    if (!deferredThreadSearchQuery.trim()) return activeConversationMessages;
    return activeConversationMessages.filter((message) => messageMatchesQuery(message, deferredThreadSearchQuery));
  }, [activeConversationMessages, deferredThreadSearchQuery]);

  const groupedMessages = useMemo(
    () => groupMessagesByDay(filteredMessages),
    [filteredMessages]
  );

  const sharedAttachments = useMemo(
    () => (
      activeConversationMessages
        .flatMap((message) => (
          (message.attachments || []).map((attachment) => ({
            ...attachment,
            message_id: message.id,
            sent_at: message.created_at,
            sender_name: message.user_name
          }))
        ))
        .sort((left, right) => new Date(right.sent_at) - new Date(left.sent_at))
    ),
    [activeConversationMessages]
  );

  const availableUsers = useMemo(
    () => users.filter((candidate) => Number(candidate.id) !== Number(user?.id)),
    [user?.id, users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = deferredUserSearchTerm.trim().toLowerCase();
    if (!normalizedQuery) return availableUsers;

    return availableUsers.filter((candidate) => {
      const haystack = [
        getFullUserName(candidate),
        candidate.email,
        candidate.job_title
      ].join(" ").toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [availableUsers, deferredUserSearchTerm]);

  const selectedUsers = useMemo(
    () => availableUsers.filter((candidate) => selectedUserIds.includes(candidate.id)),
    [availableUsers, selectedUserIds]
  );

  const conversationStarterSuggestions = useMemo(() => {
    if (!activeConversation) return [];
    if (activeConversation.conversation_type === "group") {
      return [
        "Quick update: here is where we stand today.",
        "What are the top blockers we should solve next?",
        "Sharing the latest version for feedback."
      ];
    }

    return [
      `Hi ${activeConversationOtherParticipant?.name || "there"}, are you free for a quick update?`,
      "Sending over the latest note now.",
      "Can we sync on the next step here?"
    ];
  }, [activeConversation, activeConversationOtherParticipant?.name]);

  const handleToggleReaction = async (messageId, emoji, isActive) => {
    if (!conversationId) return;

    try {
      if (isActive) await removeMessageReaction(conversationId, messageId, emoji);
      else await addMessageReaction(conversationId, messageId, emoji);
    } catch (error) {
      console.error("Failed to update reaction", error);
    }
  };

  const handleAddAttachments = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;

    setAttachments((previous) => [...previous, ...nextFiles]);
    event.target.value = "";
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if ((!messageBody.trim() && attachments.length === 0) || !conversationId) return;

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("message[body]", messageBody);
      attachments.forEach((file) => formData.append("message[attachments][]", file));

      const { data: newMessage } = await sendMessage(conversationId, formData);

      setActiveConversation((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          messages: [...(previous.messages || []), newMessage]
        };
      });

      setMessageBody("");
      setAttachments([]);
      fetchAllData();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
      setIsSending(false);
    }
  };

  const handleSelectUser = (userId) => {
    if (newChatMode === "direct") {
      setSelectedUserIds([userId]);
      return;
    }

    setSelectedUserIds((previous) => (
      previous.includes(userId)
        ? previous.filter((currentId) => currentId !== userId)
        : [...previous, userId]
    ));
  };

  const handleContinueNewChat = async () => {
    if (newChatMode === "direct") {
      if (!selectedUserIds[0]) return;

      try {
        const { data } = await startDirectConversation(selectedUserIds[0]);
        setIsNewChatModalOpen(false);
        navigate(`/chat/${data.id}`);
        fetchAllData();
      } catch (error) {
        console.error("Failed to start direct conversation", error);
      }

      return;
    }

    if (newChatStep === "select") {
      if (selectedUserIds.length < 2) return;
      setNewChatStep("details");
      return;
    }

    if (!newGroupTitle.trim()) return;

    try {
      const { data } = await createConversation({
        title: newGroupTitle,
        conversation_type: "group",
        participant_ids: selectedUserIds
      });

      setIsNewChatModalOpen(false);
      resetNewChatModal("group");
      navigate(`/chat/${data.id}`);
      fetchAllData();
    } catch (error) {
      console.error("Failed to create group", error);
    }
  };

  const threadStatusLabel = typingNames.length > 0
    ? `${typingNames.join(", ")} ${typingNames.length === 1 ? "is" : "are"} typing...`
    : activeConversation?.conversation_type === "group"
      ? `${activeConversation?.participants?.length || 0} members • updated ${activeConversation?.updated_at ? formatDistanceToNow(new Date(activeConversation.updated_at), { addSuffix: true }) : "recently"}`
      : activeConversationOtherParticipant?.job_title || "Private conversation";

  const sidebarEmpty = filteredConversations.direct.length === 0 && filteredConversations.group.length === 0;

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-[linear-gradient(135deg,#eef6ff_0%,#f8fbff_45%,#f8f5ff_100%)] p-2 md:p-4 dark:bg-[linear-gradient(135deg,#09090b_0%,#111827_55%,#09090b_100%)]">
      <div className="relative flex h-full w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/30 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.14),transparent_24%)]" />

        <aside className={`relative z-10 flex w-full flex-col border-r border-white/60 bg-white/74 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/72 md:w-[24rem] xl:w-[27rem] ${conversationId ? "hidden md:flex" : "flex"}`}>
          <div className="border-b border-white/70 px-5 pb-5 pt-6 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-sky-500">Inbox</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Messages</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {allConversations.length} conversations across direct messages and group rooms
                </p>
              </div>

              <button
                type="button"
                onClick={() => openNewChatModal("direct")}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,1)] transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                title="Start a new conversation"
              >
                <FiEdit className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <StatCard icon={<FiMessageSquare className="h-4 w-4" />} label="Unread" value={totalUnreadCount} accentClass="bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200" />
              <StatCard icon={<FiZap className="h-4 w-4" />} label="Direct" value={conversations.direct.length} accentClass="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200" />
              <StatCard icon={<FiUsers className="h-4 w-4" />} label="Groups" value={conversations.group.length} accentClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200" />
            </div>
          </div>

          <div className="border-b border-white/70 px-5 py-4 dark:border-zinc-800">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={sideSearchQuery}
                onChange={(event) => setSideSearchQuery(event.target.value)}
                placeholder="Search by person, room, or last message"
                className="w-full rounded-2xl border border-white/70 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-950/50"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {CONVERSATION_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setConversationFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    conversationFilter === filter.id
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="scrollbar-hide relative flex-1 overflow-y-auto px-4 py-5">
            {sidebarEmpty ? (
              <div className="mx-2 rounded-[26px] border border-dashed border-slate-200 bg-white/80 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200">
                  <FiSearch className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No conversations match</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Try a broader search or start a fresh conversation.
                </p>
                <button
                  type="button"
                  onClick={() => openNewChatModal("direct")}
                  className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 dark:bg-white dark:text-slate-950"
                >
                  Start new chat
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredConversations.direct.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Direct Messages</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Focused 1:1 conversations</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-zinc-900 dark:text-slate-300">
                        {filteredConversations.direct.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredConversations.direct.map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          currentUserId={user?.id}
                          isActive={Number(conversationId) === Number(conversation.id)}
                          searchQuery={deferredSideSearchQuery}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {filteredConversations.group.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Group Rooms</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shared threads for teams and projects</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openNewChatModal("group")}
                        className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110 dark:bg-white dark:text-slate-950"
                      >
                        New Group
                      </button>
                    </div>

                    <div className="space-y-2">
                      {filteredConversations.group.map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          currentUserId={user?.id}
                          isActive={Number(conversationId) === Number(conversation.id)}
                          searchQuery={deferredSideSearchQuery}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className={`relative z-10 flex min-w-0 flex-1 flex-col ${!conversationId ? "hidden md:flex" : "flex"}`}>
          {conversationId && isConversationLoading ? (
            <div className="relative flex flex-1 items-center justify-center p-6 md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.6),rgba(248,250,252,0.72))] dark:bg-[linear-gradient(180deg,rgba(9,9,11,0.72),rgba(17,24,39,0.82))]" />
              <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/80 bg-white/78 p-8 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/78">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
                    <div className="h-3 w-48 animate-pulse rounded-full bg-slate-100 dark:bg-zinc-900" />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`flex ${item % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <div className="h-20 w-[70%] animate-pulse rounded-[24px] bg-slate-200/80 dark:bg-zinc-800/90" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !activeConversation ? (
            <div className="relative flex flex-1 items-center justify-center p-6 md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.6),rgba(248,250,252,0.72))] dark:bg-[linear-gradient(180deg,rgba(9,9,11,0.72),rgba(17,24,39,0.82))]" />
              <div className="relative z-10 max-w-xl rounded-[32px] border border-white/80 bg-white/78 p-8 text-center shadow-[0_30px_70px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/78">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,1)]">
                  <FiMessageSquare className="h-9 w-9" />
                </div>
                <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.34em] text-sky-500">Workspace Chat</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">A cleaner inbox for fast team conversations</h2>
                <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Pick a conversation from the left, search your history, or start a new room with the people you need.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <StatCard icon={<FiLayers className="h-4 w-4" />} label="Threads" value={allConversations.length} accentClass="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200" />
                  <StatCard icon={<FiZap className="h-4 w-4" />} label="Unread" value={totalUnreadCount} accentClass="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200" />
                  <StatCard icon={<FiUsers className="h-4 w-4" />} label="Teams" value={conversations.group.length} accentClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200" />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => openNewChatModal("direct")}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 dark:bg-white dark:text-slate-950"
                  >
                    Start new chat
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewChatModal("group")}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800"
                  >
                    Create group room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <header className="relative z-20 border-b border-white/70 bg-white/70 px-4 py-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/72 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Link
                      to="/chat"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 md:hidden"
                    >
                      <FiArrowLeft className="h-5 w-5" />
                    </Link>

                    {activeConversation.conversation_type === "direct" ? (
                      <Avatar name={activeConversationName} src={activeConversationImage} size="lg" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700 ring-2 ring-white/90 dark:from-sky-950/60 dark:to-cyan-950/40 dark:text-sky-200">
                        <FiUsers className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                          {activeConversationName}
                        </h2>
                        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
                          {activeConversation.conversation_type === "group" ? "Group" : "Direct"}
                        </span>
                      </div>
                      <p className={`mt-1 truncate text-sm ${typingNames.length > 0 ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"}`}>
                        {threadStatusLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsThreadSearchOpen((previous) => !previous);
                        if (isThreadSearchOpen) setThreadSearchQuery("");
                      }}
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                        isThreadSearchOpen
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                      }`}
                      title="Search in conversation"
                    >
                      <FiSearch className="h-4.5 w-4.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowInfo((previous) => !previous)}
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                        showInfo
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                      }`}
                      title="Conversation details"
                    >
                      <FiInfo className="h-4.5 w-4.5" />
                    </button>

                    <button
                      type="button"
                      className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800 md:flex"
                      title="More actions"
                    >
                      <FiMoreVertical className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isThreadSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4"
                    >
                      <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={threadSearchQuery}
                          onChange={(event) => setThreadSearchQuery(event.target.value)}
                          placeholder="Search messages, people, or attachments in this thread"
                          className="w-full rounded-2xl border border-white/70 bg-white/82 py-3 pl-11 pr-11 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-950/50"
                          autoFocus
                        />
                        {threadSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setThreadSearchQuery("")}
                            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </header>

              <div className="relative flex min-h-0 flex-1 overflow-hidden">
                <div className="relative flex min-w-0 flex-1 flex-col">
                  <div
                    ref={messageListRef}
                    className="scrollbar-hide relative flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6"
                    style={{
                      backgroundImage: "radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(56,189,248,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(248,250,252,0.78))"
                    }}
                  >
                    <div className="mx-auto flex max-w-4xl flex-col gap-6">
                      <div className="sticky top-0 z-10 flex justify-center">
                        <span className="rounded-full border border-white/80 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-slate-300">
                          {deferredThreadSearchQuery.trim()
                            ? `${filteredMessages.length} match${filteredMessages.length === 1 ? "" : "es"} for "${deferredThreadSearchQuery}"`
                            : `${activeConversationName} • ${activeConversationMessages.length} messages`}
                        </span>
                      </div>

                      {activeConversationMessages.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/76 px-6 py-10 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/72">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200">
                            <FiMessageSquare className="h-7 w-7" />
                          </div>
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">This conversation is empty</h3>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Start with a clear opener, a status update, or a quick request.
                          </p>

                          <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {conversationStarterSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => setMessageBody(suggestion)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : groupedMessages.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/76 px-6 py-10 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/72">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                            <FiSearch className="h-7 w-7" />
                          </div>
                          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">No messages found</h3>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Try a different keyword or clear the thread search to see the full conversation.
                          </p>
                        </div>
                      ) : (
                        groupedMessages.map((group) => (
                          <div key={group.dateKey} className="space-y-4">
                            <div className="flex justify-center">
                              <span className="rounded-full border border-white/80 bg-white/92 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/92 dark:text-slate-400">
                                {group.label}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {group.messages.map((message, index) => {
                                const previousMessage = group.messages[index - 1];
                                const showAvatar = !previousMessage || !isSameDay(new Date(previousMessage.created_at), new Date(message.created_at)) || Number(previousMessage.user_id) !== Number(message.user_id);

                                return (
                                  <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isMe={Number(message.user_id) === Number(user?.id)}
                                    showAvatar={showAvatar}
                                    onToggleReaction={handleToggleReaction}
                                    participants={activeConversation.participants}
                                    searchQuery={deferredThreadSearchQuery}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}

                      <AnimatePresence>
                        {typingNames.length > 0 && !deferredThreadSearchQuery.trim() && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="flex items-center gap-3 rounded-full border border-emerald-100 bg-white/88 px-4 py-2 text-xs font-medium text-emerald-600 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-zinc-900/88 dark:text-emerald-300"
                          >
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "120ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "240ms" }} />
                            </div>
                            <span>
                              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="border-t border-white/70 bg-white/76 px-4 py-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/76 md:px-6">
                    <div className="mx-auto max-w-4xl">
                      {attachments.length > 0 && (
                        <div className="scrollbar-hide mb-4 flex gap-3 overflow-x-auto pb-1">
                          {attachments.map((file, index) => {
                            const previewUrl = attachmentPreviewUrls[index];
                            const isImage = file.type.startsWith("image/");

                            return (
                              <div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                className="relative w-40 shrink-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                              >
                                {isImage && previewUrl ? (
                                  <div className="overflow-hidden rounded-2xl">
                                    <img src={previewUrl} alt={file.name} className="h-24 w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-300">
                                    <FiPaperclip className="h-6 w-6" />
                                  </div>
                                )}

                                <div className="mt-2 px-1">
                                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">{file.name}</p>
                                  <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                    {isImage ? "Image" : "Attachment"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setAttachments((previous) => previous.filter((_, currentIndex) => currentIndex !== index))}
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-white transition hover:bg-slate-950"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <form
                        onSubmit={handleSendMessage}
                        className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.98))] p-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-zinc-700 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))]"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleAddAttachments}
                        />

                        <div className="flex items-end gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                            title="Add attachments"
                          >
                            <FiPaperclip className="h-5 w-5" />
                          </button>

                          <div className="min-w-0 flex-1 rounded-[24px] border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                            <textarea
                              ref={composerTextareaRef}
                              value={messageBody}
                              onChange={(event) => {
                                setMessageBody(event.target.value);
                                sendTyping(true);

                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = window.setTimeout(() => {
                                  sendTyping(false);
                                }, 1800);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  handleSendMessage(event);
                                }
                              }}
                              rows={1}
                              placeholder="Write a message..."
                              className="max-h-40 min-h-[28px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <FiClock className="h-3.5 w-3.5" />
                                  Enter to send
                                </span>
                                <span>Shift + Enter for new line</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {attachments.length > 0 && (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-zinc-800">
                                    {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
                                  </span>
                                )}
                                {messageBody.trim() && (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                                    Draft ready
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSending || (!messageBody.trim() && attachments.length === 0)}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,1)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none dark:bg-white dark:text-slate-950"
                            title="Send message"
                          >
                            <FiSend className={`h-5 w-5 ${isSending ? "animate-pulse" : ""}`} />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showInfo && (
                    <>
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInfo(false)}
                        className="absolute inset-0 z-20 bg-slate-950/20 backdrop-blur-sm lg:hidden"
                      />

                      <motion.aside
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-white/70 bg-white/88 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/92"
                      >
                        <div className="flex items-center justify-between border-b border-white/70 px-5 py-4 dark:border-zinc-800">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-sky-500">Conversation</p>
                            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Details & shared files</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowInfo(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                          >
                            <FiX className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-5">
                          <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.6)] dark:border-zinc-800 dark:bg-zinc-900/72">
                            {activeConversation.conversation_type === "direct" ? (
                              <Avatar name={activeConversationName} src={activeConversationImage} size="xl" className="mx-auto" />
                            ) : (
                              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-cyan-50 text-sky-700 dark:from-sky-950/60 dark:to-cyan-950/40 dark:text-sky-200">
                                <FiUsers className="h-8 w-8" />
                              </div>
                            )}

                            <h4 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{activeConversationName}</h4>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                              {activeConversation.conversation_type === "group"
                                ? "Shared room for ongoing collaboration"
                                : `Private chat${activeConversationOtherParticipant?.job_title ? ` • ${activeConversationOtherParticipant.job_title}` : ""}`}
                            </p>

                            <div className="mt-5 grid grid-cols-3 gap-3 text-left">
                              <StatCard icon={<FiMessageSquare className="h-4 w-4" />} label="Messages" value={activeConversationMessages.length} accentClass="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200" />
                              <StatCard icon={<FiPaperclip className="h-4 w-4" />} label="Files" value={sharedAttachments.length} accentClass="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200" />
                              <StatCard icon={<FiUsers className="h-4 w-4" />} label="Members" value={activeConversation.participants?.length || 0} accentClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200" />
                            </div>
                          </div>

                          <section className="mt-6">
                            <div className="mb-3 flex items-center gap-2">
                              <FiUsers className="h-4 w-4 text-slate-400" />
                              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                Members ({activeConversation.participants?.length || 0})
                              </p>
                            </div>

                            <div className="space-y-3">
                              {(activeConversation.participants || []).map((participant) => (
                                <div
                                  key={participant.id}
                                  className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/72 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/72"
                                >
                                  <Avatar name={participant.name} src={participant.profile_picture} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{participant.name}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {formatParticipantStatus(participant, user?.id)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="mt-6">
                            <div className="mb-3 flex items-center gap-2">
                              <FiPaperclip className="h-4 w-4 text-slate-400" />
                              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Shared files</p>
                            </div>

                            {sharedAttachments.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/72 p-4 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/72 dark:text-slate-400">
                                No shared files in this conversation yet.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sharedAttachments.slice(0, 8).map((attachment) => (
                                  <a
                                    key={`${attachment.message_id}-${attachment.id}`}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/72 px-3 py-3 transition hover:-translate-y-0.5 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/72 dark:hover:bg-zinc-900"
                                  >
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${attachment.content_type?.startsWith("image/") ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200" : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200"}`}>
                                      {attachment.content_type?.startsWith("image/") ? <FiImage className="h-5 w-5" /> : <FiFileText className="h-5 w-5" />}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{attachment.filename}</p>
                                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {attachment.sender_name} • {formatDistanceToNow(new Date(attachment.sent_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setIsNewChatModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-[0_40px_90px_-50px_rgba(15,23,42,1)] backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/95"
            >
              <div className="border-b border-white/70 px-6 py-5 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-sky-500">New conversation</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {newChatMode === "group" ? "Create a shared room" : "Start a direct chat"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {newChatMode === "group"
                        ? "Pick at least two people, then name the room."
                        : "Choose one teammate and jump straight into the thread."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                  >
                    <FiX className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="mt-5 flex gap-2">
                  {NEW_CHAT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => resetNewChatModal(mode.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        newChatMode === mode.id
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {newChatStep === "select" ? (
                <>
                  <div className="border-b border-white/70 px-6 py-4 dark:border-zinc-800">
                    <div className="relative">
                      <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, email, or title"
                        className="w-full rounded-2xl border border-white/70 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-950/50"
                        autoFocus
                      />
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedUsers.map((selectedUser) => (
                          <button
                            key={selectedUser.id}
                            type="button"
                            onClick={() => handleSelectUser(selectedUser.id)}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                          >
                            <span>{getFullUserName(selectedUser)}</span>
                            <FiX className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid gap-2">
                      {filteredUsers.map((candidate) => {
                        const selected = selectedUserIds.includes(candidate.id);

                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => handleSelectUser(candidate.id)}
                            className={`flex items-center gap-4 rounded-[24px] border px-4 py-3 text-left transition ${
                              selected
                                ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] dark:border-white dark:bg-white dark:text-slate-950"
                                : "border-white/70 bg-white/78 hover:border-slate-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/75 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <Avatar name={getFullUserName(candidate)} src={candidate.profile_picture} size="md" />

                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-semibold ${selected ? "text-current" : "text-slate-900 dark:text-white"}`}>
                                {getFullUserName(candidate)}
                              </p>
                              <p className={`mt-1 truncate text-xs ${selected ? "text-white/75 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"}`}>
                                {candidate.job_title || candidate.email}
                              </p>
                            </div>

                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${selected ? "border-current bg-white/10 dark:bg-slate-100" : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"}`}>
                              {selected ? <FiCheck className="h-4 w-4" /> : <FiHash className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/76 p-6 text-center text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/72 dark:text-slate-400">
                        No people match that search.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/70 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {newChatMode === "group"
                        ? `${selectedUserIds.length} selected • choose at least 2`
                        : selectedUserIds[0]
                          ? "1 person selected"
                          : "Choose 1 person"}
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueNewChat}
                      disabled={newChatMode === "group" ? selectedUserIds.length < 2 : !selectedUserIds[0]}
                      className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 dark:bg-white dark:text-slate-950"
                    >
                      {newChatMode === "group" ? "Continue" : "Start chat"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col">
                  <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-6">
                    <div className="rounded-[28px] border border-white/70 bg-white/78 p-5 dark:border-zinc-800 dark:bg-zinc-900/75">
                      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Selected members</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedUsers.map((selectedUser) => (
                          <span
                            key={selectedUser.id}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                          >
                            {getFullUserName(selectedUser)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[28px] border border-white/70 bg-white/78 p-5 dark:border-zinc-800 dark:bg-zinc-900/75">
                      <label className="block text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                        Group name
                      </label>
                      <input
                        value={newGroupTitle}
                        onChange={(event) => setNewGroupTitle(event.target.value)}
                        placeholder="e.g. Product Launch, Design Reviews, Sprint Room"
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-950/50"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/70 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <button
                      type="button"
                      onClick={() => setNewChatStep("select")}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueNewChat}
                      disabled={!newGroupTitle.trim()}
                      className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 dark:bg-white dark:text-slate-950"
                    >
                      Create group
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
