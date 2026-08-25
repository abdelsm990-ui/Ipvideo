import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { findUserById } from '../services/dbService';

export interface AuthRequest extends Request {
  user?: TokenPayload & { fullUser?: any };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token manquant' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists
    const user = await findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    req.user = { ...decoded, fullUser: user };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

export const requirePlan = (...allowedPlans: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentification requise' });
      return;
    }
    if (!allowedPlans.includes(req.user.plan)) {
      res.status(403).json({
        success: false,
        message: 'Cette fonctionnalité nécessite un abonnement supérieur',
        requiredPlan: allowedPlans,
      });
      return;
    }
    next();
  };
};
