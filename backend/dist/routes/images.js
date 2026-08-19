"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const imagesDir = path_1.default.join(__dirname, '..', '..', 'images');
router.get('/cloudinary-signature', auth_1.authenticate, (_req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({ error: 'Cloudinary is not configured' });
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'pinpoint/listings';
    const signature = crypto_1.default
        .createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');
    return res.json({ cloudName, apiKey, folder, timestamp, signature });
});
router.get('/', (req, res) => {
    try {
        const files = fs_1.default.readdirSync(imagesDir, { withFileTypes: true })
            .filter((d) => d.isFile())
            .map((d) => d.name);
        res.json({ images: files });
    }
    catch (err) {
        res.status(500).json({ error: 'Unable to read images folder' });
    }
});
exports.default = router;
