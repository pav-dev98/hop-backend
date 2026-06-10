import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../lib/http';

/**
 * Valida `req.body` contra un schema Zod. Si pasa, reemplaza el body con
 * los datos parseados (ya tipados/coercionados). Si falla, lanza BAD_REQUEST
 * con el detalle de los errores de Zod.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new AppError('BAD_REQUEST', 'Validation failed', result.error.flatten());
    }

    req.body = result.data;
    next();
  };
}
