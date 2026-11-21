import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { api } from '../utils/api';
import { toast } from 'sonner';

export function InAppNotifications({ unreadOnly = false }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const unread = notifications.filter((item) => !item.isRead).length;
  const visibleNotifications = unreadOnly ? notifications.filter((item) => !item.isRead) : notifications;

  const refresh = async () => {
    try {
      const result = await api.getNotifications();
      if (result.error) {
        setLoadError(result.error);
        return;
      }
      setNotifications(result.notifications || []);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Unable to load notifications.');
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    const onRefresh = () => refresh();
    window.addEventListener('resqlink:notifications-refresh', onRefresh);
    return () => { clearInterval(interval); window.removeEventListener('resqlink:notifications-refresh', onRefresh); };
  }, []);

  const openNotification = async (item) => {
    if (!item.isRead) {
      const result = await api.markNotificationRead(item.id);
      if (result.error) {
        toast.error(`Could not mark notification as read: ${result.error}`);
        return;
      }
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, isRead: true } : notification));
    }
    setOpen(false);
    if (item.emergencyId) {
      navigate(item.type === 'message' ? `/chat/${item.emergencyId}` : `/tracking/${item.emergencyId}`);
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="icon" aria-label="Notifications" title="Notifications" onClick={() => { setOpen((value) => !value); refresh(); }}>
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute top-0 right-0 min-w-5 h-5 rounded-full bg-red-600 px-1 text-xs text-white flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900" role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between px-2 py-2">
            <h3 className="font-semibold">Notifications</h3>
            {unread > 0 && <span className="text-xs text-gray-500">{unread} unread</span>}
          </div>
          {loadError && <div className="mx-2 mb-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800" role="alert">{loadError}<Button type="button" variant="link" size="sm" onClick={refresh}>Retry</Button></div>}
          {visibleNotifications.length === 0 ? <p className="px-2 py-6 text-center text-sm text-gray-500">{unreadOnly ? "No new notifications." : "You’re all caught up."}</p> : visibleNotifications.map((item) => (
            <button key={item.id} type="button" onClick={() => openNotification(item)} className={`w-full rounded-md px-3 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${item.isRead ? 'opacity-70' : 'bg-orange-50 dark:bg-gray-800'}`}>
              <span className="flex items-center justify-between gap-2 font-medium">{item.title}{item.isRead && <Check className="h-4 w-4 text-green-600" />}</span>
              <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{item.message}</span>
              <span className="mt-1 block text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
