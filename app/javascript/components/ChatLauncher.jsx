import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { fetchConversations } from "./api";

const ChatLauncher = () => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchConversations();
        setConversations(Array.isArray(data) ? data : []);
      } catch (error) {
        // ignore for logged out state
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = useMemo(() => conversations.reduce((count, conversation) => count + (conversation.unread_count || 0), 0), [conversations]);

  return (
    <Link to="/chat" className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700">
      <MessageCircle size={18} />
      Chat
      {unreadCount > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{unreadCount}</span>}
    </Link>
  );
};

export default ChatLauncher;
