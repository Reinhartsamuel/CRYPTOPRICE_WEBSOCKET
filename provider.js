const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const moment = require('moment');
const { adminDb } = require('./firebaseConfig');
require('dotenv').config();

// CryptoCompare WebSocket URL and API Key
const cryptoCompareUrl = `wss://streamer.cryptocompare.com/v2?api_key=${process.env.CRYPTO_COMPARE_APIKEY}`;
const cryptoCompareSubscription = { 'action': 'SubAdd', 'subs': ['24~BINANCE~BTC~USDT~H'] };
const PORT = process.env.PORT || 3025;
// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create WebSocket server for clients
const wss = new WebSocket.Server({ server });

// Connect to CryptoCompare WebSocket
const cryptoCompareSocket = new WebSocket(cryptoCompareUrl);

cryptoCompareSocket.on('open', () => {
    console.log('Connected to CryptoCompare WebSocket');
    cryptoCompareSocket.send(JSON.stringify(cryptoCompareSubscription));
});

cryptoCompareSocket.on('message', async (data) => {
    const parsedData = JSON.parse(data);
    // Broadcast data to all connected clients
    if (parsedData['TYPE'] === '24') {
        const formattedData = {
            Datetime: moment.unix(parsedData.TS).format('YYYY-MM-DD HH:mm:ssZ'),
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
            await adminDb.collection('market_data').add({
                ...formattedData,
                createdAt: new Date()
            });
            console.log('Data saved to Firestore successfully:', formattedData);
        } catch (error) {
            console.error('Error saving to Firestore:', error);
        }

        // Broadcast to WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
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
