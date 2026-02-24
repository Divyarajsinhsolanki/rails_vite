import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, MessageSquare, Briefcase, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../components/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetchNotifications({ page: 1 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.meta?.unread_count || 0);
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error('Failed to load notifications', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const getIcon = (action) => {
    switch (action) {
      case 'commented':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'assigned':
        return <Briefcase className="w-4 h-4 text-green-500" />;
      case 'update':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li key={notification.id} className={`flex items-start gap-3 p-4 ${notification.read_at ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                  {notification.actor_avatar ? (
                    <img src={notification.actor_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    getIcon(notification.action)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${notification.read_at ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                    {notification.message}
                  </p>
                  <p className="mt-1 flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>

                {!notification.read_at && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="rounded p-1 text-blue-600 hover:bg-blue-100"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
