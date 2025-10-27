# TOEFL Independent Speaking Question Practice Tool

Un outil web pour pratiquer les questions de speaking indépendant du TOEFL avec enregistrement audio, transcription automatique et analyse.

Adaptation par Maël Le Guillouzic d'un projet de Lennart Rikk.
Disponible pour usage personnel et éducatif uniquement.

Si vous avez d'autres soucis que ceux énoncés dans ce README : debrouillez vous, Chat GPT sera bien meilleur que nous tous.

---

## Fonctionnalités

- Interface web locale
- Enregistrement audio de vos réponses
- Transcription automatique avec Whisper (OpenAI)
- Timers de préparation (15s) et de réponse (45s)
- Comptage de mots et calcul du débit de parole
- Sauvegarde des questions personnalisées

---

## Utilisation

1. **Page d'accueil** :
   - Modifiez les questions dans le textarea
   - Cliquez sur **"Save Prompts"** pour sauvegarder vos modifications
   - Cliquez sur **"Start Practice"** pour commencer

2. **Pendant l'exercice** :
   - Écoutez la question lue automatiquement
   - **15 secondes** de préparation (un bip annonce le début)
   - **45 secondes** de réponse (enregistrement automatique)
   - Consultez la transcription et vos statistiques
   - Téléchargez l'enregistrement MP3

3. **Navigation** :
   - **Next/Previous** : Passer entre les questions
   - **Restart** : Recommencer la question actuelle
   - **Reset** : Retourner à l'écran d'accueil

---

## Installation Manuelle

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

## Dépannage

### Le microphone ne fonctionne pas
- Vérifiez que votre navigateur a l'autorisation d'accéder au microphone
- Sur Chrome/Firefox, acceptez la demande d'autorisation qui apparaît

### FFmpeg n'est pas trouvé
L'application détecte automatiquement FFmpeg et affiche des instructions si non trouvé :

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

### Le modèle Whisper est lent
- Premier chargement : 1-2 minutes (téléchargement du modèle)
- Transcription : 10-30 secondes selon votre CPU
- Pour de meilleures performances, utilisez un GPU (nécessite CUDA)

### Erreur de mémoire
- Le modèle "base" de Whisper nécessite ~1 Go de RAM
- Fermez d'autres applications si nécessaire

### Le port 5001 est déjà utilisé
- Modifiez le port dans `app.py` (ligne 179) : `port=5001` => `port=5002`

---

### Sauvegarder vos questions

1. Collez vos nouvelles questions dans le textarea de la page d'accueil
2. Cliquez sur **"Save Prompts"**
3. Elles seront automatiquement rechargées au prochain démarrage

---

## Contribuer ?

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

## Licence

Cet outil est disponible pour **usage personnel et éducatif uniquement** L'usage commercial est strictement interdit. Vous pouvez modifier le code pour votre usage personnel

---

## Liens utiles

- [TOEFL Official Website](https://www.ets.org/toefl)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Bonne préparation pour votre TOEFL !**
