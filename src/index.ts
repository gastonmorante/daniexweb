import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { verifyWebhook, handleWebhook } from './controllers/webhook';
import { handleDanyChat, handleDanyLead, handleDanyWebhookMP } from './controllers/dany';

const app = express();

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

// Dany Experiences API Endpoints
app.post('/api/dany/chat', handleDanyChat);
app.post('/api/dany/leads', handleDanyLead);
app.post('/api/dany/webhook/mercadopago', handleDanyWebhookMP);

// Health Check Endpoint (useful for Render/Vercel uptime monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(config.port, () => {
  console.log(`[Cerebro] Microservice is running on port ${config.port}`);
  console.log(`[Cerebro] Webhook Verify Token configured: "${config.metaWebhookVerifyToken}"`);
  console.log(`[Cerebro] Health Check URL: http://localhost:${config.port}/health`);
});
