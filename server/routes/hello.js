import express from 'express';
import { getGreeting } from '../controllers/helloController.js';

const router = express.Router();

// GET /api/hello/
router.get('/', getGreeting);

export default router;
