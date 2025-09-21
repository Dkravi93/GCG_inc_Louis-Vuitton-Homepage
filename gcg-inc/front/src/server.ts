import http from 'http';
import app from './setup/app';
import { connectToDatabase } from './setup/database';

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await connectToDatabase();
    const server = http.createServer(app);
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log('Press CTRL+C to stop');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.info('SIGTERM signal received.');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
}

start().catch((error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});
