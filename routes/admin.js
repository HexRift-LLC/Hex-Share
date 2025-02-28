const router = require('express').Router();
const { ensureAdmin, ensureAuthenticated  } = require('../middleware/auth');
const User = require('../models/User');
const File = require('../models/File');
const Activity = require('../models/Activity');
const config = require('../config/config');

router.get('/users/:id', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

router.get('/', ensureAdmin, async (req, res) => {
    try {
        // Gather stats
        const totalUsers = await User.countDocuments();
        const totalFiles = await File.countDocuments();
        const totalStorage = await File.aggregate([
            { $group: { _id: null, total: { $sum: "$size" } } }
        ]);

        // Get recent activities
        const activities = await Activity.find()
            .populate('user', 'username avatar')
            .sort('-date')
            .limit(10);

        // Calculate growth rates
        const lastWeekUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
        });

        const stats = {
            totalUsers,
            totalFiles,
            totalStorage: totalStorage[0]?.total || 0,
            storagePercentage: 45, // Calculate based on your limits
            userGrowth: ((lastWeekUsers / totalUsers) * 100).toFixed(1),
            fileGrowth: 8 // Calculate similar to userGrowth
        };

        res.render('admin', {
            user: req.user,
            stats,
            activities,
            config: config,  // Add this line
            formatBytes: (bytes) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add user management routes
router.get('/users', ensureAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

router.put('/users/:id', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            username: req.body.username,
            tier: req.body.tier,
            storageLimit: req.body.storageLimit
        }, { new: true });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});


// Add file management routes
router.get('/files', ensureAdmin, async (req, res) => {
    const files = await File.find().populate('owner', 'username');
    res.json(files);
});

router.delete('/files/:id', ensureAdmin, async (req, res) => {
    await File.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

router.get('/users/:id', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

router.delete('/users/:id', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


module.exports = router;