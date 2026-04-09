import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, MessageSquare, Briefcase, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../components/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, actionFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchNotifications({
        page: 1,
        status: statusFilter,
        action_type: actionFilter === 'all' ? undefined : actionFilter
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.meta?.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications', error);
      setLoadError('Unable to load notifications right now. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      const justMarkedUnread = notifications.find((n) => n.id === id && !n.read_at);
      if (justMarkedUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
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

  const groupedNotifications = notifications
    .filter((notification) => {
      if (!query.trim()) return true;
      return notification.message?.toLowerCase().includes(query.toLowerCase());
    })
    .reduce((acc, notification) => {
      const notificationDate = notification.created_at ? new Date(notification.created_at) : new Date();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      let groupTitle = 'Earlier';
      if (notificationDate >= startOfToday) groupTitle = 'Today';
      else if (notificationDate >= startOfYesterday) groupTitle = 'Yesterday';

      if (!acc[groupTitle]) acc[groupTitle] = [];
      acc[groupTitle].push(notification);
      return acc;
    }, {});

  const groupOrder = ['Today', 'Yesterday', 'Earlier'];

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

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === option.value ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">All types</option>
            <option value="assigned">Assignments</option>
            <option value="commented">Comments</option>
            <option value="update">Updates</option>
            <option value="chat_message">Chat messages</option>
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : loadError ? (
          <div className="p-8 text-center text-sm text-red-600">{loadError}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No notifications match your filters</div>
        ) : (
          <div>
            {groupOrder.map((group) => {
              const entries = groupedNotifications[group];
              if (!entries?.length) return null;
              return (
                <div key={group}>
                  <div className="border-y border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {entries.map((notification) => (
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
