const router = require('express').Router();
const { ensureAuthenticated } = require('../middleware/auth');
const config = require('../middleware/config');
const User = require('../models/User');
const File = require('../models/File');
const multer = require('multer');
const path = require('path');
const { sendLog } = require('../utils/discord');
const { version } = require('../package.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: config.storage.upload_dir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: config.storage.max_file_size },
    fileFilter: (req, file, cb) => {
        const allowedTypes = config.storage.allowed_types;
        const isAllowed = allowedTypes.some(type => {
            const regex = new RegExp(type.replace('*', '.*'));
            return regex.test(file.mimetype);
        });
        cb(null, isAllowed);
    }
});

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Calculate total storage used from files
        const userFiles = await File.find({ owner: user._id });
        const storageUsed = userFiles.reduce((total, file) => total + file.size, 0);
        
        const activeShares = await File.countDocuments({
            owner: user._id,
            shareToken: { $exists: true }
        });

        // Get tier directly from config
        const userTier = Object.values(config.tiers).find(tier => 
            tier.users?.includes(user.discordId)
        ) || config.tiers.free;

        // Update storage usage
        user.storageUsed = storageUsed;
        user.activeShares = activeShares;
        await user.save();

        res.render('dashboard', {
            user,
            tier: userTier,
            config,
            version: version,
            formatBytes: (bytes) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            }
        });
    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).send('Server Error');
    }
});
router.post('/upload', ensureAuthenticated, upload.array('files'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);

        if (user.storageUsed + totalSize > user.storageLimit) {
            return res.status(400).json({ error: 'Storage limit exceeded' });
        }

        const formatBytes = (bytes) => {
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Byte';
            const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        };

        const filePromises = req.files.map(file => {
            const savedFile = File.create({
                name: file.filename,
                originalName: file.originalname,
                type: file.mimetype,
                size: file.size,
                path: file.path,
                owner: user._id
            });

            sendLog('file_uploaded', {
                username: req.user.username,
                fileName: file.originalname,
                fileSize: formatBytes(file.size),
                fileType: file.mimetype
            });

            return savedFile;
        });

        const savedFiles = await Promise.all(filePromises);
        
        user.files.push(...savedFiles.map(file => file._id));
        user.storageUsed += totalSize;
        user.totalFiles += req.files.length;
        await user.save();

        res.json({ success: true, files: savedFiles });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});


module.exports = router;