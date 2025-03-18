"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
const startProvider = () => {
    const provider = (0, child_process_1.spawn)('ts-node', ['src/provider.ts'], { stdio: 'inherit' });
    provider.on('error', (err) => {
        console.error('Failed to start provider:', err);
        process.exit(1);
    });
};
const startConsumer = () => {
    const consumer = (0, child_process_1.spawn)('ts-node', ['src/consumer.ts'], { stdio: 'inherit' });
    consumer.on('error', (err) => {
        console.error('Failed to start consumer:', err);
        process.exit(1);
    });
};
const waitForProvider = async () => {
    const maxAttempts = 30; // 30 seconds timeout
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            const response = await axios_1.default.get('http://localhost:3025/health');
            if (response.data.status === 'ready') {
                return true;
            }
        }
        catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    throw new Error('Provider failed to start within 30 seconds');
};
const main = async () => {
    console.log('Starting provider...');
    startProvider();
    try {
        console.log('Waiting for provider to be ready...');
        await waitForProvider();
        console.log('Provider is ready, starting consumer...');
        startConsumer();
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};
main();
