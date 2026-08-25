import { Router } from 'express';
import {
  createPayPalOrder,
  capturePayPalOrder,
  createPayPalSubscription,
  cancelUserSubscription,
  getSubscriptionStatus,
  paypalWebhook,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// PayPal webhook (raw body not needed for PayPal, they send JSON)
router.post('/webhook', paypalWebhook);

// PayPal Orders (one-time payment)
router.post('/paypal-order', authenticate, createPayPalOrder);
router.post('/paypal-capture', authenticate, capturePayPalOrder);

// PayPal Subscriptions (monthly recurring)
router.post('/paypal-subscription', authenticate, createPayPalSubscription);
router.post('/cancel', authenticate, cancelUserSubscription);
router.get('/status', authenticate, getSubscriptionStatus);

export default router;
