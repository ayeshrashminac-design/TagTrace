const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const QRCode = require('qrcode'); 
const Asset = require('../models/Asset'); // Your Mongoose Schema Model

// 1. FIXED: Added missing GET route to fetch all items for the dashboard
router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find().sort({ createdAt: -1 });
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Server Error while retrieving assets.' });
    }
});

// 2. FIXED: Route mapped to /create and processes 'assetName' property accurately
router.post('/create', async (req, res) => {
    try {
        const { assetName, ownerPhone, ownerEmail } = req.body;

        if (!assetName || !ownerPhone || !ownerEmail) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const uniqueId = uuidv4().split('-')[0];
        
        // Ngrok tunnel or production environment domain configuration
        const backendUrl = 'https://tagtrace-backend.vercel.app/'; 
        const trackingUrl = `${backendUrl}/api/assets/track/${uniqueId}`;

        // Generate QR code base64 string
        const qrCodeImage = await QRCode.toDataURL(trackingUrl);

        const newAsset = new Asset({
            assetName,
            uniqueId,
            qrCodeImage,
            ownerPhone,
            ownerEmail
        });

        await newAsset.save();
        res.status(201).json(newAsset);

    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ message: 'Server Error while generating tracking tag.' });
    }
});

// 3. FIXED: Changed to GET route so scanning from mobile browser works directly
router.get('/track/:id', async (req, res) => {
    try {
        const assetId = req.params.id;

        const asset = await Asset.findOne({ uniqueId: assetId });
        if (!asset) {
            return res.status(404).send('<h1>❌ Asset Not Found!</h1><p>The scanned QR code is invalid.</p>');
        }

        // HTML Response එකක් යවනවා ෆෝන් එකේ ලස්සනට පේන්න සහ GPS ඔන් කරලා ලොකේෂන් එක ගන්න
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>TagTrace - Item Found!</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background: #0f172a; color: white; padding: 40px 20px; }
                    .card { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); max-width: 400px; margin: 0 auto; }
                    h2 { color: #3b82f6; }
                    p { color: #94a3b8; font-size: 16px; }
                    .btn { background: #22c55e; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 15px; }
                    .success-msg { color: #22c55e; font-weight: bold; margin-top: 20px; display: none; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>📍 TagTrace - Item Found</h2>
                    <p>You found <strong>${asset.assetName}</strong>!</p>
                    <p>Please share your location to notify the owner. It helps them recover their item instantly.</p>
                    <button class="btn" onclick="shareLocation()">Share My Location</button>
                    <div id="status" class="success-msg">✅ Location sent successfully! Thank you.</div>
                </div>

                <script>
                    function shareLocation() {
                        if (!navigator.geolocation) {
                            alert("Geolocation is not supported by your browser.");
                            return;
                        }

                        document.querySelector('.btn').innerText = "Sending Location...";

                        navigator.geolocation.getCurrentPosition(async (position) => {
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;

                            // මෙතනින් අපිට පුළුවන් ඉදිරියේදී POST එකක් මඟින් DB එකට ලොකේෂන් එක යවන්න
                            // දැනට අපි කෙලින්ම Query Params විදිහට මේ ලින්ක් එකටම යවමු
                            window.location.href = window.location.pathname + "/update?lat=" + lat + "&lon=" + lon;
                        }, (err) => {
                            alert("Please enable location services to help the owner.");
                            document.querySelector('.btn').innerText = "Share My Location";
                        });
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error in track page:', error);
        res.status(500).send('Server Error');
    }
});

// 4. NEW: Route to receive coordinates from the mobile HTML page and save to Database
router.get('/track/:id/update', async (req, res) => {
    try {
        const assetId = req.params.id;
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).send('Coordinates are missing.');
        }

        const asset = await Asset.findOne({ uniqueId: assetId });
        if (!asset) {
            return res.status(404).send('Asset not found.');
        }

        const newLocationLog = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            scannedAt: new Date()
        };

        asset.locations.push(newLocationLog);
        await asset.save();

        // ඩේටාබේස් එකට සේව් වුණාම ෆෝන් එකට පෙන්වන අවසාන තෑන්ක් යූ ස්ක්‍රීන් එක
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; background: #0f172a; color: white; padding: 50px 20px; }
                    .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 400px; margin: 0 auto; border: 2px solid #22c55e; }
                    h2 { color: #22c55e; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>✅ Owner Notified!</h2>
                    <p>Thank you so much! Your location has been safely shared with the owner.</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error updating location via web:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;