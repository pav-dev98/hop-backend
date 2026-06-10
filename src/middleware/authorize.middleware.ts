import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/http';

type Role = 'ADMIN' | 'LEADER';

/**
 * Restringe el acceso a los roles indicados. Debe ejecutarse después de
 * `authenticate`, que es quien adjunta `currentUser`.
 *
 * Uso: authorize('ADMIN'), authorize('ADMIN', 'LEADER')
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    if (!roles.includes(req.currentUser.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions for this action');
    }

    next();
  };
}
