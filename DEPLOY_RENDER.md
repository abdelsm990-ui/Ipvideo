# 🚀 Déploiement sur Render (Gratuit)

Ce guide te permet de mettre ton application **Ipvideo** en ligne gratuitement sur [Render](https://render.com).

---

## ✅ Ce dont tu as besoin AVANT de commencer

1. **Compte GitHub** → https://github.com/signup (gratuit)
2. **Compte Render** → https://render.com (gratuit)
3. **Compte Supabase** → https://supabase.com (base de données déjà configurée)
4. **Token Replicate** → https://replicate.com/account/api-tokens (génération vidéo)

---

## Étape 1 : Créer un repo GitHub et pousser le code

### 1.1 Crée un nouveau repo sur GitHub
- Va sur https://github.com/new
- Nom du repo : `ipvideo` (ou ce que tu veux)
- **Ne coche PAS** "Initialize with README"
- Clique **Create repository**
- Copie l'URL du repo (ex: `https://github.com/TON_USERNAME/ipvideo.git`)

### 1.2 Pousse le code depuis ton PC

Dans PowerShell ou Git Bash (dans le dossier `C:\Users\Hp\Desktop\Ipvideo`) :

```bash
git remote add origin https://github.com/TON_USERNAME/ipvideo.git
git branch -M main
git push -u origin main
```

Remplace `TON_USERNAME` par ton vrai nom d'utilisateur GitHub.

---

## Étape 2 : Créer le service sur Render

### 2.1 Connecte ton repo
1. Va sur https://dashboard.render.com
2. Clique **New +** → **Web Service**
3. Choisis **Build and deploy from a Git repository**
4. Connecte ton compte GitHub et sélectionne le repo `ipvideo`

### 2.2 Configure le service
| Champ | Valeur |
|---|---|
| **Name** | `ipvideo` (ou ce que tu veux) |
| **Runtime** | `Docker` |
| **Plan** | `Free` |
| **Branch** | `main` |
| **Root Directory** | laisse vide (`.`) |
| **Dockerfile Path** | `./Dockerfile` |

Clique **Create Web Service**

---

## Étape 3 : Ajouter les variables d'environnement

Dans ton service Render, va dans l'onglet **Environment** et ajoute ces variables :

```
NODE_ENV=production
CLIENT_URL=https://ipvideo.onrender.com
JWT_SECRET=changez_ceci_par_une_cle_tres_longue_et_aleatoire_32_caracteres_min
JWT_EXPIRE=7d
SUPABASE_URL=https://sxkclerokwzwakjjxony.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TA_CLE_SUPABASE_ICI
REPLICATE_API_TOKEN=TON_TOKEN_REPLICATE_ICI
PAYPAL_CLIENT_ID=TON_CLIENT_ID_PAYPAL_ICI
PAYPAL_CLIENT_SECRET=TON_SECRET_PAYPAL_ICI
PAYPAL_PLAN_PRO_ID=P-05L36682RB3103432NKFXTKY
PAYPAL_WEBHOOK_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Remplace les valeurs vides par tes vraies clés.**

⚠️ **Important :**
- Pour `CLIENT_URL`, mets l'URL que Render va te donner (ex: `https://ipvideo.onrender.com`)
- Pour `JWT_SECRET`, génère une clé longue et aléatoire (minimum 32 caractères)
- `PAYPAL_WEBHOOK_ID` reste vide pour l'instant — on le remplira après le premier déploiement

---

## Étape 4 : Déployer

Render va automatiquement :
1. Builder l'image Docker
2. Déployer ton application
3. Te donner une URL (`https://ipvideo.onrender.com`)

Attends 3–5 minutes que le build se termine.

---

## Étape 5 : Configurer le webhook PayPal (après déploiement)

Maintenant que tu as une URL :

1. Va sur https://developer.paypal.com → Dashboard → ton App
2. **Webhooks** → **Add Webhook**
3. URL : `https://ipvideo.onrender.com/api/payments/webhook`
4. Événements à cocher :
   - ✅ `Billing subscription activated`
   - ✅ `Billing subscription cancelled`
   - ✅ `Payment sale completed`
5. **Save**
6. Copie le **Webhook ID** affiché
7. Retourne sur Render → onglet **Environment**
8. Ajoute/modifie : `PAYPAL_WEBHOOK_ID=ton_webhook_id_copié`
9. Render redéploiera automatiquement

---

## 🔧 Commandes utiles

Tu n'as pas besoin de terminal — tout se fait via l'interface Render.

- **Voir les logs** : Onglet **Logs** sur Render
- **Redémarrer** : Onglet **Settings** → **Manual Deploy** → **Deploy latest commit**
- **Mettre à jour le code** : `git push` depuis ton PC, Render déploie automatiquement

---

## ⚠️ Limitations du plan Gratuit Render

| Limite | Détail |
|---|---|
| **Sommeil** | Après 15 minutes d'inactivité, le serveur "s'endort". La 1ère requête suivante prend 30–60 secondes pour réveiller le serveur. |
| **Disque** | Limite de stockage (suffisant pour démarrer) |
| **Bande passante** | 100 Go/mois |

Pour un site de production avec trafic constant, tu devras passer au plan **Starter** ($7/mois).

---

## 🆘 Dépannage

| Problème | Solution |
|---|---|
| Build échoue | Vérifie les logs dans l'onglet **Logs** → **Build** |
| Site affiche "Not Found" | Le build du frontend n'a pas copié le dossier `client`. Vérifie les logs. |
| Erreur 500 sur l'API | Vérifie que toutes les variables d'environnement sont bien remplies |
| CORS error | Assure-toi que `CLIENT_URL` correspond bien à l'URL Render |

---

## ✅ Résumé

1. Crée repo GitHub → pousse le code
2. Crée Web Service sur Render (Docker, plan Free)
3. Ajoute les variables d'environnement
4. Attends le déploiement
5. Configure le webhook PayPal avec l'URL Render

**Ton site sera en ligne à : `https://ipvideo.onrender.com`** 🎉
