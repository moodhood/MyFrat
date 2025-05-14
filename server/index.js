import 'dotenv/config';            // Loads .env into process.env
import express from 'express';

import helloRouter from './routes/hello.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Mount your routes
app.use('/api/hello', helloRouter);

// Fallback 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`🚀 Server listening at http://localhost:${PORT}`)
);
