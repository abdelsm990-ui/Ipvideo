import fetch from 'node-fetch';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const API_BASE = 'https://api.replicate.com/v1';

// Available models on Replicate for video generation
// Using /models/{owner}/{model}/predictions endpoint (no version needed)
const MODELS = {
  // Luma Dream Machine - high quality text-to-video
  luma: 'luma-ai/dream-machine',
  // Stable Video Diffusion - image-to-video (requires image)
  svd: 'stability-ai/stable-video-diffusion',
  // Zeroscope v2 XL - text-to-video, very cheap
  zeroscope: 'anotherjesse/zeroscope-v2-xl',
};

// Model versions (latest stable)
const MODEL_VERSIONS: Record<string, string> = {
  'luma-ai/dream-machine': 'luma-ai/dream-machine:latest',
  'stability-ai/stable-video-diffusion': 'stability-ai/stable-video-diffusion:latest',
  'anotherjesse/zeroscope-v2-xl': 'anotherjesse/zeroscope-v2-xl:latest',
};

interface PredictionInput {
  prompt: string;
  style?: string;
  duration?: number;
  ratio?: string;
  [key: string]: any;
}

export const createVideoPrediction = async (
  modelKey: 'luma' | 'svd' | 'zeroscope',
  input: PredictionInput
): Promise<{ id: string; status: string } | null> => {
  try {
    const model = MODELS[modelKey] || MODELS.luma;

    const body: any = {
      input: {},
    };

    // Model-specific input formatting
    if (modelKey === 'luma') {
      body.input = {
        prompt: input.prompt,
        aspect_ratio: input.ratio?.replace(':', '/') || '16/9',
      };
    } else if (modelKey === 'svd') {
      // SVD is image-to-video; for text prompt we adapt
      body.input = {
        image: input.prompt,
        cond_aug: 0.02,
        decoding_t: 14,
      };
    } else {
      body.input = {
        prompt: input.prompt,
        num_frames: input.duration ? Math.min(input.duration * 6, 144) : 54,
        width: 1024,
        height: 576,
      };
    }

    // Use the /models/{owner}/{model}/predictions endpoint
    const [owner, name] = model.split('/');
    const response = await fetch(`${API_BASE}/models/${owner}/${name}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait', // Optional: wait for response if quick
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Replicate create error:', err);
      return null;
    }

    const data = (await response.json()) as any;
    return { id: data.id, status: data.status };
  } catch (error) {
    console.error('Replicate service error:', error);
    return null;
  }
};

export const getPredictionStatus = async (
  predictionId: string
): Promise<{ status: string; output?: any; error?: string } | null> => {
  try {
    const response = await fetch(`${API_BASE}/predictions/${predictionId}`, {
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Replicate status error:', await response.text());
      return null;
    }

    const data = (await response.json()) as any;
    return {
      status: data.status,
      output: data.output,
      error: data.error,
    };
  } catch (error) {
    console.error('Replicate status error:', error);
    return null;
  }
};

export const pollPredictionUntilComplete = async (
  predictionId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<{ success: boolean; videoUrl?: string; error?: string }> => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getPredictionStatus(predictionId);

    if (!status) {
      return { success: false, error: 'Impossible de récupérer le statut' };
    }

    onProgress?.(status.status);

    if (status.status === 'succeeded') {
      const output = status.output;
      let videoUrl: string | undefined;

      if (typeof output === 'string') {
        videoUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        videoUrl = output[0];
      } else if (output && typeof output === 'object') {
        videoUrl = output.video || output.url || output[0];
      }

      return { success: true, videoUrl };
    }

    if (status.status === 'failed' || status.status === 'canceled') {
      return { success: false, error: status.error || 'La génération a échoué' };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { success: false, error: 'Délai de génération dépassé' };
};
