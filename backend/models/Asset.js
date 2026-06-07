const mongoose = require('mongoose');

// Define the structure of how an Asset (item) will be saved in MongoDB
const AssetSchema = new mongoose.Schema({
    assetName: {
        type: String,
        required: true
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true
    },
    qrCodeImage: {
        type: String, // This will store the QR code as a Base64 string
        required: true
    },
    status: {
        type: String,
        enum: ['Safe', 'Lost'],
        default: 'Safe'
    },
    ownerPhone: {
        type: String,
        required: true
    },
    ownerEmail: {
        type: String,
        required: true
    },
    // Array to store locations when the QR code is scanned
    locations: [
        {
            latitude: Number,
            longitude: Number,
            scannedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

module.exports = mongoose.model('Asset', AssetSchema);