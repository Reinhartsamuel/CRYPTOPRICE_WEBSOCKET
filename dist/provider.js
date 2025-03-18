"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const moment_1 = __importDefault(require("moment"));
const firebaseConfig_1 = require("./firebaseConfig");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// CryptoCompare WebSocket URL and API Key
const cryptoCompareUrl = `wss://streamer.cryptocompare.com/v2?api_key=${process.env.CRYPTO_COMPARE_APIKEY}`;
const cryptoCompareSubscription = { 'action': 'SubAdd', 'subs': ['24~BINANCE~BTC~USDT~H'] };
const PORT = process.env.PORT || 3025;
// Create Express app and HTTP server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Add health check endpoint
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ready' });
});
// Create WebSocket server for clients
const wss = new ws_1.default.Server({ server });
// Connect to CryptoCompare WebSocket
const cryptoCompareSocket = new ws_1.default(cryptoCompareUrl);
cryptoCompareSocket.on('open', () => {
    console.log('Connected to CryptoCompare WebSocket');
    cryptoCompareSocket.send(JSON.stringify(cryptoCompareSubscription));
});
cryptoCompareSocket.on('message', async (data) => {
    const parsedData = JSON.parse(data.toString());
    // Broadcast data to all connected clients
    if (parsedData['TYPE'] === '24') {
        const formattedData = {
            Datetime: moment_1.default.unix(parsedData.TS).format('YYYY-MM-DD HH:mm:ssZ'),
            close: parsedData.CLOSE,
            conversionSymbol: '',
            high: parsedData.HIGH,
            low: parsedData.LOW,
            open: parsedData.OPEN,
            pair: 'USDT_BTC',
            time: parsedData.TS,
            volume_from: parsedData.VOLUMEFROM,
            volume_to: parsedData.VOLUMETO
        };
        try {
            // Save to Firestore using Admin SDK
            await firebaseConfig_1.adminDb.collection('market_data').add({
                ...formattedData,
                createdAt: new Date()
            });
            console.log('Formatted Data:', formattedData);
        }
        catch (error) {
            console.error('Error saving to Firestore:', error);
        }
        // Broadcast to WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(data.toString());
            }
        });
    }
});
cryptoCompareSocket.on('error', (error) => {
    console.error('Error occurred with CryptoCompare WebSocket:', error);
});
cryptoCompareSocket.on('close', () => {
    console.log('Disconnected from CryptoCompare WebSocket');
});
// Handle client connections
wss.on('connection', (ws) => {
    console.log('Client connected to provider server');
    ws.on('close', () => {
        console.log('Client disconnected from provider server');
    });
});
// Start server on port PORT
server.listen(PORT, () => {
    console.log(`Provider server listening on port ${PORT}`);
});
