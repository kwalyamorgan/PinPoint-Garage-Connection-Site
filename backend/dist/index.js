"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const garages_1 = __importDefault(require("./routes/garages"));
const mechanics_1 = __importDefault(require("./routes/mechanics"));
const transport_1 = __importDefault(require("./routes/transport"));
const images_1 = __importDefault(require("./routes/images"));
const auth_1 = __importDefault(require("./routes/auth"));
const child_process_1 = require("child_process");
dotenv_1.default.config();
const app = (0, express_1.default)();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use((0, cors_1.default)({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.json({
        name: 'PinPoint Garage Connection Site API',
        status: 'ok',
        endpoints: ['/api/garages', '/api/mechanics', '/api/transport', '/api/images', '/api/auth'],
    });
});
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.status(200).json({});
});
app.use('/api/garages', garages_1.default);
app.use('/api/mechanics', mechanics_1.default);
app.use('/api/transport', transport_1.default);
app.use('/api/images', images_1.default);
app.use('/api/auth', auth_1.default);
// serve workspace images folder
app.use('/images', express_1.default.static(path_1.default.join(__dirname, '..', '..', 'images')));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    // In development, spawn the frontend dev server so running the backend starts the frontend automatically.
    if (process.env.NODE_ENV !== 'production' && process.env.START_FRONTEND !== 'false') {
        try {
            const projectRoot = path_1.default.join(__dirname, '..', '..');
            // Prefer pnpm/yarn if available
            const cmd = process.env.NPM_EXECUTABLE || 'npm';
            const child = (0, child_process_1.spawn)(cmd, ['run', 'dev'], {
                cwd: projectRoot,
                env: { ...process.env },
                stdio: 'inherit',
                shell: true,
            });
            child.on('error', (err) => console.error('Failed to start frontend dev server:', err));
        }
        catch (err) {
            console.error('Error spawning frontend:', err);
        }
    }
});
