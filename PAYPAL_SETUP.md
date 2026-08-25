# Configuration PayPal — Ipvideo

Ce guide explique comment configurer PayPal pour accepter les paiements (25$/mois et 79$/mois) sur Ipvideo.

---

## Étape 1 : Compte Développeur PayPal

1. Allez sur **https://developer.paypal.com**
2. Connectez-vous avec votre compte PayPal existant, ou créez-en un
3. Une fois connecté, allez dans le **Dashboard**

---

## Étape 2 : Créer une Application

1. Dans le menu à gauche, cliquez sur **Apps & Credentials**
2. Cliquez sur **Create App**
3. Nom de l'app : `Ipvideo`
4. Type : **Merchant**
5. Cliquez sur **Create App**

### Récupérez vos identifiants :
- **Client ID** (commence par `A...`)
- **Secret** (cliquez sur "Show" pour le voir)

Copiez-les dans votre fichier `server/.env` :
```env
PAYPAL_CLIENT_ID=votre_client_id_ici
PAYPAL_CLIENT_SECRET=votre_secret_ici
```

> ⚠️ **Important** : En mode développement, PayPal utilise le **Sandbox**. Les paiements ne sont pas réels. Pour la production, vous devrez basculer en mode "Live".

---

## Étape 3 : Créer les Plans d'abonnement

PayPal nécessite des "Plans" (Plans de facturation) pour les paiements récurrents.

### Option A : Script Automatique (Recommandé)

Après avoir rempli `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET` dans le `.env` :

```bash
cd server
node scripts/create-paypal-plans.js
```

Le script va :
- Créer un produit "Ipvideo"
- Créer le **Plan Pro** à 25$/mois
- Créer le **Plan Enterprise** à 79$/mois
- Afficher les IDs à copier dans votre `.env`

### Option B : Manuellement via l'API

Si le script échoue, vous pouvez créer les plans via l'API PayPal ou l'interface développeur.

---

## Étape 4 : Configurer le Webhook

Les webhooks permettent à PayPal de notifier votre serveur quand un abonnement est activé, annulé, ou qu'un paiement est reçu.

### Créer le Webhook :

1. Dans le Dashboard PayPal Developer, allez dans votre App **Ipvideo**
2. Cliquez sur l'onglet **Webhooks** (ou allez dans **Webhooks** dans le menu)
3. Cliquez sur **Add Webhook**
4. Renseignez l'URL : `https://votredomaine.com/api/payments/webhook`
   - En local/test : utilisez **ngrok** pour exposer votre serveur
   - Exemple ngrok : `https://abc123.ngrok.io/api/payments/webhook`
5. Sélectionnez ces événements :
   - ✅ `Billing subscription activated`
   - ✅ `Billing subscription cancelled`
   - ✅ `Billing subscription suspended`
   - ✅ `Payment sale completed`
6. Cliquez sur **Save**

### Récupérer le Webhook ID :

Après création, PayPal affiche un **Webhook ID** (ex: `1AB23456CD789012E`).

Copiez-le dans votre `.env` :
```env
PAYPAL_WEBHOOK_ID=votre_webhook_id_ici
```

---

## Étape 5 : Tester le flux complet

1. Démarrez votre serveur : `npm run dev`
2. Ouvrez votre navigateur sur `http://localhost:3000/pricing.html`
3. Connectez-vous avec un compte utilisateur
4. Cliquez sur **S'abonner avec PayPal** (plan Pro)
5. PayPal va rediriger vers le sandbox de paiement
6. Utilisez un compte **Sandbox Buyer** pour tester
7. Après paiement, vous serez redirigé vers le dashboard
8. Vérifiez que les **points ont été ajoutés** à votre compte

### Comptes Sandbox de test :
PayPal fournit des comptes de test dans le Dashboard Developer :
- **Personal (Buyer)** : simule un client qui paie
- **Business (Merchant)** : simule votre compte vendeur

---

## Récapitulatif des variables .env

Après configuration, votre `server/.env` doit contenir :

```env
# PayPal
PAYPAL_CLIENT_ID=AbC123...xxx
PAYPAL_CLIENT_SECRET=EFg456...xxx
PAYPAL_PLAN_PRO_ID=P-1AB23456CDEF789012GHIJ
PAYPAL_PLAN_ENTERPRISE_ID=P-2CD34567EFGH890123IJKL
PAYPAL_WEBHOOK_ID=1AB23456CD789012E
```

---

## Dépannage courant

| Problème | Solution |
|----------|----------|
| "Client ID non configuré" | Vérifiez que les variables sont bien dans `.env` |
| "Plan PayPal non configuré" | Exécutez `node scripts/create-paypal-plans.js` |
| Webhook non reçu | Utilisez ngrok en local, vérifiez l'URL |
| Paiement sandbox échoue | Utilisez les comptes de test fournis par PayPal |
| Points non ajoutés | Vérifiez les logs serveur pour voir si le webhook est bien reçu |

---

## Passage en Production (Live)

Quand vous serez prêt à accepter de vrais paiements :

1. Dans le Dashboard PayPal Developer, basculez votre App en mode **Live**
2. Récupérez les nouveaux **Client ID** et **Secret** Live
3. Recréez les plans en mode Live (les IDs Sandbox ne fonctionnent pas en Live)
4. Mettez à jour le Webhook avec votre vraie URL de production
5. Mettez à jour toutes les variables dans `.env` sur votre serveur de production
6. Redémarrez le serveur

> 💡 **Astuce** : Les URLs de l'API PayPal changent automatiquement selon `NODE_ENV=production` dans le code.
