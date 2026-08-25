import { Router } from 'express';
import { body } from 'express-validator';
import {
  createVideoController as createVideo,
  getMyVideos,
  getVideoById,
  checkVideoStatus,
} from '../controllers/videoController';
import { authenticate, requirePlan } from '../middleware/auth';

const router = Router();

router.post(
  '/generate',
  authenticate,
  [
    body('prompt').trim().notEmpty().withMessage('Prompt requis'),
    body('duration').optional().isInt({ min: 5, max: 120 }).withMessage('Durée: 5-120s'),
  ],
  createVideo
);

router.get('/my', authenticate, getMyVideos);
router.get('/:id', authenticate, getVideoById);
router.get('/:id/status', authenticate, checkVideoStatus);

export default router;
