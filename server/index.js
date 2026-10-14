import express from 'express';
import dotenv from 'dotenv';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const hubName = process.env.HUB_NAME || 'sample_chat';
const connectionString = process.env.WEB_PUBSUB_CONNECTION_STRING?.trim();

const serviceClient = new WebPubSubServiceClient(connectionString, hubName);

app.use(cors());
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', hub: hubName });
});

app.get('/negotiate', async (req, res) => {
  const userId = req.query.user ? String(req.query.user) : undefined;

  // get access token for the client to connect to the Web PubSub service
  
  res.json({ url: token.url });
});

app.listen(port, () => {
  console.log(`Application server listening at http://localhost:${port}`);
  console.log(`Use /negotiate to obtain a client access token for hub: ${hubName}`);
});