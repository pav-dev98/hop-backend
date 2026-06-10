import { Router } from 'express';
import * as controller from '../../controllers/v1/attendances.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  bulkAttendanceSchema,
} from '../../schemas/attendance.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /attendances:
 *   get:
 *     tags: [Attendances]
 *     summary: Lista asistencias (paginado, filtrable). Incluye attendanceType
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *       - in: query
 *         name: meetingId
 *         schema: { type: integer }
 *       - in: query
 *         name: peopleId
 *         schema: { type: integer }
 *       - in: query
 *         name: isGuest
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Lista paginada de asistencias
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /attendances/bulk:
 *   post:
 *     tags: [Attendances]
 *     summary: Registra muchas asistencias para una reunión (transaccional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BulkAttendanceInput' }
 *     responses:
 *       201:
 *         description: Asistencias creadas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { description: Combinación de flags incoherente para algún registro }
 */
router.post('/bulk', authorize('LEADER'), validate(bulkAttendanceSchema), controller.bulk);

/**
 * @openapi
 * /attendances/{id}:
 *   get:
 *     tags: [Attendances]
 *     summary: Obtiene una asistencia por id (con attendanceType)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Asistencia encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /attendances:
 *   post:
 *     tags: [Attendances]
 *     summary: Registra una asistencia (Leader)
 *     description: |
 *       Los 3 casos según la coherencia de los flags:
 *       - **Caso 1 — regular_member**: `isGuest=false`, `memberId` requerido, `isMemberFromOtherHouse=null`.
 *       - **Caso 2 — visiting_member**: `isGuest=true`, `memberId=null`, `isMemberFromOtherHouse` = member_id de la otra casa.
 *       - **Caso 3 — external_visitor**: `isGuest=true`, `memberId=null`, `isMemberFromOtherHouse=null`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AttendanceInput' }
 *           examples:
 *             regularMember:
 *               summary: Caso 1 — miembro regular en su casa
 *               value: { meetingId: 1, memberId: 5, peopleId: 10, isGuest: false, isMemberFromOtherHouse: null }
 *             visitingMember:
 *               summary: Caso 2 — miembro de otra casa
 *               value: { meetingId: 2, memberId: null, peopleId: 10, isGuest: true, isMemberFromOtherHouse: 5 }
 *             externalVisitor:
 *               summary: Caso 3 — visitante externo
 *               value: { meetingId: 1, memberId: null, peopleId: 20, isGuest: true, isMemberFromOtherHouse: null }
 *     responses:
 *       201:
 *         description: Asistencia creada (incluye attendanceType derivado)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { description: Combinación de flags incoherente }
 */
router.post('/', authorize('LEADER'), validate(createAttendanceSchema), controller.create);

/**
 * @openapi
 * /attendances/{id}:
 *   put:
 *     tags: [Attendances]
 *     summary: Actualiza una asistencia (Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AttendanceInput' }
 *     responses:
 *       200:
 *         description: Asistencia actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { description: Combinación de flags incoherente }
 */
router.put('/:id', authorize('LEADER'), validate(updateAttendanceSchema), controller.update);

/**
 * @openapi
 * /attendances/{id}:
 *   delete:
 *     tags: [Attendances]
 *     summary: Elimina una asistencia (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Asistencia eliminada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authorize('ADMIN', 'LEADER'), controller.remove);

export default router;
