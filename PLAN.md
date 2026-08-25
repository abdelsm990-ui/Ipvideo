# Plan : Ajout du multilingue FR / EN / AR

## Objectif
Permettre aux utilisateurs de basculer entre Français, Anglais et Arabe sur toutes les pages statiques du site.

## Architecture

### 1. Système i18n central
**Fichier** : `client/js/i18n.js`
- Objet `translations` à 3 niveaux : `fr`, `en`, `ar`
- Fonction `t(key, lang)` pour récupérer une traduction (fallback `fr`)
- Fonction `applyTranslations()` : scanne `document.querySelectorAll('[data-i18n]')` et injecte le texte traduit
- Fonction `setLanguage(lang)` :
  - Persiste dans `localStorage`
  - Met à jour `document.documentElement.lang`
  - Gère `dir="rtl"` pour l'arabe + ajoute classe CSS `rtl`
  - Déclenche `applyTranslations()`
- Gestion du RTL : bascule `document.body.dir` et repositionne certains layouts si nécessaire

### 2. Sélecteur de langue
**Où** : Header de chaque page (à côté des boutons d'auth ou logout)
**Style** : Dropdown compact avec drapeaux emoji ou codes `FR | EN | AR`
**Comportement** : Au clic, appelle `setLanguage()` et recharge la page (ou applique dynamiquement)

### 3. Balisage HTML
Sur chacune des 7 pages HTML, ajouter l'attribut `data-i18n="key"` sur :
- Les balises `<title>`
- Les liens de navigation
- Les titres `<h1>`, `<h2>`, `<h3>`
- Les paragraphes descriptifs
- Les labels de formulaire
- Les placeholders d'input
- Les boutons
- Les textes du footer
- Les messages d'alerte inline

Pages concernées :
1. `client/index.html` (landing + features + FAQ + footer)
2. `client/login.html`
3. `client/register.html`
4. `client/dashboard.html`
5. `client/generate.html`
6. `client/pricing.html`
7. `client/how-it-works.html`

### 4. Traductions
Créer ~80–100 clés de traduction couvrant :
- Navigation & header
- Titres de sections
- Formulaires (labels, placeholders, boutons)
- Messages d'erreur / succès
- Footer

Langues :
- **Français** (source actuelle)
- **Anglais** (traduction littérale)
- **Arabe** (traduction avec support RTL)

### 5. Police arabe
Ajouter dans le `<head>` de chaque page une police Google Fonts compatible arabe (ex: `Cairo` ou `Tajawal`) conditionnellement chargée ou en fallback.

### 6. Scripts JS
Mettre à jour pour traduire les textes dynamiques :
- `client/js/auth.js` : messages d'erreur login/register
- `client/js/generate.js` : étapes de progression, messages de statut
- `client/js/main.js` : tout texte injecté dynamiquement

### 7. Ajustements CSS (légers)
- `.rtl` class pour inverser les margins/paddings directionnels si le design actuel dépend de `margin-left/right`
- Le layout flex/grid actuel devrait supporter RTL avec `dir="rtl"` naturellement sur la plupart des éléments

## Fichiers créés
- `client/js/i18n.js`

## Fichiers modifiés
- `client/index.html`
- `client/login.html`
- `client/register.html`
- `client/dashboard.html`
- `client/generate.html`
- `client/pricing.html`
- `client/how-it-works.html`
- `client/js/auth.js`
- `client/js/generate.js`
- `client/js/main.js`
- `client/css/style.css` (ajout règles RTL mineures)

## Complexité
- **Taille** : Grande (~7 pages HTML × ~30 textes chacune = ~210 attributs `data-i18n` à ajouter)
- **Risque** : Faible — modifications purement frontales, aucun impact backend
- **Temps estimé** : Conséquent mais mécanique (beaucoup de copier-coller de texte existant dans le fichier de traduction)

## Approche recommandée
Implémenter en 3 phases pour rester efficace :
1. **Phase 1** : Créer `i18n.js` + ajouter le sélecteur de langue sur `index.html` + traduire `index.html` (preuve de concept)
2. **Phase 2** : Propager sur les 6 autres pages HTML
3. **Phase 3** : Traduire les textes dynamiques des fichiers JS
