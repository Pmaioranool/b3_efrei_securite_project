#!/bin/bash

# Attendre que MongoDB soit complètement prêt
echo "Attente du démarrage de MongoDB..."
for i in {1..30}; do
  if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "MongoDB est prêt!"
    break
  fi
  echo "Tentative $i/30..."
  sleep 2
done

# Vérifier que le fichier CSV existe
if [ ! -f /megaGymDataset.csv ]; then
  echo "❌ Erreur: Le fichier /megaGymDataset.csv n'existe pas"
  exit 1
fi

echo "✅ Fichier CSV trouvé. Import en cours..."

# Importer le CSV dans la collection 'exercises'
mongoimport --db gymfit \
  --collection exercises \
  --type csv \
  --headerline \
  --file /megaGymDataset.csv 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Import du CSV réussi!"
  # Afficher le nombre de documents importés
  mongosh gymfit --eval "db.exercises.countDocuments()" 
else
  echo "❌ Erreur lors de l'import du CSV"
fi
