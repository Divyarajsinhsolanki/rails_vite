import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createConversation, fetchConversation, fetchConversations, getUsers, sendMessage } from "../components/api";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [attachments, setAttachments] = useState([]);

  const groupedConversations = useMemo(() => ({
    direct: conversations.filter((conversation) => conversation.conversation_type === "direct"),
    group: conversations.filter((conversation) => conversation.conversation_type === "group")
  }), [conversations]);

  const loadConversations = async () => {
    const { data } = await fetchConversations();
    setConversations(Array.isArray(data) ? data : []);
  };

  const loadConversation = async (id) => {
    if (!id) return;
    const { data } = await fetchConversation(id);
    setActiveConversation(data);
  };

  useEffect(() => {
    loadConversations();
    getUsers().then(({ data }) => setUsers(Array.isArray(data) ? data : []));

    const interval = setInterval(() => {
      loadConversations();
      if (conversationId) loadConversation(conversationId);
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!groupTitle || selectedUserIds.length === 0) return;

    const { data } = await createConversation({
      title: groupTitle,
      conversation_type: "group",
      participant_ids: selectedUserIds
    });

    setGroupTitle("");
    setSelectedUserIds([]);
    await loadConversations();
    navigate(`/chat/${data.id}`);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!conversationId) return;

    const formData = new FormData();
    formData.append("message[body]", messageBody);
    attachments.forEach((file) => formData.append("message[attachments][]", file));

    await sendMessage(conversationId, formData);
    setMessageBody("");
    setAttachments([]);
    await loadConversation(conversationId);
    await loadConversations();
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Chats</h2>

          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Direct</p>
          <div className="mb-4 space-y-2">
            {groupedConversations.direct.map((conversation) => (
              <Link key={conversation.id} to={`/chat/${conversation.id}`} className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span>{conversation.title}</span>
                  {conversation.unread_count > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{conversation.unread_count}</span>}
                </div>
              </Link>
            ))}
          </div>

          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Groups</p>
          <div className="space-y-2">
            {groupedConversations.group.map((conversation) => (
              <Link key={conversation.id} to={`/chat/${conversation.id}`} className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span>{conversation.title}</span>
                  {conversation.unread_count > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{conversation.unread_count}</span>}
                </div>
              </Link>
            ))}
          </div>

          <form onSubmit={handleCreateGroup} className="mt-5 space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Create Group</p>
            <input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Group name" className="w-full rounded border px-2 py-1 text-sm" />
            <select multiple value={selectedUserIds.map(String)} onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))} className="h-28 w-full rounded border px-2 py-1 text-sm">
              {users.map((user) => <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>)}
            </select>
            <button className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Create</button>
          </form>
        </aside>

        <section className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
          {!activeConversation && <p className="text-sm text-gray-500">Open a conversation to start chatting.</p>}
          {activeConversation && (
            <>
              <h2 className="mb-3 text-lg font-semibold">{activeConversation.title}</h2>
              <div className="mb-4 h-[420px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
                {activeConversation.messages?.map((message) => (
                  <div key={message.id} className="mb-3 rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500">{message.user_name}</p>
                    {message.body && <p className="text-sm text-gray-800">{message.body}</p>}
                    <div className="mt-2 space-y-1">
                      {message.attachments?.map((attachment) => (
                        <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 underline">{attachment.filename}</a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="space-y-2">
                <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Type your message" className="w-full rounded border px-3 py-2 text-sm" rows={3} />
                <input type="file" accept="image/*,video/*" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} className="block w-full text-xs" />
                <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Chat;
