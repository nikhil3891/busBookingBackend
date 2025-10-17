// src/passport/jwt.strategy.ts
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import env from '../config/env';
import User from '../models/usersModel';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.jwtSecret
};

passport.use(new JwtStrategy(opts, async (payload, done) => {
  try {
    const user = await User.findById(payload.sub).select('-otp -otpExpiresAt -refreshTokens -password');
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));
