const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { default: axios } = require('axios');
const moment = require('moment');

require('dotenv').config();

// Provider WebSocket URL
const providerUrl = 'ws://localhost:3025';
const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN;

// Create Express app and HTTP server (optional, for serving static content)
const app = express();
const server = http.createServer(app);

// Connect to provider WebSocket
const providerSocket = new WebSocket(providerUrl);

providerSocket.on('open', async () => {
    console.log(`Connected to provider WebSocket on port ${providerUrl}`);
});

providerSocket.on('message', async (data) => {
    const parsedData = JSON.parse(data);
    // console.log('Received data from PROVIDERRRRRRRR:', {
    //     ...parsedData,
    //     timestamp: moment.unix(parsedData.TS).format('HH:mm:ss')
    // });

    try {
        const messageTelegram = `${parsedData.FROMSYMBOL}/${parsedData.TOSYMBOL}\nTIMEFRAME: ${parsedData.UNIT}\nOPEN: ${parsedData.OPEN}\nHIGH: ${parsedData.HIGH}\nLOW: ${parsedData.OPEN}\nCLOSE: ${parsedData.OPEN}\nVOLUMEFROM: ${parsedData.VOLUMEFROM}\nVOLUMETO: ${parsedData.VOLUMETO}\nTIMESTAMP: ${parsedData.TS}\nDATE: ${moment.unix(parsedData.TS).format('ddd, DD MMM YYYY HH:mm')}\nTIME DIFFERENCE: ${Math.floor(Date.now() / 1000) - parsedData.TS}`
        const res = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: "7389805128",
                text: messageTelegram
            })
        })
        const resTelegram = await res.json();
        // console.log(resTelegram, 'resTelegram');

    } catch (error) {
        console.error('Error sending message to Telegram:', error.message);
    }
});

providerSocket.on('error', (error) => {
    console.error('Error occurred with provider WebSocket:', error);
});

providerSocket.on('close', () => {
    console.log('Disconnected from provider WebSocket');
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
    }).then(res => res.json()).then(res => {
        console.log('disconnected, sent to Telegram');
    })
});

// Start server on port 3001 (optional, if serving static content)
server.listen(3001, () => {
    console.log('Consumer server listening on port 3001');
});
