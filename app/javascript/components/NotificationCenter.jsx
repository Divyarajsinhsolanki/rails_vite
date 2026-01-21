import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Bell, Check, Clock, MessageSquare, Briefcase, FileText } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from './api';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetchNotifications({ page: 1 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.meta.unread_count);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all read", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action) => {
    switch (action) {
      case 'commented': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'assigned': return <Briefcase className="w-4 h-4 text-green-500" />;
      case 'update': return <FileText className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`
              group inline-flex items-center justify-center rounded-full p-2
              text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
              ${open ? 'text-gray-900 bg-gray-100' : ''}
            `}
          >
            <span className="sr-only">Notifications</span>
            <div className="relative">
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 sm:w-96 transform px-4 sm:px-0 lg:max-w-3xl">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-medium text-gray-900">Notifications</h2>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={loading}
                        className="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">No notifications yet</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`relative flex items-start p-3 -m-3 rounded-lg transition duration-150 ease-in-out ${notification.read_at ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                            }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {notification.actor_avatar && (
                              <img
                                src={notification.actor_avatar}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover border border-gray-200"
                              />
                            )}
                            {!notification.actor_avatar && (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                {getIcon(notification.action)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <p className={`text-sm ${notification.read_at ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Just now'}
                            </p>
                          </div>
                          {!notification.read_at && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none"
                              title="Mark as read"
                            >
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 text-center">
                  <a href="/notifications" className="text-xs font-medium text-gray-600 hover:text-gray-900">
                    View full history
                  </a>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default NotificationCenter;
