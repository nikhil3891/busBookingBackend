import cron from 'node-cron';
import User from '../models/usersModel';

const REFRESH_EXPIRES_DAYS = 7;

export function scheduleTokenCleanup() {
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Running daily refreshToken cleanup...');
    const users = await User.find({ 'refreshTokens.0': { $exists: true } });

    const now = new Date();
    for (const user of users) {
      if (!user.refreshTokens) continue; // ✅ prevent TS error
      user.refreshTokens = user.refreshTokens.filter(rt => {
        const expiry = new Date(rt.createdAt);
        expiry.setDate(expiry.getDate() + REFRESH_EXPIRES_DAYS);
        return expiry > now;
      });
      await user.save();
    }
    console.log('✅ Token cleanup done');
  });
}
