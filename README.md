# 🚀 GOJO Platform - Extracteur d'AO et Gestion de Prospects

Une plateforme moderne de gestion des appels d'offres et prospects pour les équipes commerciales.

## 📋 Structure du projet refactorisée

```
src/
├── components/           # Composants React
│   ├── common/           # Composants réutilisables
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchInput.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SortableHeader.tsx
│   │   ├── EditableField.tsx
│   │   └── ConfirmDialog.tsx
│   └── ...               # Composants spécifiques aux fonctionnalités
├── context/              # Contextes React
│   └── ThemeContext.tsx
├── hooks/                # Hooks personnalisés
│   ├── useAuth.ts
│   ├── useDataFetching.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useVirtualization.ts
├── services/             # Services et API
│   ├── api/              # Services d'API
│   │   ├── supabaseClient.ts
│   │   ├── rfpService.ts
│   │   ├── prospectService.ts
│   │   ├── clientNeedsService.ts
│   │   └── salesRepService.ts
│   ├── __tests__/        # Tests des services
│   └── ...               # Autres services
├── types/                # Types TypeScript
│   └── index.ts
├── utils/                # Utilitaires
│   ├── constants.ts
│   ├── dateUtils.ts
│   ├── errorHandling.ts
│   ├── performance.ts
│   └── testUtils.ts
└── App.tsx               # Composant racine
```

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
- **Backend** : Supabase (PostgreSQL + Edge Functions + Storage)
- **IA** : OpenAI GPT-4 pour l'analyse
- **Email** : SendGrid pour les notifications
- **Authentification** : Supabase Auth
- **Storage** : Supabase Storage pour les fichiers
- **Tests** : Jest + React Testing Library

## 🧪 Tests

Pour exécuter les tests :

```bash
npm test
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

### 🎨 Composants réutilisables
- **ErrorBoundary** : Capture et gère les erreurs dans l'arbre de composants
- **LoadingSpinner** : Indicateur de chargement personnalisable
- **Pagination** : Navigation entre les pages de résultats
- **SearchInput** : Champ de recherche avec debounce
- **StatusBadge** : Badge de statut avec styles adaptés
- **SortableHeader** : En-tête de tableau triable
- **EditableField** : Champ éditable en ligne
- **ConfirmDialog** : Dialogue de confirmation

### 🔐 Sécurité
- **Authentification obligatoire** via Supabase
- **Row Level Security** sur toutes les tables
- **Permissions granulaires** par commercial
- **Validation côté client et serveur**

## 📈 Performance

- **Virtualisation** des tableaux pour gros volumes de données
- **Debounce** pour les recherches et filtres
- **Optimisation des rendus** avec React.memo et useMemo
- **Gestion efficace des erreurs** avec ErrorBoundary
- **Lazy loading** des composants et des données

## 🔄 Workflow

1. **Réception AO** → Analyse IA → Assignation → Notification
2. **Prospect reçu** → Extraction données → Assignation → Notification  
3. **Suivi quotidien** → Récapitulatifs automatiques → Emails commerciaux
4. **Gestion statuts** → Tableaux de bord → Analytics

## 🚀 Déploiement

La plateforme est déployée automatiquement sur Netlify avec intégration continue.

## 🧩 Hooks personnalisés

- **useAuth** : Gestion de l'authentification
- **useDataFetching** : Récupération de données avec gestion d'état
- **useDebounce** : Debounce pour les entrées utilisateur
- **useLocalStorage** : Persistance des données dans localStorage
- **useVirtualization** : Virtualisation pour les grandes listes

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Version** : 3.0.0  
**Dernière mise à jour** : Juin 2025