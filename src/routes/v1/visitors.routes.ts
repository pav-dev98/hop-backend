import { Router } from 'express';
import * as controller from '../../controllers/v1/visitors.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from '../../schemas/attendance.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /visitors/recurring:
 *   get:
 *     tags: [Visitors]
 *     summary: Visitantes externos recurrentes (2+ reuniones) — solo Admin
 *     responses:
 *       200:
 *         description: Lista de personas con su conteo de visitas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// /recurring debe declararse antes de /:id.
router.get('/recurring', authorize('ADMIN'), controller.recurring);

/**
 * @openapi
 * /visitors:
 *   get:
 *     tags: [Visitors]
 *     summary: Lista asistencias de invitados (isGuest=true), paginado
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *       - in: query
 *         name: meetingId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista paginada de visitantes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /visitors/{id}:
 *   get:
 *     tags: [Visitors]
 *     summary: Obtiene un registro de visitante por id
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Visitante encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /visitors:
 *   post:
 *     tags: [Visitors]
 *     summary: Registra un visitante externo (fuerza isGuest=true) — Leader
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AttendanceInput' }
 *     responses:
 *       201:
 *         description: Visitante registrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authorize('LEADER'), validate(createAttendanceSchema), controller.create);

/**
 * @openapi
 * /visitors/{id}:
 *   put:
 *     tags: [Visitors]
 *     summary: Actualiza un registro de visitante (Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AttendanceInput' }
 *     responses:
 *       200:
 *         description: Visitante actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authorize('LEADER'), validate(updateAttendanceSchema), controller.update);

export default router;
