import { Router } from 'express';
import * as controller from '../../controllers/v1/meetings.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createMeetingSchema, updateMeetingSchema } from '../../schemas/meeting.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /meetings:
 *   get:
 *     tags: [Meetings]
 *     summary: Lista las reuniones (paginado, filtrable por fecha y casa)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *       - in: query
 *         name: houseId
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista paginada de reuniones
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /meetings/{id}:
 *   get:
 *     tags: [Meetings]
 *     summary: Obtiene una reunión por id
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Reunión encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /meetings:
 *   post:
 *     tags: [Meetings]
 *     summary: Crea una reunión (Admin o Leader)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MeetingInput' }
 *     responses:
 *       201:
 *         description: Reunión creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authorize('ADMIN', 'LEADER'), validate(createMeetingSchema), controller.create);

/**
 * @openapi
 * /meetings/{id}:
 *   put:
 *     tags: [Meetings]
 *     summary: Actualiza una reunión (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MeetingInput' }
 *     responses:
 *       200:
 *         description: Reunión actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authorize('ADMIN', 'LEADER'), validate(updateMeetingSchema), controller.update);

/**
 * @openapi
 * /meetings/{id}:
 *   delete:
 *     tags: [Meetings]
 *     summary: Elimina una reunión (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Reunión eliminada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authorize('ADMIN', 'LEADER'), controller.remove);

/**
 * @openapi
 * /meetings/{id}/attendances:
 *   get:
 *     tags: [Meetings]
 *     summary: Lista las asistencias de una reunión (con attendanceType)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *     responses:
 *       200:
 *         description: Lista paginada de asistencias
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/:id/attendances', controller.attendances);

export default router;
