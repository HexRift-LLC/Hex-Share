const config = require('../config/config');

module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    },
    
    ensureAdmin: (req, res, next) => {
        if (req.isAuthenticated() && config.admin.default_admin_ids.includes(req.user.discordId)) {
            return next();
        }
        res.redirect('/dashboard');
    }
};