import {Request, Response, NextFunction} from 'express';
import { RegisterSchema} from "./auth.schemas";
import { registerUser} from "./auth.service";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {

    try{
        const input = RegisterSchema.parse(req.body);
        const user = await registerUser(input);
        res.status(201).json({ user });
    }
    catch (err) {
        next(err);
    }

}