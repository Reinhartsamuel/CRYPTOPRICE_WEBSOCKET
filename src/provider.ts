import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import moment from 'moment';
import { adminDb } from './firebaseConfig';
import dotenv from 'dotenv';

dotenv.config();

// CryptoCompare WebSocket URL and API Key
const cryptoCompareUrl = `wss://streamer.cryptocompare.com/v2?api_key=${process.env.CRYPTO_COMPARE_APIKEY}`;
const cryptoCompareSubscription = { 'action': 'SubAdd', 'subs': ['24~BINANCE~BTC~USDT~H'] };
const PORT = process.env.PORT || 3025;

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Add health check endpoint
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ready' });
});

// Create WebSocket server for clients
const wss = new WebSocket.Server({ server });

// Define interfaces for the data
interface CryptoCompareData {
    TYPE: string;
    MARKET: string;
    FROMSYMBOL: string;
    TOSYMBOL: string;
    FLAGS: number;
    PRICE: number;
    LASTUPDATE: number;
    LASTVOLUME: number;
    LASTVOLUMETO: number;
    LASTTRADEID: string;
    VOLUMEDAY: number;
    VOLUMEDAYTO: number;
    VOLUME24HOUR: number;
    VOLUME24HOURTO: number;
    OPENDAY: number;
    HIGHDAY: number;
    LOWDAY: number;
    OPEN24HOUR: number;
    HIGH24HOUR: number;
    LOW24HOUR: number;
    LASTMARKET: string;
    VOLUMEHOUR: number;
    VOLUMEHOURTO: number;
    OPENHOUR: number;
    HIGHHOUR: number;
    LOWHOUR: number;
    TOPTIERVOLUME24HOUR: number;
    TOPTIERVOLUME24HOURTO: number;
    CHANGE24HOUR: number;
    CHANGEPCT24HOUR: number;
    CHANGEDAY: number;
    CHANGEPCTDAY: number;
    CHANGEHOUR: number;
    CHANGEPCTHOUR: number;
    CONVERSIONTYPE: string;
    CONVERSIONSYMBOL: string;
    SUPPLY: number;
    MKTCAP: number;
    MKTCAPPENALTY: number;
    CIRCULATINGSUPPLY: number;
    CIRCULATINGSUPPLYMKTCAP: number;
    TOTALVOLUME24H: number;
    TOTALVOLUME24HTO: number;
    TOTALTOPTIERVOLUME24H: number;
    TOTALTOPTIERVOLUME24HTO: number;
    IMAGEURL: string;
    TS: number;
    OPEN: number;
    HIGH: number;
    LOW: number;
    CLOSE: number;
    VOLUMEFROM: number;
    VOLUMETO: number;
    UNIT: string;
}

interface FormattedData {
    Datetime: string;
    close: number;
    conversionSymbol: string;
    high: number;
    low: number;
    open: number;
    pair: string;
    time: number;
    volume_from: number;
    volume_to: number;
    createdAt?: Date;
}

// Connect to CryptoCompare WebSocket
const cryptoCompareSocket = new WebSocket(cryptoCompareUrl);

cryptoCompareSocket.on('open', () => {
    console.log('Connected to CryptoCompare WebSocket');
    cryptoCompareSocket.send(JSON.stringify(cryptoCompareSubscription));
});

cryptoCompareSocket.on('message', async (data: WebSocket.RawData) => {
    const parsedData = JSON.parse(data.toString());
    
    // Broadcast data to all connected clients
    if (parsedData['TYPE'] === '24') {
        const formattedData: FormattedData = {
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
            console.log('Formatted Data:', formattedData);
        } catch (error) {
            console.error('Error saving to Firestore:', error);
        }

        // Broadcast to WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });
    }
});

cryptoCompareSocket.on('error', (error: Error) => {
    console.error('Error occurred with CryptoCompare WebSocket:', error);
});

cryptoCompareSocket.on('close', () => {
    console.log('Disconnected from CryptoCompare WebSocket');
});

// Handle client connections
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to provider server');

    ws.on('close', () => {
        console.log('Client disconnected from provider server');
    });
});

// Start server on port PORT
server.listen(PORT, () => {
    console.log(`Provider server listening on port ${PORT}`);
}); 