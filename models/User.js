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
});
module.exports = mongoose.model('User', userSchema);
