const router = require('express').Router();
const { ensureAuthenticated } = require('../middleware/auth');
const config = require('../config/config');
const File = require('../models/File');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto'); // Add this line
const { sendLog } = require('../utils/discord');

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const files = await File.find({ owner: req.user._id })
            .sort({ uploadedAt: -1 });

        res.render('files', {
            user: req.user,
            config,
            files,
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
                    day: 'numeric'
                });
            },
            getFileIcon: (type) => {
                const icons = {
                    'image': 'fa-image',
                    'video': 'fa-video',
                    'audio': 'fa-music',
                    'application/pdf': 'fa-file-pdf',
                    'application/zip': 'fa-file-archive',
                    'text': 'fa-file-alt',
                    'default': 'fa-file'
                };
                return icons[type.split('/')[0]] || icons[type] || icons.default;
            }
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/download/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { sharedWith: req.user._id }
            ]
        });

        if (!file) {
            return res.status(404).send('File not found');
        }

        sendLog('file_downloaded', {
            username: req.user.username,
            fileName: file.originalName,
            fileId: file._id.toString()
        });

        res.download(file.path, file.originalName);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).send('Download failed');
    }
});

router.post('/share/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const shareToken = crypto.randomBytes(32).toString('hex');
        file.shareToken = shareToken;
        await file.save();

        const shareLink = `${req.protocol}://${req.get('host')}/files/shared/${shareToken}`;
        
        sendLog('file_shared', {
            username: req.user.username,
            fileName: file.originalName,
            fileId: file._id.toString()
        });

        res.json({ success: true, shareLink });
    } catch (err) {
        console.error('Share error:', err);
        res.status(500).json({ error: 'Failed to generate share link' });
    }
});
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Update user storage and file count
        const user = await User.findById(req.user._id);
        user.storageUsed -= file.size;
        user.totalFiles -= 1;
        user.files = user.files.filter(f => f.toString() !== file._id.toString());
        await user.save();
        
        // Send discord log
        sendLog('file_deleted', {
            username: req.user.username,
            fileName: file.name,
            fileId: file._id
        });

        // Delete file from storage
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.log('File already removed from storage');
        }
    
        // Delete file document using deleteOne()
        await File.deleteOne({ _id: file._id });

        res.json({ success: true });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

router.get('/preview/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (file) {
            res.sendFile(path.resolve(file.path));
        } else {
            res.status(404).send('File not found');
        }
    } catch (err) {
        res.status(500).send('Error loading preview');
    }
});


router.get('/shared/:token', async (req, res) => {
    try {
        const file = await File.findOne({ shareToken: req.params.token })
            .populate('owner', 'username');
        
        if (!file) {
            return res.status(404).send('File not found or link expired');
        }

        res.render('shared', {
            file,
            config,
            formatBytes: (bytes) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            },
            getFileIcon: (type) => {
                const icons = {
                    'image': 'fa-image',
                    'video': 'fa-video',
                    'audio': 'fa-music',
                    'application/pdf': 'fa-file-pdf',
                    'text': 'fa-file-alt',
                    'default': 'fa-file'
                };
                return icons[type] || icons.default;
            }
        });
    } catch (err) {
        res.status(500).send('Error loading shared file');
    }
});



module.exports = router;
