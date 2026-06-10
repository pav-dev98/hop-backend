import { Router } from 'express';
import * as controller from '../../controllers/v1/houses.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createHouseSchema, updateHouseSchema } from '../../schemas/house.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /houses:
 *   get:
 *     tags: [Houses]
 *     summary: Lista las casas (paginado)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *         description: Filtra por casas activas/inactivas
 *     responses:
 *       200:
 *         description: Lista paginada de casas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /houses/{id}:
 *   get:
 *     tags: [Houses]
 *     summary: Obtiene una casa por id
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Casa encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /houses:
 *   post:
 *     tags: [Houses]
 *     summary: Crea una casa (solo Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HouseInput' }
 *     responses:
 *       201:
 *         description: Casa creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authorize('ADMIN'), validate(createHouseSchema), controller.create);

/**
 * @openapi
 * /houses/{id}:
 *   put:
 *     tags: [Houses]
 *     summary: Actualiza una casa (Admin o líder de la propia casa)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HouseInput' }
 *     responses:
 *       200:
 *         description: Casa actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authorize('ADMIN', 'LEADER'), validate(updateHouseSchema), controller.update);

/**
 * @openapi
 * /houses/{id}:
 *   delete:
 *     tags: [Houses]
 *     summary: Elimina una casa (solo Admin)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Casa eliminada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authorize('ADMIN'), controller.remove);

/**
 * @openapi
 * /houses/{id}/members:
 *   get:
 *     tags: [Houses]
 *     summary: Lista los miembros de una casa (paginado)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *     responses:
 *       200:
 *         description: Lista paginada de miembros
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/:id/members', controller.members);

/**
 * @openapi
 * /houses/{id}/meetings:
 *   get:
 *     tags: [Houses]
 *     summary: Lista las reuniones de una casa (paginado)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *     responses:
 *       200:
 *         description: Lista paginada de reuniones
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 */
router.get('/:id/meetings', controller.meetings);

/**
 * @openapi
 * /houses/{id}/statistics:
 *   get:
 *     tags: [Houses]
 *     summary: Estadísticas de una casa (miembros, reuniones, asistencias)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Estadísticas de la casa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/statistics', controller.statistics);

export default router;
