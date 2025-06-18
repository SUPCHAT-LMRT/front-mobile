# 📣 SUPCHAT – Mobile Client

SUPCHAT est une plateforme collaborative de communication interne destinée aux entreprises. Ce dépôt correspond au **client mobile** de l'application, développé avec **SvelteKit**, **Tailwind CSS**, et **shadcn-svelte**. Le client interagit exclusivement avec une API REST développée en Go, et s’intègre dans une architecture complète conteneurisée via Docker.

## 🚀 Objectif du projet

Dans le cadre d’un appel d’offres lancé par la société fictive *La confiance règne*, SUPCHAT a été conçu pour :

- Améliorer la collaboration entre équipes internes
- Proposer un outil moderne, responsive, multiplateforme (web et mobile)
- Offrir une expérience utilisateur intuitive et sécurisée

## 📚 Fonctionnalités principales

✅ Authentification :
- Connexion par email/mot de passe ou via Google/GitHub (OAuth2)
- Gestion de session avec JWT

✅ Espaces de travail :
- Création d’espaces publics ou privés
- Tableau de bord utilisateur

✅ Canaux :
- Canaux publics ou privés dans chaque espace
- Arborescence et gestion dynamique

✅ Messagerie temps réel :
- WebSocket natif
- Messages texte, fichiers, emojis, mentions (@) et hashtags (#)
- Notifications en temps réel

✅ Gestion des rôles et permissions :
- Rôles (admin, manager, membre)
- Droits personnalisés par canal ou workspace

✅ Recherche unifiée :
- Recherche full-text (Meilisearch)
- Messages, utilisateurs, canaux, fichiers

✅ Intégrations :
- Google Drive, GitHub, bots personnalisés (sondages, traducteur, etc.)

✅ Préférences utilisateur :
- Thème clair/sombre
- Statut personnalisé
- Export des données (RGPD)

## 🛠️ Technologies utilisées

| Côté              | Stack technique |
|-------------------|-----------------|
| **Frontend**      | SvelteKit, TypeScript, TailwindCSS, shadcn-svelte |
| **Communication** | Axios (REST API), WebSocket natif |
| **UI/UX**         | Lucide-svelte pour les icônes, responsive design mobile & desktop |
| **Backend (API)** | Go, Gin, WebSocket, MongoDB, Redis, Meilisearch, S3 |
| **Mobile**        | SvelteKit + Capacitor |
| **DevOps**        | Docker, Docker Compose, multi-arch Buildx |

## 🧩 Architecture

Ce client web fait partie d’un projet plus large composé de 3 briques principales :

- **API Backend** – [`back-go`](https://github.com/SUPCHAT-LMRT/back-go)
- **Frontend Web** – [`front-web`](https://github.com/SUPCHAT-LMRT/front-web)
- **Frontend Mobile** – [`front-mobile`](https://github.com/SUPCHAT-LMRT/front-mobile) *(ce dépôt)*

L'architecture suit une stricte séparation des responsabilités. Aucune logique métier n’est exécutée côté client.
