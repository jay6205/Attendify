import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.CLIENT_URL+"/api/v1/auth/google/callback",
            // proxy:true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists by googleId
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // Check if user exists by email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Update user with googleId if they have same email
                    user.googleId = profile.id;
                    // If name wasn't set (unlikely for existing users but possible with new schema changes), set it
                    if (!user.name) user.name = profile.displayName;
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    // passwordHash not required as we made it optional in model
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
