# Crypto Feed Socket

A TypeScript WebSocket application that connects to CryptoCompare's API to fetch real-time cryptocurrency data, stores it in Firebase, and sends notifications via Telegram.

## Features

- Real-time cryptocurrency data from CryptoCompare
- WebSocket provider and consumer architecture
- Firebase Firestore integration for data storage
- Telegram notifications

## Prerequisites

- Node.js 14+
- Firebase project with Firestore enabled
- CryptoCompare API key
- Telegram Bot Token

## Environment Variables

Create a `.env` file with the following variables:

```
CRYPTO_COMPARE_APIKEY=your_api_key
FIREBASE_SERVICE_ACCOUNT=your_base64_encoded_firebase_service_account
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

Note: The Firebase service account should be Base64 encoded.

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Compile TypeScript:

```bash
npm run build
```

## Usage

### Running in production mode

To start both the provider and consumer:

```bash
npm start
```

To run them separately:

```bash
# Provider only
node dist/provider.js

# Consumer only
node dist/consumer.js
```

### Running in development mode

To start both in development mode with hot reloading:

```bash
npm run dev
```

To run them separately in development mode:

```bash
# Provider only
npm run provider

# Consumer only
npm run consumer
```

## Project Structure

- `src/provider.ts` - WebSocket server that connects to CryptoCompare and provides data
- `src/consumer.ts` - WebSocket client that consumes data and sends Telegram notifications
- `src/firebaseConfig.ts` - Firebase configuration and initialization

## License

ISC 