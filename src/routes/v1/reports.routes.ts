import { Router } from 'express';
import * as controller from '../../controllers/v1/reports.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reports/dashboard:
 *   get:
 *     tags: [Reports]
 *     summary: Dashboard global con totales y desglose de asistencias — Admin
 *     responses:
 *       200:
 *         description: Métricas globales
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/dashboard', authorize('ADMIN'), controller.dashboard);

/**
 * @openapi
 * /reports/house/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Reporte detallado de una casa (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Reporte de la casa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/house/:id', authorize('ADMIN', 'LEADER'), controller.house);

/**
 * @openapi
 * /reports/attendance-trends:
 *   get:
 *     tags: [Reports]
 *     summary: Tendencia de asistencia por reunión (filtrable)
 *     parameters:
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
 *         description: Serie de asistencia por reunión
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.get('/attendance-trends', controller.attendanceTrends);

/**
 * @openapi
 * /reports/visitor-conversion:
 *   get:
 *     tags: [Reports]
 *     summary: Tasa de conversión de visitantes externos a miembros
 *     responses:
 *       200:
 *         description: Métricas de conversión
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.get('/visitor-conversion', controller.visitorConversion);

/**
 * @openapi
 * /reports/member-activity:
 *   get:
 *     tags: [Reports]
 *     summary: Actividad de miembros (nº de asistencias presentes)
 *     parameters:
 *       - in: query
 *         name: houseId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Actividad por miembro
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.get('/member-activity', controller.memberActivity);

export default router;
