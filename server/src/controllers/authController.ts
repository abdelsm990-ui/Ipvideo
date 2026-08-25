import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { findUserByEmail, createUser, findUserById, findSubscriptionByUser, getPointTransactions } from '../services/dbService';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set trial end (3 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    // Create user in Supabase
    const user = await createUser({
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      plan: 'free',
      trial_ends_at: trialEndsAt.toISOString(),
      is_trial_used: true,
      voice_credits: 50,
      points_balance: 120,
      points_used: 0,
      video_count: 0,
    });

    if (!user) {
      res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, plan: user.plan });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        plan: user.plan,
        trialEndsAt: user.trial_ends_at,
        voiceCredits: user.voice_credits,
        pointsBalance: user.points_balance,
        pointsUsed: user.points_used,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, plan: user.plan });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        plan: user.plan,
        trialEndsAt: user.trial_ends_at,
        voiceCredits: user.voice_credits,
        videoCount: user.video_count,
        pointsBalance: user.points_balance,
        pointsUsed: user.points_used,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    const user = await findUserById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    // Get subscription info
    const subscription = await findSubscriptionByUser(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        plan: user.plan,
        trialEndsAt: user.trial_ends_at,
        voiceCredits: user.voice_credits,
        videoCount: user.video_count,
        pointsBalance: user.points_balance,
        pointsUsed: user.points_used,
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: false,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getPointHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    const transactions = await getPointTransactions(userId, 50);

    res.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        videoId: t.video_id,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Get point history error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
