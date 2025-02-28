const router = require('express').Router();
const passport = require('passport');

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', 
    passport.authenticate('discord', {
        successRedirect: '/dashboard',
        failureRedirect: '/'
    })
);

router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router;
