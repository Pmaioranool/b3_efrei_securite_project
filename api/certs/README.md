# Certificats SSL/TLS

Ce dossier contient les certificats auto-signés pour HTTPS en développement.

## ⚠️ IMPORTANT

- **Ces certificats sont auto-signés** et utilisés uniquement pour le développement
- **NE JAMAIS** utiliser ces certificats en production
- Les fichiers `.pem` sont ignorés par Git (`.gitignore`)

## 📁 Fichiers

- `private-key.pem` : Clé privée RSA 2048 bits
- `certificate.pem` : Certificat auto-signé valide 365 jours
- `openssl.cnf` : Configuration OpenSSL

## 🔧 Régénération des certificats

Si vous devez régénérer les certificats :

```bash
# 1. Générer la clé privée
openssl genrsa -out private-key.pem 2048

# 2. Générer le certificat
openssl req -new -x509 -key private-key.pem -out certificate.pem -days 365 -config openssl.cnf
```

## 🚀 Activation HTTPS

Dans le fichier `.env`, définir :

```
NODE_ENV=PRODUCTION
USE_HTTPS=true
```

Le serveur démarrera alors en HTTPS sur `https://localhost:3000`

## 🌐 Production

En production, utiliser un certificat valide :

- **Let's Encrypt** (gratuit)
- **Certificat commercial**
- **Reverse proxy** (Nginx, Caddy) avec certificat automatique
