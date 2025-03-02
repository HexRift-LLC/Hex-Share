const config = require('./config');

module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    },
    
    ensureAdmin: (req, res, next) => {
        if (req.isAuthenticated() && (req.user.discordId)) {
            return next();
        }
        res.redirect('/dashboard');
    }
};