# 🚀 GOJO Platform - Extracteur d'AO et Gestion de Prospects

Une plateforme moderne de gestion des appels d'offres et prospects pour les équipes commerciales.

## ✨ Fonctionnalités

### 📋 Extracteur d'AO
- **Analyse automatique** des appels d'offres avec IA (OpenAI GPT-4)
- **Extraction intelligente** : client, mission, localisation, TJM, dates
- **Assignation automatique** aux commerciaux
- **Notifications email** instantanées
- **Gestion des statuts** et suivi complet

### 👥 Gestion des Prospects
- **Analyse de profils** pour prise de références
- **Upload de CV** avec extraction de contenu
- **Données structurées** : disponibilité, TJM, mobilité, coordonnées
- **Assignation commerciale** et notifications
- **Suivi des interactions**

### 🎯 Besoins Clients (Mode Démo)
- Interface pour **besoins clients simulés**
- Démonstration des fonctionnalités
- Prêt pour intégration future avec Boondmanager

### 📊 Analytics & Outils
- **Récapitulatifs quotidiens** automatiques
- **Statistiques** par commercial
- **Tests de fonctionnalités** intégrés
- **Tableaux de bord** en temps réel

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Edge Functions)
- **IA** : OpenAI GPT-4 pour l'analyse
- **Email** : SendGrid pour les notifications
- **Authentification** : Supabase Auth
- **Storage** : Supabase Storage pour les fichiers

## 🏗️ Architecture

```
src/
├── components/          # Composants React réutilisables
├── services/           # Services API et logique métier
├── types/              # Types TypeScript
├── hooks/              # Hooks React personnalisés
├── utils/              # Utilitaires et helpers
└── context/            # Contextes React (thème, etc.)

supabase/
├── migrations/         # Migrations de base de données
└── functions/          # Edge Functions Supabase
```

## 🚀 Démarrage rapide

1. **Installation des dépendances**
```bash
npm install
```

2. **Configuration des variables d'environnement**
```bash
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Démarrage du serveur de développement**
```bash
npm run dev
```

## ⚙️ Configuration

### OpenAI (Administrateurs uniquement)
- Configurer la clé API OpenAI dans les paramètres
- Nécessaire pour l'analyse automatique des AO et prospects

### Supabase
- Base de données PostgreSQL avec RLS activé
- Edge Functions pour les notifications email
- Storage pour les fichiers CV

### SendGrid
- Configuration automatique via variables d'environnement Supabase
- Templates d'email responsive et professionnels

## 📱 Interface utilisateur

### 🎨 Design System
- **Design Apple-inspired** avec attention aux détails
- **Mode sombre/clair** avec persistance par utilisateur
- **Responsive design** optimisé mobile/desktop
- **Micro-interactions** et animations fluides

### 🔐 Sécurité
- **Authentification obligatoire** via Supabase
- **Row Level Security** sur toutes les tables
- **Permissions granulaires** par commercial
- **Validation côté client et serveur**

## 📈 Performance

- **Virtualisation** des tableaux pour gros volumes
- **Pagination intelligente** et filtrage optimisé
- **Cache client** pour les données fréquentes
- **Lazy loading** des composants

## 🔄 Workflow

1. **Réception AO** → Analyse IA → Assignation → Notification
2. **Prospect reçu** → Extraction données → Assignation → Notification  
3. **Suivi quotidien** → Récapitulatifs automatiques → Emails commerciaux
4. **Gestion statuts** → Tableaux de bord → Analytics

## 🚀 Déploiement

La plateforme est déployée automatiquement sur Netlify avec intégration continue.

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Version** : 2.0.0  
**Dernière mise à jour** : Janvier 2025