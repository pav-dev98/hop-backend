import { Request, Response } from 'express';
import * as authService from '../../services/authentication.service';
import { sendSuccess } from '../../lib/http';

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  sendSuccess(res, result);
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201);
}

/**
 * Logout: revoca el refresh token recibido. El access token sigue siendo
 * stateless (el cliente lo descarta y muere solo al expirar).
 */
export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.body?.refreshToken);
  sendSuccess(res, { message: 'Logged out' });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refresh(req.body.refreshToken);
  sendSuccess(res, result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.currentUser!.id);
  sendSuccess(res, user);
}
