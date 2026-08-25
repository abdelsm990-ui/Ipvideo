import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${await response.text()}`);
  }

  const data = (await response.json()) as any;
  return data.access_token;
}

/* ============================================
   PayPal Orders (One-time payments)
   ============================================ */

export async function createOrder(
  amount: number,
  currency: string = 'USD',
  description: string = 'Ipvideo Subscription'
): Promise<{ id: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `order-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description,
          custom_id: 'ipvideo-payment',
        },
      ],
      application_context: {
        brand_name: 'Ipvideo',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_URL}/dashboard.html?checkout=success`,
        cancel_url: `${process.env.CLIENT_URL}/pricing.html?checkout=canceled`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal create order failed: ${await response.text()}`);
  }

  const order = (await response.json()) as any;
  const approvalLink = order.links?.find((l: any) => l.rel === 'approve');

  return {
    id: order.id,
    approvalUrl: approvalLink?.href || '',
  };
}

export async function captureOrder(orderId: string): Promise<{ success: boolean; amount?: string; status?: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return { success: false };
  }

  const capture = (await response.json()) as any;
  const purchaseUnit = capture.purchase_units?.[0];
  const captureData = purchaseUnit?.payments?.captures?.[0];

  return {
    success: capture.status === 'COMPLETED',
    amount: captureData?.amount?.value,
    status: capture.status,
  };
}

/* ============================================
   PayPal Subscriptions (Monthly recurring)
   ============================================ */

export async function createSubscription(
  planId: string,
  subscriberEmail: string,
  subscriberName: string
): Promise<{ id: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `sub-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      subscriber: {
        name: {
          given_name: subscriberName.split(' ')[0] || subscriberName,
          surname: subscriberName.split(' ').slice(1).join(' ') || '',
        },
        email_address: subscriberEmail,
      },
      application_context: {
        brand_name: 'Ipvideo',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.CLIENT_URL}/dashboard.html?checkout=success`,
        cancel_url: `${process.env.CLIENT_URL}/pricing.html?checkout=canceled`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal create subscription failed: ${await response.text()}`);
  }

  const sub = (await response.json()) as any;
  const approvalLink = sub.links?.find((l: any) => l.rel === 'approve');

  return {
    id: sub.id,
    approvalUrl: approvalLink?.href || '',
  };
}

export async function getSubscription(subscriptionId: string): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function cancelPayPalSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<void> {
  const accessToken = await getAccessToken();

  await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
}

/* ============================================
   PayPal Webhook verification
   ============================================ */

export async function verifyWebhook(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'] || '',
      cert_url: headers['paypal-cert-url'] || '',
      transmission_id: headers['paypal-transmission-id'] || '',
      transmission_sig: headers['paypal-transmission-sig'] || '',
      transmission_time: headers['paypal-transmission-time'] || '',
      webhook_id: process.env.PAYPAL_WEBHOOK_ID || '',
      webhook_event: JSON.parse(body),
    }),
  });

  if (!response.ok) return false;
  const result = (await response.json()) as any;
  return result.verification_status === 'SUCCESS';
}

/* ============================================
   Helper: Plan prices
   ============================================ */

export const PLAN_PRICES: Record<string, { amount: number; points: number; paypalPlanId?: string }> = {
  pro: { amount: 25.0, points: 1000, paypalPlanId: process.env.PAYPAL_PLAN_PRO_ID },
};
