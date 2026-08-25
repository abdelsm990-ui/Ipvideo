import { supabase } from '../config/supabase';
import { User, Video, Subscription } from '../types';

/* ============================================
   User Operations
   ============================================ */

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: userData.password,
      plan: userData.plan || 'free',
      points_balance: userData.points_balance || 120, // Free trial: 120 points (3 videos of 30s)
      points_used: 0,
      trial_ends_at: userData.trial_ends_at,
      is_trial_used: userData.is_trial_used || false,
      voice_credits: userData.voice_credits || 0,
      video_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('createUser error:', error);
    return null;
  }
  return data as User;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateUser error:', error);
    return null;
  }
  return data as User;
}

export async function incrementVideoCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_video_count', { user_uuid: userId });
  if (error) {
    // Fallback if RPC not defined
    const { data: user } = await supabase.from('users').select('video_count').eq('id', userId).single();
    if (user) {
      await supabase.from('users').update({ video_count: (user.video_count || 0) + 1 }).eq('id', userId);
    }
  }
}

/* ============================================
   Video Operations
   ============================================ */

export async function createVideo(videoData: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .insert(videoData)
    .select()
    .single();

  if (error) {
    console.error('createVideo error:', error);
    return null;
  }
  return data as Video;
}

export async function findVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Video;
}

export async function findVideosByUser(userId: string, limit = 50): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('findVideosByUser error:', error);
    return [];
  }
  return (data || []) as Video[];
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateVideo error:', error);
    return null;
  }
  return data as Video;
}

/* ============================================
   Subscription Operations
   ============================================ */

export async function createSubscription(subData: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subData)
    .select()
    .single();

  if (error) {
    console.error('createSubscription error:', error);
    return null;
  }
  return data as Subscription;
}

export async function findSubscriptionByUser(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Subscription;
}

export async function findSubscriptionByPaypalId(paypalSubscriptionId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', paypalSubscriptionId)
    .single();

  if (error || !data) return null;
  return data as Subscription;
}

export async function updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateSubscription error:', error);
    return null;
  }
  return data as Subscription;
}

/* ============================================
   Points System Operations
   ============================================ */

// Calculate video cost in points
// Standard (Zeroscope): 40 points for 30 seconds
// Premium (Luma): 120 points for 30 seconds (3x more expensive)
export function calculateVideoCost(duration: number, modelQuality: 'standard' | 'premium' = 'standard'): number {
  const baseCost = Math.ceil((duration / 30) * 40);
  const multiplier = modelQuality === 'premium' ? 3 : 1;
  return baseCost * multiplier;
}

export async function deductPoints(userId: string, amount: number, description: string, videoId?: string): Promise<boolean> {
  const { data: user } = await supabase.from('users').select('points_balance, points_used').eq('id', userId).single();
  if (!user || user.points_balance < amount) return false;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      points_balance: user.points_balance - amount,
      points_used: ((user as any).points_used || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('deductPoints error:', updateError);
    return false;
  }

  // Record transaction
  await supabase.from('point_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'debit',
    description,
    related_video_id: videoId || null,
  });

  return true;
}

export async function addPoints(userId: string, amount: number, description: string): Promise<boolean> {
  const { data: user } = await supabase.from('users').select('points_balance').eq('id', userId).single();
  if (!user) return false;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      points_balance: (user.points_balance || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    console.error('addPoints error:', updateError);
    return false;
  }

  // Record transaction
  await supabase.from('point_transactions').insert({
    user_id: userId,
    amount,
    type: 'credit',
    description,
  });

  return true;
}

export async function getPointTransactions(userId: string, limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getPointTransactions error:', error);
    return [];
  }
  return data || [];
}
