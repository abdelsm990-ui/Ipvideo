/**
 * Script utilitaire pour créer les Plans de facturation PayPal
 * Usage: node scripts/create-paypal-plans.js
 * Nécessite: PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET dans .env
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
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

  const data = await response.json();
  return data.access_token;
}

async function createProduct(token, name, description) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `product-${Date.now()}`,
    },
    body: JSON.stringify({
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  if (!response.ok) {
    throw new Error(`Create product failed: ${await response.text()}`);
  }

  return response.json();
}

async function createPlan(token, productId, name, description, price) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `plan-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Create plan failed: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('❌ Erreur: PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET doivent être définis dans .env');
    console.log('\n1. Allez sur https://developer.paypal.com');
    console.log('2. Créez une App dans le Dashboard');
    console.log('3. Copiez le Client ID et Secret dans votre fichier .env');
    console.log('4. Relancez ce script');
    process.exit(1);
  }

  try {
    console.log('🔐 Authentification PayPal...');
    const token = await getAccessToken();
    console.log('✅ Connecté à PayPal\n');

    // Créer le produit
    console.log('📦 Création du produit "Ipvideo Subscription"...');
    const product = await createProduct(token, 'Ipvideo', 'Génération vidéo par IA');
    console.log(`✅ Produit créé: ${product.id}\n`);

    // Créer le plan Pro
    console.log('💎 Création du plan Pro (25$/mois)...');
    const proPlan = await createPlan(token, product.id, 'Ipvideo Pro', 'Plan Pro - 1000 points/mois', 25.0);
    console.log(`✅ Plan Pro créé: ${proPlan.id}`);

    // Créer le plan Enterprise
    console.log('🏢 Création du plan Enterprise (79$/mois)...');
    const enterprisePlan = await createPlan(token, product.id, 'Ipvideo Enterprise', 'Plan Enterprise - 5000 points/mois', 79.0);
    console.log(`✅ Plan Enterprise créé: ${enterprisePlan.id}\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('📋 AJOUTEZ CES VALEURS À VOTRE FICHIER .env:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`PAYPAL_PLAN_PRO_ID=${proPlan.id}`);
    console.log(`PAYPAL_PLAN_ENTERPRISE_ID=${enterprisePlan.id}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('💡 Prochaines étapes:');
    console.log('1. Copiez les IDs ci-dessus dans votre .env');
    console.log('2. Créez un Webhook sur https://developer.paypal.com');
    console.log('   URL: https://votredomaine.com/api/payments/webhook');
    console.log('   Events: BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED, PAYMENT.SALE.COMPLETED');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
