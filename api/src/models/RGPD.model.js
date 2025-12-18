const { pool } = require("../config/db.postgres");
const Workout = require("./Workout.model");
const Routine = require("./Routine.model");

/**
 * Modèle RGPD : Gestion des demandes de droits RGPD
 * - Droit d'accès (export de toutes les données)
 * - Droit à l'oubli (suppression complète)
 * - Portabilité des données (export JSON)
 */
class RGPD {
  /**
   * Récupère toutes les données personnelles d'un utilisateur
   * Article 15 RGPD : Droit d'accès
   */
  static async getUserData(userId) {
    // Données utilisateur PostgreSQL
    const userResult = await pool.query(
      "SELECT id, pseudonym, email, role, last_login, created_at, updated_at FROM users WHERE id = $1",
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error("Utilisateur non trouvé");
    }

    const user = userResult.rows[0];

    // Données workouts MongoDB (si applicable)
    const workouts = await Workout.getByUserId(userId);

    // Données routines MongoDB (si applicable)
    const routines = await Routine.getByUserId(userId);

    return {
      user,
      workouts,
      routines,
      exportedAt: new Date().toISOString(),
      dataRetentionPolicy:
        "Les données sont conservées tant que le compte est actif",
    };
  }

  /**
   * Exporte les données au format JSON (portabilité)
   * Article 20 RGPD : Droit à la portabilité
   */
  static async exportUserData(userId) {
    const data = await this.getUserData(userId);
    return {
      format: "JSON",
      version: "1.0",
      exportDate: new Date().toISOString(),
      data,
    };
  }

  /**
   * Supprime définitivement toutes les données d'un utilisateur
   * Article 17 RGPD : Droit à l'oubli
   */
  static async deleteUserData(userId) {
    // 1. Supprimer les routines MongoDB
    try {
      const routines = await Routine.getByUserId(userId);
      for (const routine of routines) {
        await Routine.delete(routine._id.toString());
      }
    } catch (error) {
      console.warn("Erreur suppression routines:", error.message);
    }

    // 2. Supprimer les workouts MongoDB
    try {
      const workouts = await Workout.getByUserId(userId);
      for (const workout of workouts) {
        await Workout.delete(workout._id.toString());
      }
    } catch (error) {
      console.warn("Erreur suppression workouts:", error.message);
    }

    // 3. Supprimer l'utilisateur PostgreSQL (cascade supprime les dépendances)
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    return {
      deleted: true,
      userId,
      deletedAt: new Date().toISOString(),
      message: "Toutes vos données ont été supprimées définitivement",
    };
  }

  /**
   * Anonymise les données d'un utilisateur (alternative à la suppression)
   */
  static async anonymizeUserData(userId) {
    const anonymousEmail = `anonymous_${userId}@deleted.local`;
    const anonymousPseudo = `User${userId}_deleted`;

    await pool.query(
      "UPDATE users SET pseudonym = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [anonymousPseudo, anonymousEmail, userId]
    );

    return {
      anonymized: true,
      userId,
      anonymizedAt: new Date().toISOString(),
    };
  }
}

module.exports = RGPD;
