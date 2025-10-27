<div align="center">
  <img src="static/favicon.png" alt="TOEFL Practice Tool Logo" width="120" height="120">

  # TOEFL Independent Speaking Practice Tool

  ### Un outil web pour pratiquer le TOEFL Speaking avec feedback IA

  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)
  [![License](https://img.shields.io/badge/License-Personal%20Use-red.svg)](#licence)

  ---

  **Réalisé par** [Maël Le Guillouzic](https://github.com/Bastaxeloux)

</div>

Un outil web pour pratiquer les questions de speaking indépendant du TOEFL avec enregistrement audio, transcription automatique, analyse IA et fiches de vocabulaire.

Adaptation par Maël Le Guillouzic d'un projet de Lennart Rikk.
Disponible pour usage personnel et éducatif uniquement.

Si vous avez d'autres soucis que ceux énoncés dans ce README : débrouillez-vous, ChatGPT sera bien meilleur que nous tous.

---

### Utilisation rapide

```bash
git clone https://github.com/Bastaxeloux/TOEFL-PREP.git
cd TOEFL-PREP
# Gérer votre venv favori
python -m venv venv
# Pour activer l'environnement:
source venv/bin/activate # (macOS/Linux)
# Sur Windows: venv\Scripts\activate 

# Vous pouvez tout installer (sauf ffmpeg, voir ci dessous)
pip install -r requirements.txt
# Lancer l'application
python app.py
```

L'application sera accessible sur http://localhost:5001

## Fonctionnalités

- Interface web LOCALE !
- Transcription automatique avec Whisper (OpenAI)
- **Feedback IA détaillé** avec GPT-4o-mini (devrait pas etre trop couteux, j'ai fait 4 test ca ma couté 1 centime)
  - Évaluation sur l'échelle TOEFL (0-4)
  - Suggestions de vocabulaire avancé, et vous pouvez l'enregistrer comme une petite fiche ! (Avec recommandations de reformulation)
- Sélection aléatoire de X questions parmi votre collection
- Timers de préparation (15s) et de réponse (45s)
- Comptage de mots et calcul du débit de parole
- Sauvegarde des questions personnalisées

---

## Installation

### Prérequis

- Python 3.8+
- FFmpeg (pour la conversion audio)
- (Optionnel) Clé API OpenAI pour le feedback IA

### Installation manuelle

```bash
git clone https://github.com/Bastaxeloux/TOEFL-PREP.git
cd TOEFL-PREP
# Gérer votre venv favori
python -m venv venv
# Pour activer l'environnement:
source venv/bin/activate # (macOS/Linux)
# Sur Windows: venv\Scripts\activate 

# Vous pouvez tout installer (sauf ffmpeg, voir ci dessous)
pip install -r requirements.txt
# Lancer l'application
python app.py
```

L'application sera accessible sur http://localhost:5001

### Installation de FFmpeg

**macOS** :
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian)** :
```bash
sudo apt-get install ffmpeg
```

**Windows** :
- Téléchargez depuis [gyan.dev/ffmpeg](https://www.gyan.dev/ffmpeg/builds/)
- Extrayez dans `C:\ffmpeg`
- Ajoutez `C:\ffmpeg\bin` au PATH
- Ou utilisez Chocolatey : `choco install ffmpeg`

---

## Utilisation

### 1. Configuration initiale

Sur la page d'accueil :
- Modifiez les questions dans la zone dédiée (une question par ligne)
- Cliquez sur **"Save Prompts"** pour sauvegarder. C'est save sur votre PC.

### 2. Pendant l'exercice

1. Écoutez la question lue automatiquement (ou cliquez "Skip to Practice")
2. **15 secondes** de préparation (un bip annonce le début de l'enregistrement)
3. **45 secondes** de réponse (enregistrement automatique)
4. Consultez la transcription et vos statistiques
5. Si vous avez une clé API, recevez un feedback IA détaillé
6. Téléchargez l'enregistrement MP3 si nécessaire

### 3. Navigation

- **Next/Previous** : Passer entre les questions
- **Restart** : Recommencer la question actuelle
- **Reset** : Retourner à l'écran d'accueil

### 4. Fiches de vocabulaire

- Pendant l'exercice, cliquez sur **"Save to Vocabulary Flashcards"** dans la section vocabulaire du feedback
- Accédez à vos fiches via **"View My Vocabulary Flashcards"** sur la page d'accueil
- Les fiches sont sauvegardées dans `vocabulary_cards.json` et accessibles depuis n'importe quel navigateur.

---

## Obtenir une clé API OpenAI

1. Créez un compte sur https://platform.openai.com
2. Allez dans "API Keys" : https://platform.openai.com/api-keys
3. Cliquez sur "Create new secret key"
4. Copiez la clé (elle commence par `sk-...`)
5. Collez-la dans le champ "OpenAI API Key" sur la page d'accueil.

---

## Dépannage

### Le microphone ne fonctionne pas
- Vérifiez que votre navigateur a l'autorisation d'accéder au microphone
- Sur Chrome/Firefox, acceptez la demande d'autorisation qui apparaît

### FFmpeg n'est pas trouvé
L'application détecte automatiquement FFmpeg et affiche des instructions si non trouvé. Suivez les instructions d'installation ci-dessus.

### Le modèle Whisper est lent
- Premier chargement : 1-2 minutes (téléchargement du modèle "base")
- Transcription : 10-30 secondes selon votre CPU
- Pour de meilleures performances, utilisez un GPU (nécessite CUDA)

### Erreur de mémoire
- Le modèle "base" de Whisper nécessite ~1 Go de RAM
- Fermez d'autres applications si nécessaire

### Le port 5001 est déjà utilisé
- Modifiez le port dans `app.py` (dernière ligne) : `port=5001` => `port=5002`

### Le feedback IA ne s'affiche pas
- Vérifiez que vous avez entré une clé API OpenAI valide
- Vérifiez votre connexion internet
- Consultez la console du terminal pour voir les erreurs

---

## Contribuer

Si vous rencontrez un bug :

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](../../issues)
2. Créez une nouvelle issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Version de Python et système d'exploitation
   - Messages d'erreur complets

### Suggestions d'amélioration

Pour suggérer une amélioration :

1. Ouvrez une [issue](../../issues/new) avec le tag "enhancement"
2. Décrivez clairement votre idée
3. Expliquez pourquoi cela améliorerait l'expérience d'apprentissage

### Pull Requests

Si vous souhaitez contribuer du code :

1. **Fork** le projet
2. Créez une **branche** pour votre fonctionnalité :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
3. **Committez** vos changements :
   ```bash
   git commit -m "Add: Description de ma fonctionnalité"
   ```
4. **Pushez** vers votre fork :
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
5. Ouvrez une **Pull Request** avec :
   - Description claire des changements
   - Pourquoi c'est utile
   - Tests effectués

Toutes les contributions seront créditées dans le README.

---

**Bonne préparation pour votre TOEFL !**
