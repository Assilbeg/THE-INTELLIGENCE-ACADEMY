# INTELLIGENCE ACADEMY - Génération de Documents de Formation

## Contexte

Ce projet contient des scripts Python pour générer les documents administratifs des formations MINDNESS :
- **Feuilles d'émargement** : `generer_emargement.py` + template `EMARGEMENT TEMPLATE.docx`
- **Certificats de réalisation** : `generer_certificat.py` + template `certificat_de_réalisation template.docx`
- **Convocations** : `generer_convocation.py` + template `convocation template.docx`

---

## 🎯 Mission de l'Assistant

### Pour générer un document :

1. **Collecter les informations** en posant des questions si nécessaire
2. **Créer/mettre à jour le fichier JSON** avec les données de la formation
3. **Exécuter le script** approprié
4. **Ouvrir le fichier généré** pour validation

**Note importante** : Un seul fichier JSON peut servir pour les 3 types de documents (émargement, certificat, convocation). Les champs non utilisés par un script sont simplement ignorés.

---

## 📋 Grille des Informations à Collecter (JSON Unifié)

| Champ | Émargement | Certificat | Convocation | Exemple |
|-------|:----------:|:----------:|:-----------:|---------|
| **nom_formation** | ✅ | ✅ | ✅ | "Prompt Engineering Avancé" |
| **date_debut** | ✅ | ✅ | ✅ | "16/12/2024" |
| **date_fin** | ✅ | ✅ | ✅ | "17/12/2024" |
| **lieu** | ✅ | ❌ | ✅ | "Distanciel" ou "Présentiel, [adresse]" |
| **duree_heures** | ✅ | ✅ | ✅ | 14 |
| **duree_jours** | ❌ | ❌ | ✅ | 2 |
| **formateurs** | ✅ | ❌ | ✅ | ["ALBOUZE Alexis"] |
| **apprenants** | ✅ | ✅ | ✅ | nom, prénom, email |
| **sessions** | ✅ | ❌ | ✅ | Voir format ci-dessous |
| **ville_signature** | ✅ | ✅ | ❌ | "Paris" |
| **date_emission** | ❌ | ❌ | ❓ | Date du jour par défaut |
| **lien_ressources** | ❌ | ❌ | ❓ | URL Google Drive (optionnel) |

---

## 📁 Format JSON Unifié

```json
{
    "nom_formation": "Création de contenus rédactionnels et visuels par l'IA",
    "date_debut": "17/11/2025",
    "date_fin": "16/12/2025",
    "lieu": "Distanciel",
    "duree_heures": 32.5,
    "duree_jours": 8,
    "formateurs": ["ALBOUZE Alexis"],
    "apprenants": [
        {"nom": "TABARY", "prenom": "Julien", "email": "julien.tabary@gmail.com"}
    ],
    "ville_signature": "Paris",
    "sessions": [
        {"date": "17/11/2025", "type": "E-learning", "debut": "10h00", "fin": "12h00"},
        {"date": "17/11/2025", "type": "Visio", "debut": "15h00", "fin": "17h00"},
        {"date": "18/11/2025", "type": "E-learning", "debut": "10h00", "fin": "12h00"},
        {"date": "18/11/2025", "type": "Visio", "debut": "15h00", "fin": "17h00"}
    ],
    "date_emission": "10/11/2025",
    "lien_ressources": "https://drive.google.com/drive/folders/..."
}
```

---

## 🔧 Commandes

```bash
# Générer une feuille d'émargement
python3 scripts/generer_emargement.py "CLIENTS/NOM_CLIENT/data/formation.json"

# Générer les certificats (un par apprenant)
python3 scripts/generer_certificat.py "CLIENTS/NOM_CLIENT/data/formation.json"

# Générer les convocations (une par apprenant)
python3 scripts/generer_convocation.py "CLIENTS/NOM_CLIENT/data/formation.json"
```

---

## 📂 Organisation des Fichiers

```
INTELLIGENCE-ACADEMY/
├── scripts/
│   ├── generer_emargement.py
│   ├── generer_certificat.py
│   └── generer_convocation.py
│
├── templates/
│   ├── EMARGEMENT TEMPLATE.docx
│   ├── certificat_de_réalisation template.docx
│   └── convocation template.docx
│
├── CLIENTS/
│   ├── TABARY Julien/              # Dossier client (particulier)
│   │   ├── data/
│   │   │   └── formation_tabary.json   # JSON unifié
│   │   ├── Emargement_*.docx
│   │   ├── Certificat_*.docx
│   │   └── Convocation_*.docx
│   │
│   └── ENTREPRISE XYZ/             # Dossier client (entreprise)
│       ├── data/
│       │   └── formation_xyz.json
│       └── ...
│
└── INSTRUCTIONS.md
```

### Règles d'organisation :
- **Client particulier** → `CLIENTS/NOM Prénom/`
- **Client entreprise** → `CLIENTS/NOM_ENTREPRISE/`
- **Données** → Sous-dossier `data/` pour les JSON
- **Documents** → Générés à la racine du dossier client

---
---

# 📝 FEUILLES D'ÉMARGEMENT

## Format des Sessions

### Format 1 : Sessions Personnalisées
Pour formations avec créneaux variables (e-learning + visio, durées différentes par jour)

```json
"sessions": [
    {"date": "17/11/2025", "type": "E-learning", "debut": "10h00", "fin": "12h00"},
    {"date": "17/11/2025", "type": "Visio", "debut": "15h00", "fin": "17h00"}
]
```

**Particularités :**
- Les sessions du même jour sont regroupées sur une seule page
- Chaque session a son propre bloc signature (apprenant + formateur)
- Le type de session apparaît dans l'en-tête du créneau

### Format 2 : Horaires Fixes Matin/Après-midi
Pour formations classiques avec les mêmes horaires tous les jours

```json
"horaires": {
    "matin": {"debut": "9h30", "fin": "12h30"},
    "apres_midi": {"debut": "14h00", "fin": "17h30"}
}
```

**Particularités :**
- Une page par jour avec 2 créneaux (matin + après-midi)
- Horaires identiques pour tous les jours
- Jours ouvrés uniquement (lundi-vendredi)

---
---

# 📜 CERTIFICATS DE RÉALISATION

## Particularités

- **Un certificat par apprenant** : Le script génère autant de fichiers que d'apprenants
- **Date de signature** : Par défaut = date de fin de formation
- **Lieu de signature** : Par défaut = "Paris"
- **Email non requis** : Contrairement à l'émargement, l'email n'est pas affiché

---
---

# 📧 CONVOCATIONS

## Particularités

- **Une convocation par apprenant** : Le script génère autant de fichiers que d'apprenants
- **Date d'émission** : Par défaut = date du jour de génération
- **Tableau des sessions** : Généré automatiquement à partir du champ `sessions` (une ligne par demi-journée)
- **Lien ressources** : Optionnel - si absent, le paragraphe correspondant est supprimé

## Champs spécifiques

| Champ | Obligatoire | Défaut | Description |
|-------|-------------|--------|-------------|
| **duree_jours** | ✅ | - | Nombre de jours de formation |
| **date_emission** | ❌ | Aujourd'hui | Date affichée en haut du document |
| **lien_ressources** | ❌ | (supprimé) | URL vers les ressources stagiaires |

---
---

# ⚠️ Points d'Attention Généraux

1. **Vérifier les dates** : S'assurer que les jours correspondent (ex: "Lundi 17/11" doit vraiment être un lundi)
2. **Format des horaires** : Utiliser "9h30" ou "09h30", pas "9:30"
3. **Durée totale** : Calculer la somme de toutes les sessions
4. **Sessions annulées** : Ne pas les inclure dans le JSON
5. **Lieu** : 
   - Formations à distance → `"lieu": "Distanciel"`
   - Formations en présentiel → `"lieu": "Présentiel, [adresse complète]"`
6. **Templates requis** : Les fichiers template doivent être présents dans le dossier `templates/`

---

## 💬 Exemples de Conversation

### L'utilisateur donne des infos en vrac :
> "Formation IA pour Jean Dupont jean@mail.com du 10 au 12 décembre, 9h30-12h30 et 14h-17h30, présentiel à Paris, formateur Alexis Albouze, 21h au total sur 3 jours"

→ L'assistant structure les données et génère le JSON unifié.

### L'utilisateur demande plusieurs documents :
> "Génère l'émargement et la convocation pour Julien Tabary"

→ L'assistant utilise le même JSON et exécute les deux scripts.

### L'utilisateur veut ajouter un apprenant :
> "Ajoute Marie Martin marie@example.com à la formation de Julien"

→ L'assistant met à jour le JSON existant et régénère les documents si demandé.

