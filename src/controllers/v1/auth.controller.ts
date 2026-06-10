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
 * Logout: con JWT stateless no hay sesión que invalidar en el servidor.
 * El cliente descarta el token. Se responde OK por compatibilidad de contrato.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: 'Logged out' });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  // currentUser viene del middleware authenticate.
  const current = req.currentUser!;
  const result = await authService.refresh({
    userId: current.id,
    email: current.email,
    role: current.role,
  });
  sendSuccess(res, result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.currentUser!.id);
  sendSuccess(res, user);
}
