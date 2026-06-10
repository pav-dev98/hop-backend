import { Router } from 'express';
import * as controller from '../../controllers/v1/peoples.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPeopleSchema, updatePeopleSchema } from '../../schemas/people.schema';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /peoples/search:
 *   get:
 *     tags: [Peoples]
 *     summary: Busca personas por nombre/apellido/email
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Texto de búsqueda
 *       - in: query
 *         name: houseId
 *         schema: { type: integer }
 *         description: Filtra a miembros de esa casa
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *     responses:
 *       200:
 *         description: Resultados paginados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// /search debe declararse antes de /:id para no ser capturada por el param.
router.get('/search', controller.search);

/**
 * @openapi
 * /peoples:
 *   get:
 *     tags: [Peoples]
 *     summary: Lista las personas (paginado)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PerPageParam'
 *     responses:
 *       200:
 *         description: Lista paginada de personas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /peoples/{id}:
 *   get:
 *     tags: [Peoples]
 *     summary: Obtiene una persona por id
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     responses:
 *       200:
 *         description: Persona encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', controller.getById);

/**
 * @openapi
 * /peoples:
 *   post:
 *     tags: [Peoples]
 *     summary: Crea una persona (Admin o Leader)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PeopleInput' }
 *     responses:
 *       201:
 *         description: Persona creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/', authorize('ADMIN', 'LEADER'), validate(createPeopleSchema), controller.create);

/**
 * @openapi
 * /peoples/{id}:
 *   put:
 *     tags: [Peoples]
 *     summary: Actualiza una persona (Admin o Leader)
 *     parameters: [ { $ref: '#/components/parameters/IdParam' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PeopleInput' }
 *     responses:
 *       200:
 *         description: Persona actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authorize('ADMIN', 'LEADER'), validate(updatePeopleSchema), controller.update);

export default router;
