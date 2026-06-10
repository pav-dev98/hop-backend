import { Router } from 'express';
import * as controller from '../../controllers/v1/members.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createMemberSchema, updateMemberSchema } from '../../schemas/member.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /members:
 *   get:
 *     tags: [Members]
 *     summary: Lista los miembros (paginado, filtrable)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *       - in: query
 *         name: houseId
 *         schema: { type: integer }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Lista paginada de miembros
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Obtiene un miembro por id
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Miembro encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /members:
 *   post:
 *     tags: [Members]
 *     summary: Crea un miembro (Admin o Leader)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MemberInput' }
 *     responses:
 *       201:
 *         description: Miembro creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authorize('ADMIN', 'LEADER'), validate(createMemberSchema), controller.create);

/**
 * @openapi
 * /members/{id}:
 *   put:
 *     tags: [Members]
 *     summary: Actualiza un miembro (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MemberInput' }
 *     responses:
 *       200:
 *         description: Miembro actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authorize('ADMIN', 'LEADER'), validate(updateMemberSchema), controller.update);

/**
 * @openapi
 * /members/{id}:
 *   delete:
 *     tags: [Members]
 *     summary: Elimina un miembro (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Miembro eliminado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authorize('ADMIN', 'LEADER'), controller.remove);

export default router;
