const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: String,
    originalName: String,
    type: String,
    size: Number,
    path: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    uploadedAt: { type: Date, default: Date.now },
    shareToken: String,
    shareExpiry: Date
});

module.exports = mongoose.model('File', fileSchema);
