<div align="center">
  <img src="static/favicon.png" alt="TOEFL Practice Tool Logo" width="120" height="120">

  # TOEFL Speaking Practice Tool

  ### Un outil web pour pratiquer les 4 tâches du TOEFL Speaking avec feedback IA

  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)
  [![License](https://img.shields.io/badge/License-Personal%20Use-red.svg)](#licence)

  ---

  **Réalisé par** [Maël Le Guillouzic](https://github.com/Bastaxeloux)

</div>

Un outil web pour pratiquer toutes les questions du TOEFL Speaking avec enregistrement audio, transcription automatique, analyse IA et fiches de vocabulaire.

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
- **Les 4 tâches du TOEFL Speaking** :
  - Task 1 : Independent Speaking (15s prep, 45s speak)
  - Task 2 : Campus Announcement (50s read, listen, 30s prep, 60s speak)
  - Task 3 : Academic Concept (50s read, listen, 30s prep, 60s speak)
  - Task 4 : Lecture Summary (listen, 20s prep, 60s speak)
- **Mode test complet** : Enchaînez les 4 tâches d'affilée
- **Mode entraînement individuel** : Pratiquez chaque tâche séparément
- Transcription automatique avec Whisper (OpenAI)
- **Feedback IA détaillé** avec GPT-4o-mini (devrait pas être trop coûteux, j'ai fait 4 tests ça m'a coûté 1 centime)
  - Évaluation sur l'échelle TOEFL (0-4)
  - Suggestions de vocabulaire avancé, et vous pouvez l'enregistrer comme une petite fiche ! (Avec recommandations de reformulation)
- Sélection aléatoire ou manuelle de prompts
- Gestion de vos propres textes et audios pour les tasks 2, 3 et 4
- Timers automatiques selon chaque tâche
- Comptage de mots et calcul du débit de parole
- Sauvegarde des prompts personnalisés

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
- Allez dans l'onglet **"Customization"**
- Ajoutez votre clé API OpenAI (optionnel mais recommandé)
- Configurez vos prompts pour chaque tâche :
  - **Task 1** : Entrez vos questions (une par ligne)
  - **Task 2, 3, 4** : Créez des prompts avec textes et audios

### 2. Mode test complet

1. Sur la page d'accueil, cliquez sur **"Start Test"**
2. Faites les 4 tâches à la suite (15-20 minutes au total)
3. Recevez vos résultats complets à la fin

### 3. Mode entraînement individuel

1. Cliquez sur **"Practice Individual Tasks"**
2. Sélectionnez la tâche que vous voulez pratiquer
3. Configurez vos prompts ou laissez en mode aléatoire
4. Pratiquez autant de fois que vous voulez

### 4. Pendant l'exercice

- Pour **Task 1** : Écoutez la question, préparez-vous (15s), puis répondez (45s)
- Pour **Task 2 et 3** : Lisez le texte (50s), écoutez l'audio, préparez-vous (30s), puis répondez (60s)
- Pour **Task 4** : Écoutez l'audio, préparez-vous (20s), puis répondez (60s)
- Consultez la transcription et vos statistiques
- Si vous avez une clé API, recevez un feedback IA détaillé
- Téléchargez vos enregistrements MP3 si nécessaire

### 5. Fiches de vocabulaire

- Pendant l'exercice, cliquez sur **"Save to Vocabulary Flashcards"** dans la section vocabulaire du feedback
- Accédez à vos fiches via **"View My Vocabulary Flashcards"** sur la page d'accueil
- Les fiches sont sauvegardées dans `vocabulary_cards.json` et accessibles depuis n'importe quel navigateur

---

## Obtenir une clé API OpenAI

1. Créez un compte sur https://platform.openai.com
2. Allez dans "API Keys" : https://platform.openai.com/api-keys
3. Cliquez sur "Create new secret key"
4. Copiez la clé (elle commence par `sk-...`)
5. Collez-la dans le champ "OpenAI API Key" dans l'onglet Customization

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

### Les audios ne se chargent pas pour Task 2/3/4
- Vérifiez que vous avez bien uploadé un fichier audio dans le modal de création de prompt
- Les audios sont sauvegardés dans le dossier `static/task_audios/`
- Formats acceptés : MP3, WAV, OGG, M4A

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
