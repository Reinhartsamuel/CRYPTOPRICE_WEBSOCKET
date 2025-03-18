import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import axios from 'axios';
import moment from 'moment';
import dotenv from 'dotenv';

dotenv.config();

// Provider WebSocket URL
const providerUrl = 'ws://localhost:3025';
const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN;

// Create Express app and HTTP server (optional, for serving static content)
const app = express();
const server = http.createServer(app);

// Define interfaces for the data
interface CryptoCompareData {
    FROMSYMBOL: string;
    TOSYMBOL: string;
    UNIT: string;
    OPEN: number;
    HIGH: number;
    LOW: number;
    CLOSE: number;
    VOLUMEFROM: number;
    VOLUMETO: number;
    TS: number;
    TYPE: string;
}

interface TelegramResponse {
    ok: boolean;
    result?: any;
    description?: string;
}

// Connect to provider WebSocket
const providerSocket = new WebSocket(providerUrl);

providerSocket.on('open', async () => {
    console.log(`Connected to provider WebSocket on port ${providerUrl}`);
});

providerSocket.on('message', async (data: WebSocket.RawData) => {
    const parsedData = JSON.parse(data.toString()) as CryptoCompareData;
    console.log('Received data from PROVIDERRRRRRRR:', {
        ...parsedData,
        timestamp: moment.unix(parsedData.TS).format('HH:mm:ss')
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
            DATE: ${moment.unix(parsedData.TS).format('ddd, DD MMM YYYY HH:mm')}
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
        
        const resTelegram: TelegramResponse = await response.json();
        // console.log(resTelegram, 'resTelegram');

    } catch (error) {
        console.error('Error sending message to Telegram:', error instanceof Error ? error.message : 'Unknown error');
    }
});

providerSocket.on('error', (error: Error) => {
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
    }).then(res => res.json()).then((res: TelegramResponse) => {
        console.log('disconnected, sent to Telegram');
    }).catch(error => {
        console.error('Error sending disconnect message to Telegram:', error instanceof Error ? error.message : 'Unknown error');
    });
});

// Start server on port 3001 (optional, if serving static content)
server.listen(3001, () => {
    console.log('Consumer server listening on port 3001');
}); 