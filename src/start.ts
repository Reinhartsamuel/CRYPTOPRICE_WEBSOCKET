import { spawn } from 'child_process';
import axios from 'axios';

const startProvider = () => {
    const provider = spawn('ts-node', ['src/provider.ts'], { stdio: 'inherit' });
    provider.on('error', (err) => {
        console.error('Failed to start provider:', err);
        process.exit(1);
    });
};

const startConsumer = () => {
    const consumer = spawn('ts-node', ['src/consumer.ts'], { stdio: 'inherit' });
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
            const response = await axios.get('http://localhost:3025/health');
            if (response.data.status === 'ready') {
                return true;
            }
        } catch (error) {
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
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

main();
