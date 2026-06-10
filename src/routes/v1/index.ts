import { Router } from 'express';
import authRoutes from './auth.routes';
import housesRoutes from './houses.routes';
import membersRoutes from './members.routes';
import meetingsRoutes from './meetings.routes';
import attendancesRoutes from './attendances.routes';
import peoplesRoutes from './peoples.routes';
import visitorsRoutes from './visitors.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/houses', housesRoutes);
router.use('/members', membersRoutes);
router.use('/meetings', meetingsRoutes);
router.use('/attendances', attendancesRoutes);
router.use('/peoples', peoplesRoutes);
router.use('/visitors', visitorsRoutes);
router.use('/reports', reportsRoutes);

export default router;
