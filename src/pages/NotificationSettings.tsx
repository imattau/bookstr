import React from 'react';
import { useSettings } from '../useSettings';
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '../push';
import { useNotificationSettings } from '../useNotificationSettings';

const NotificationSettingsPage: React.FC = () => {
  const newBooks = useNotificationSettings((s) => s.newBooks);
  const zapReceipts = useNotificationSettings((s) => s.zapReceipts);
  const chatMentions = useNotificationSettings((s) => s.chatMentions);
  const setNewBooks = useNotificationSettings((s) => s.setNewBooks);
  const setZapReceipts = useNotificationSettings((s) => s.setZapReceipts);
  const setChatMentions = useNotificationSettings((s) => s.setChatMentions);

  const pushEnabled = useSettings((s) => s.pushEnabled);
  const setPushEnabled = useSettings((s) => s.setPushEnabled);
  const [supportsPush, setSupportsPush] = React.useState(false);

  React.useEffect(() => {
    setSupportsPush(
      typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window,
    );
  }, []);

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    if (val) await registerPushSubscription();
    else await unregisterPushSubscription();
    setPushEnabled(val);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newBooks}
            onChange={(e) => setNewBooks(e.target.checked)}
          />
          New book notifications
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={zapReceipts}
            onChange={(e) => setZapReceipts(e.target.checked)}
          />
          Zap receipts
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={chatMentions}
            onChange={(e) => setChatMentions(e.target.checked)}
          />
          Chat mentions
        </label>
        {supportsPush && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={handlePushToggle}
            />
            Enable push notifications
          </label>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
