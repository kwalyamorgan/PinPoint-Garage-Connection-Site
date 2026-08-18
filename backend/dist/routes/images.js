"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const imagesDir = path_1.default.join(__dirname, '..', '..', 'images');
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
