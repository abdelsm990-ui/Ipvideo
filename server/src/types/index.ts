export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  plan: 'free' | 'pro';
  points_balance: number;
  points_used: number;
  paypal_subscription_id?: string | null;
  paypal_order_id?: string | null;
  trial_ends_at?: string | null;
  is_trial_used: boolean;
  video_count: number;
  voice_credits: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  style: string;
  duration: number;
  quality: string;
  ratio: string;
  music?: string | null;
  points_cost: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  replicate_prediction_id?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string;
  status: 'active' | 'cancelled' | 'suspended';
  plan: 'pro';
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at: string;
  updated_at: string;
}
