import { Router } from 'express';
import { getHeroBanner, updateHeroBanner } from '../controllers/bannerController';
import { authenticateAdmin, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Public route to fetch hero banner for storefront
router.get('/hero', getHeroBanner);

// Admin route to fetch/update hero banner
router.put('/hero', authenticateAdmin, authorizeAdmin('write'), updateHeroBanner);

export default router;
