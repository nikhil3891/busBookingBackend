import Notification from '../models/notificationModel';
import User from '../models/usersModel';

export async function createNotification(payload: any) {
  const n = new Notification(payload);
  await n.save();

  // optionally: push to DB or pub/sub to send push notifications or emails
  // If target == 'all' we could trigger a background job to send push notifications
  return n;
}

export async function listNotifications(userId: any | null, onlyActive = true) {
  const q: any = {};
  if (onlyActive) {
    q.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ];
  }
  // admin can target specific users; here we return all notifications that match either 'all' or targeted to user
  const all = await Notification.find(q).sort({ createdAt: -1 }).limit(200);
  return all.filter((n: any) => {
    if (n.target === 'all') return true;
    if (n.target === 'users' && userId) return n.targetIds.map(String).includes(String(userId));
    return true;
  });
}
export async function updateNotification(id: string, updates: any) {
  const n = await Notification.findByIdAndUpdate(id, updates, { new: true });
  if (!n) throw new Error('Notification not found');
  return n;
}   
export async function deleteNotification(id: string) {
  const n = await Notification.findByIdAndDelete(id);
  if (!n) throw new Error('Notification not found');
  return { message: 'Notification deleted' };
}   

