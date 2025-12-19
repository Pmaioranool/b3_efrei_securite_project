import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI; // adapte si ton projet utilise un autre nom

  if (!uri) {
    console.warn("Mongo non configuré (MONGO_URI manquant) → on démarre sans Mongo.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Mongo connecté");
  } catch (err) {
    console.warn("Mongo indisponible → on démarre sans Mongo.");
  }
}
