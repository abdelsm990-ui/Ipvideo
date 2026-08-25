import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createSubscription,
  cancelPayPalSubscription,
  createOrder,
  captureOrder,
  PLAN_PRICES,
} from '../services/paypalService';
import {
  findUserById,
  updateUser,
  createSubscription as createDbSubscription,
  findSubscriptionByUser,
  updateSubscription,
  findSubscriptionByPaypalId,
  addPoints,
} from '../services/dbService';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/* ============================================
   PayPal Checkout (Orders - one-time)
   ============================================ */

export const createPayPalOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body as { plan: 'pro' };

    if (!plan || plan !== 'pro') {
      res.status(400).json({ success: false, message: 'Plan invalide' });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      res.status(500).json({ success: false, message: 'Configuration du plan invalide' });
      return;
    }

    // Create a PayPal order for 1 month
    const order = await createOrder(
      planConfig.amount,
      'USD',
      `Ipvideo ${plan.charAt(0).toUpperCase() + plan.slice(1)} - 1 mois`
    );

    // Save order ID on user for later capture
    await updateUser(userId, { paypal_order_id: order.id });

    res.json({
      success: true,
      orderId: order.id,
      approvalUrl: order.approvalUrl,
    });
  } catch (error) {
    console.error('Create PayPal order error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du paiement PayPal' });
  }
};

export const capturePayPalOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { orderId, plan } = req.body as { orderId: string; plan: 'pro' };

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    // Capture the order
    const capture = await captureOrder(orderId);

    if (!capture.success) {
      res.status(400).json({ success: false, message: 'Le paiement a échoué ou n\'est pas complété' });
      return;
    }

    // Activate plan for 1 month
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Add points based on plan
    const pointsToAdd = PLAN_PRICES[plan]?.points || 1000;
    await addPoints(userId, pointsToAdd, `Achat ${plan} - ${pointsToAdd} points`);

    await updateUser(userId, {
      plan,
      paypal_order_id: null,
    });

    // Create/update subscription record
    const existingSub = await findSubscriptionByUser(userId);
    if (existingSub) {
      await updateSubscription(existingSub.id, {
        status: 'active',
        plan,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });
    } else {
      await createDbSubscription({
        user_id: userId,
        paypal_subscription_id: orderId,
        status: 'active',
        plan,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Paiement confirmé ! Votre abonnement est maintenant actif.',
      plan,
      currentPeriodEnd: periodEnd.toISOString(),
    });
  } catch (error) {
    console.error('Capture PayPal order error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la confirmation du paiement' });
  }
};

/* ============================================
   PayPal Subscriptions (Monthly recurring)
   ============================================ */

export const createPayPalSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body as { plan: 'pro' };

    if (!plan || plan !== 'pro') {
      res.status(400).json({ success: false, message: 'Plan invalide' });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig || !planConfig.paypalPlanId) {
      res.status(500).json({
        success: false,
        message: 'Plan PayPal non configuré. Veuillez configurer PAYPAL_PLAN_PRO_ID dans les variables d\'environnement.',
      });
      return;
    }

    const sub = await createSubscription(
      planConfig.paypalPlanId,
      user.email,
      `${user.first_name} ${user.last_name}`
    );

    // Store pending subscription in DB so webhook can activate it later
    await createDbSubscription({
      user_id: userId,
      paypal_subscription_id: sub.id,
      status: 'active', // Will be confirmed by webhook
      plan,
    });

    await updateUser(userId, {
      paypal_subscription_id: sub.id,
    });

    res.json({
      success: true,
      subscriptionId: sub.id,
      approvalUrl: sub.approvalUrl,
    });
  } catch (error) {
    console.error('Create PayPal subscription error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'abonnement PayPal' });
  }
};

/* ============================================
   Cancel Subscription
   ============================================ */

export const cancelUserSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await findUserById(userId);

    if (!user || !user.paypal_subscription_id) {
      res.status(400).json({ success: false, message: 'Aucun abonnement actif' });
      return;
    }

    // Cancel on PayPal
    await cancelPayPalSubscription(user.paypal_subscription_id);

    // Update in database
    await updateUser(userId, {
      plan: 'free',
      paypal_subscription_id: null,
    });

    const sub = await findSubscriptionByUser(userId);
    if (sub) {
      await updateSubscription(sub.id, { status: 'cancelled' });
    }

    res.json({
      success: true,
      message: 'Abonnement annulé. Vous conserverez l\'accès jusqu\'à la fin de la période.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation' });
  }
};

/* ============================================
   Get Subscription Status
   ============================================ */

export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const subscription = await findSubscriptionByUser(userId);

    if (!subscription) {
      res.json({ success: true, subscription: null });
      return;
    }

    res.json({
      success: true,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* ============================================
   PayPal Webhook
   ============================================ */

export const paypalWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // PayPal webhooks include the event in the body directly
    const event = req.body;

    if (!event || !event.event_type) {
      res.status(400).json({ success: false, message: 'Invalid webhook payload' });
      return;
    }

    console.log(`PayPal webhook received: ${event.event_type}`);

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subId = event.resource?.id;
        const planId = event.resource?.plan_id;

        if (!subId) break;

        // Find our subscription record by PayPal subscription ID
        const dbSub = await findSubscriptionByPaypalId(subId);
        if (dbSub) {
          // Determine plan from PayPal plan ID or from our DB
          const plan = dbSub.plan;

          // Update subscription status
          await updateSubscription(dbSub.id, { status: 'active' });

          // Activate user plan
          await updateUser(dbSub.user_id, {
            plan,
            paypal_subscription_id: subId,
          });
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subId = event.resource?.id;
        if (!subId) break;

        const sub = await findSubscriptionByPaypalId(subId);
        if (sub) {
          await updateSubscription(sub.id, { status: 'cancelled' });
          await updateUser(sub.user_id, {
            plan: 'free',
            paypal_subscription_id: null,
          });
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Subscription payment received, extend period and add points
        const billingAgreement = event.resource?.billing_agreement_id;
        if (billingAgreement) {
          const sub = await findSubscriptionByPaypalId(billingAgreement);
          if (sub) {
            const newEnd = new Date();
            newEnd.setMonth(newEnd.getMonth() + 1);
            await updateSubscription(sub.id, {
              current_period_end: newEnd.toISOString(),
              status: 'active',
            });
            // Add monthly points based on plan
            const pointsToAdd = PLAN_PRICES[sub.plan]?.points || 1000;
            await addPoints(sub.user_id, pointsToAdd, `Renouvellement ${sub.plan} - ${pointsToAdd} points`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
