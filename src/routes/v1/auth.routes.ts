import { Router } from 'express';
import * as controller from '../../controllers/v1/auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from '../../schemas/auth.schema';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión y devuelve un JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Token emitido junto con los datos del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/login', validate(loginSchema), controller.login);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra una persona + usuario y devuelve un JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       422: { description: El email ya está registrado }
 */
router.post('/register', validate(registerSchema), controller.register);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cierra sesión revocando el refresh token
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LogoutRequest' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.post('/logout', validate(logoutSchema), controller.logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Canjea un refresh token por un par nuevo de tokens (rotación)
 *     description: >
 *       No requiere access token: sirve justamente para renovar la sesión
 *       cuando el JWT ya expiró. El refresh token usado queda revocado y se
 *       devuelve uno nuevo; reusar un token ya rotado revoca todas las
 *       sesiones del usuario.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefreshRequest' }
 *     responses:
 *       200:
 *         description: Tokens renovados junto con los datos del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/refresh', validate(refreshSchema), controller.refresh);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Devuelve el usuario actual con sus datos personales
 *     responses:
 *       200:
 *         description: Usuario actual
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticate, controller.me);

export default router;
