import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { env } from '../core/config/env.config';
import { User } from '../modules/user/user.model';
import { JwtPayload } from '../modules/auth/auth.types';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.jwt.secret,
};

passport.use(
  new JwtStrategy(opts, async (payload: JwtPayload, done) => {
    try {
      if (payload.type !== 'access') {
        return done(null, false);
      }

      const user = await User.findById(payload.sub).select(
        '-otp -otpExpiresAt -refreshTokens -password',
      );

      if (!user || !user.isActive) return done(null, false);

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }),
);

export default passport;
