"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const moment_1 = __importDefault(require("moment"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Provider WebSocket URL
const providerUrl = 'ws://localhost:3025';
const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN;
// Create Express app and HTTP server (optional, for serving static content)
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Connect to provider WebSocket
const providerSocket = new ws_1.default(providerUrl);
providerSocket.on('open', async () => {
    console.log(`Connected to provider WebSocket on port ${providerUrl}`);
});
providerSocket.on('message', async (data) => {
    const parsedData = JSON.parse(data.toString());
    console.log('Received data from PROVIDERRRRRRRR:', {
        ...parsedData,
        timestamp: moment_1.default.unix(parsedData.TS).format('HH:mm:ss')
    });
    try {
        const messageTelegram = `${parsedData.FROMSYMBOL}/${parsedData.TOSYMBOL}
            TIMEFRAME: ${parsedData.UNIT}
            OPEN: ${parsedData.OPEN}
            HIGH: ${parsedData.HIGH}
            LOW: ${parsedData.OPEN}
            CLOSE: ${parsedData.OPEN}
            VOLUMEFROM: ${parsedData.VOLUMEFROM}
            VOLUMETO: ${parsedData.VOLUMETO}
            TIMESTAMP: ${parsedData.TS}
            DATE: ${moment_1.default.unix(parsedData.TS).format('ddd, DD MMM YYYY HH:mm')}
            TIME DIFFERENCE: ${Math.floor(Date.now() / 1000) - parsedData.TS}
        `;
        if (!telegram_bot_token) {
            console.error('Missing TELEGRAM_BOT_TOKEN environment variable');
            return;
        }
        const response = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: "7389805128",
                text: messageTelegram
            })
        });
        const resTelegram = await response.json();
        // console.log(resTelegram, 'resTelegram');
    }
    catch (error) {
        console.error('Error sending message to Telegram:', error instanceof Error ? error.message : 'Unknown error');
    }
});
providerSocket.on('error', (error) => {
    console.error('Error occurred with provider WebSocket:', error);
});
providerSocket.on('close', () => {
    console.log('Disconnected from provider WebSocket');
    if (!telegram_bot_token) {
        console.error('Missing TELEGRAM_BOT_TOKEN environment variable');
        return;
    }
    fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: "7389805128",
            text: 'Disconnected from provider WebSocket'
        })
    }).then(res => res.json()).then((res) => {
        console.log('disconnected, sent to Telegram');
    }).catch(error => {
        console.error('Error sending disconnect message to Telegram:', error instanceof Error ? error.message : 'Unknown error');
    });
});
// Start server on port 3001 (optional, if serving static content)
server.listen(3001, () => {
    console.log('Consumer server listening on port 3001');
});
