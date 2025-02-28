const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: String,
    avatar: String,
    email: String,
    isPremium: { type: Boolean, default: true },
    storageUsed: { type: Number, default: 0 },
    totalFiles: { type: Number, default: 0 },
    activeShares: { type: Number, default: 0 },
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],
    createdAt: { type: Date, default: Date.now },
    tier: {
        type: String,
        enum: ['free', 'standard', 'premium'],
        default: 'free'
    },
    storageLimit: {
        type: Number,
        default: function() {
            switch(this.tier) {
                case 'premium': return 1024 * 1024 * 1024 * 50; // 50GB
                case 'standard': return 1024 * 1024 * 1024 * 10; // 10GB
                default: return 1024 * 1024 * 1024 * 2; // 2GB
            }
        }
    }
});
module.exports = mongoose.model('User', userSchema);
