import { Router } from 'express';
import { register } from './auth.controller';

export const authRouter = Router();

authRouter.post("/register", register);