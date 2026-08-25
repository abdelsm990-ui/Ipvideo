import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, getPointHistory } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('Prénom requis'),
    body('lastName').trim().notEmpty().withMessage('Nom requis'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe: 6 caractères minimum'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  login
);

router.get('/me', authenticate, getMe);
router.get('/points-history', authenticate, getPointHistory);

export default router;
