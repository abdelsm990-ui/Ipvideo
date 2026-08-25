#!/bin/bash
# ============================================================
# Script de déploiement Hostinger VPS pour Ipvideo
# Usage: bash deploy-hostinger.sh
# ============================================================

set -e

echo "🚀 Déploiement Ipvideo sur Hostinger VPS"
echo "=========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier si on est sur le VPS ou en local
if [ "$1" == "--local" ]; then
    echo -e "${YELLOW}Mode: Préparation du zip en local${NC}"

    # Créer le zip sans le .env et node_modules
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ZIP_NAME="ipvideo-deploy-${TIMESTAMP}.zip"

    echo "📦 Création de l'archive ${ZIP_NAME}..."

    # Monter d'un niveau pour zipper depuis la racine Ipvideo
    cd ..

    zip -r "${ZIP_NAME}" Ipvideo/ \
        -x "*/node_modules/*" \
        -x "*/.env" \
        -x "*/.git/*" \
        -x "*/dist/*" \
        -x "*/.claude/*" \
        -x "*/memory/*" \
        -x "*.log"

    echo -e "${GREEN}✅ Archive créée: ${ZIP_NAME}${NC}"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Téléchargez ${ZIP_NAME}"
    echo "2. Connectez-vous à votre VPS Hostinger via SSH"
    echo "3. Uploadez le zip: scp ${ZIP_NAME} root@votre-ip:/root/"
    echo "4. Sur le VPS, exécutez: bash deploy-hostinger.sh"
    exit 0
fi

# ============================================================
# Partie VPS (exécutée sur le serveur Hostinger)
# ============================================================

echo -e "${GREEN}Mode: Déploiement sur VPS${NC}"

# Mettre à jour le système
echo "🔄 Mise à jour du système..."
apt-get update -y
apt-get upgrade -y

# Installer les dépendances
echo "📦 Installation des dépendances..."
apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    docker.io \
    docker-compose \
    ufw \
    unzip

# Démarrer Docker
echo "🐳 Configuration de Docker..."
systemctl enable docker
systemctl start docker

# Créer le répertoire de l'application
APP_DIR="/var/www/ipvideo"
mkdir -p "${APP_DIR}"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}⚠️  CONFIGURATION MANUELLE REQUISE${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Vous devez maintenant:"
echo ""
echo "1. Uploader votre code dans: ${APP_DIR}"
echo "   cd ${APP_DIR}"
echo ""
echo "2. Créer le fichier .env:"
echo "   nano ${APP_DIR}/server/.env"
echo ""
echo "   Contenu obligatoire:"
echo "   --------------------"
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo "   CLIENT_URL=https://votredomaine.com"
echo "   SUPABASE_URL=https://sxkclerokwzwakjjxony.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici"
echo "   JWT_SECRET=une_cle_secrete_tres_longue_et_aleatoire"
echo "   JWT_EXPIRE=7d"
echo "   PAYPAL_CLIENT_ID=votre_id_paypal"
echo "   PAYPAL_CLIENT_SECRET=votre_secret_paypal"
echo "   PAYPAL_PLAN_PRO_ID=P-05L36682RB3103432NKFXTKY"
echo "   PAYPAL_PLAN_ENTERPRISE_ID=P-7LS12504PX9291133NKFXTLA"
echo "   PAYPAL_WEBHOOK_ID=votre_webhook_id"
echo "   REPLICATE_API_TOKEN=votre_token_replicate"
echo ""
echo "3. Lancer l'application:"
echo "   cd ${APP_DIR}"
echo "   docker-compose up -d --build"
echo ""
echo "4. Configurer Nginx:"
echo "   cp nginx.conf /etc/nginx/sites-available/ipvideo"
echo "   ln -s /etc/nginx/sites-available/ipvideo /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   systemctl restart nginx"
echo ""
echo "5. Configurer SSL (HTTPS):"
echo "   certbot --nginx -d votredomaine.com -d www.votredomaine.com"
echo ""
echo -e "${GREEN}✅ Guide de déploiement affiché !${NC}"
