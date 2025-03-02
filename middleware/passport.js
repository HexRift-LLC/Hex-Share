const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');
const config = require('./config');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new DiscordStrategy({
    clientID: config.discord.client_id,
    clientSecret: config.discord.client_secret,
    callbackURL: config.discord.callback_url,
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });
        
        // Construct Discord CDN avatar URL
        const avatarURL = profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator) % 5}.png`;
        
        if (!user) {
            user = await User.create({
                discordId: profile.id,
                username: profile.username,
                email: profile.email,
                avatar: avatarURL,
                storageLimit: 1024 * 1024 * 1024
            });
        } else {
            // Update avatar URL on each login
            user.avatar = avatarURL;
            await user.save();
        }
        
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));


