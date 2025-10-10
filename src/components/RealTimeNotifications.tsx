import { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewRecordNotification {
  id: string;
  table_name: 'prospects' | 'rfps' | 'client_needs';
  record_id: string;
  notification_type: 'new_rfp' | 'new_prospect' | 'new_client_need';
  assigned_to: string;
  created_by: string;
  creator_trigram: string;
  creator_name: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const NOTIFICATION_TYPE_ICONS = {
  new_rfp: '📋',
  new_prospect: '👤',
  new_client_need: '💼'
};

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<NewRecordNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        loadNotifications();
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('new-record-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'new_record_notifications',
          filter: `assigned_to=eq.${currentUserId}`
        },
        (payload) => {
          const newNotif = payload.new as NewRecordNotification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          showBrowserNotification(newNotif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('new_record_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const showBrowserNotification = (notif: NewRecordNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nouvelle attribution`, {
        body: notif.message,
        icon: '/logo.png'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('new_record_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('new_record_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    title="Tout marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune notification
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {NOTIFICATION_TYPE_ICONS[notif.notification_type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white mb-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Marquer comme lu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
