import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createVideo,
  findUserById,
  findVideoById,
  findVideosByUser,
  updateVideo,
  incrementVideoCount,
  calculateVideoCost,
  deductPoints,
  addPoints,
} from '../services/dbService';
import {
  createVideoPrediction,
  pollPredictionUntilComplete,
} from '../services/replicateService';

export const createVideoController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await findUserById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    const { prompt, style = 'realistic', duration = 15, quality = '1080p', ratio = '16:9', music = 'none', modelQuality = 'standard' } = req.body;

    if (!prompt || prompt.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Le prompt doit contenir au moins 5 caractères' });
      return;
    }

    // Validate modelQuality
    const validModelQuality: 'standard' | 'premium' = ['standard', 'premium'].includes(modelQuality) ? modelQuality : 'standard';

    // Check max duration per plan
    const maxDuration: Record<string, number> = {
      free: 30,
      pro: 60,
    };
    if (duration > (maxDuration[user.plan] || 30)) {
      res.status(400).json({
        success: false,
        message: `La durée maximum pour votre plan est de ${maxDuration[user.plan] || 30}s`,
      });
      return;
    }

    // Calculate point cost based on model quality
    const pointsCost = calculateVideoCost(duration, validModelQuality);

    // Check if user has enough points
    if ((user.points_balance || 0) < pointsCost) {
      res.status(403).json({
        success: false,
        message: `Points insuffisants. Cette vidéo coûte ${pointsCost} points. Vous avez ${user.points_balance || 0} points. Rechargez votre compte.`,
        code: 'INSUFFICIENT_POINTS',
        pointsRequired: pointsCost,
        pointsBalance: user.points_balance || 0,
      });
      return;
    }

    // Deduct points
    const deducted = await deductPoints(userId, pointsCost, `Génération vidéo ${duration}s`);
    if (!deducted) {
      res.status(500).json({ success: false, message: 'Erreur lors du décompte des points' });
      return;
    }

    // Create video record in Supabase
    const video = await createVideo({
      user_id: userId,
      title: prompt.slice(0, 60) + (prompt.length > 60 ? '...' : ''),
      prompt,
      style,
      duration,
      quality,
      ratio,
      music,
      points_cost: pointsCost,
      status: 'generating',
    });

    if (!video) {
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la vidéo' });
      return;
    }

    // Determine model key based on quality choice
    const modelKey: 'luma' | 'zeroscope' = validModelQuality === 'premium' ? 'luma' : 'zeroscope';

    // Start async generation
    startGeneration(video.id, userId, pointsCost, prompt, style, duration, ratio, modelKey);

    // Increment video count
    await incrementVideoCount(userId);

    res.status(201).json({
      success: true,
      message: 'Génération vidéo lancée',
      pointsDeducted: pointsCost,
      pointsRemaining: (user.points_balance || 0) - pointsCost,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        prompt: video.prompt,
        style: video.style,
        duration: video.duration,
        quality: video.quality,
        ratio: video.ratio,
        pointsCost,
        modelQuality: validModelQuality,
        modelKey,
        createdAt: video.created_at,
      },
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

async function startGeneration(
  videoId: string,
  userId: string,
  pointsCost: number,
  prompt: string,
  style: string,
  duration: number,
  ratio: string,
  modelKey: 'luma' | 'zeroscope' = 'zeroscope'
) {
  try {
    const prediction = await createVideoPrediction(modelKey, {
      prompt,
      style,
      duration,
      ratio,
    });

    if (!prediction) {
      await updateVideo(videoId, {
        status: 'failed',
        error_message: 'Échec de la création de la prédiction',
      });
      // Refund points on failure
      await addPoints(userId, pointsCost, 'Remboursement - Échec génération vidéo');
      return;
    }

    await updateVideo(videoId, {
      replicate_prediction_id: prediction.id,
    });

    // Poll for completion
    const result = await pollPredictionUntilComplete(
      prediction.id,
      async (status) => {
        console.log(`Video ${videoId} status: ${status}`);
      }
    );

    if (result.success && result.videoUrl) {
      await updateVideo(videoId, {
        status: 'completed',
        video_url: result.videoUrl,
      });
    } else {
      await updateVideo(videoId, {
        status: 'failed',
        error_message: result.error || 'Échec de la génération',
      });
      // Refund points on failure
      await addPoints(userId, pointsCost, 'Remboursement - Échec génération vidéo');
    }
  } catch (error) {
    console.error('Generation error:', error);
    await updateVideo(videoId, {
      status: 'failed',
      error_message: 'Erreur interne',
    });
    // Refund points on error
    await addPoints(userId, pointsCost, 'Remboursement - Erreur interne');
  }
}

export const getMyVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const videos = await findVideosByUser(userId, 50);

    res.json({
      success: true,
      count: videos.length,
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        status: v.status,
        prompt: v.prompt,
        style: v.style,
        duration: v.duration,
        quality: v.quality,
        ratio: v.ratio,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getVideoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const video = await findVideoById(id);
    if (!video || video.user_id !== userId) {
      res.status(404).json({ success: false, message: 'Vidéo non trouvée' });
      return;
    }

    res.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        prompt: video.prompt,
        style: video.style,
        duration: video.duration,
        quality: video.quality,
        ratio: video.ratio,
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        errorMessage: video.error_message,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const checkVideoStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const video = await findVideoById(id);
    if (!video || video.user_id !== userId) {
      res.status(404).json({ success: false, message: 'Vidéo non trouvée' });
      return;
    }

    res.json({
      success: true,
      status: video.status,
      videoUrl: video.video_url,
      errorMessage: video.error_message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
