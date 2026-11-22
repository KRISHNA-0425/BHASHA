import express from 'express';
import { chat } from '../controllers/ai.controllers.js';

const aiRouter = express.Router();

aiRouter.post("/chat", chat)

export default aiRouter;

