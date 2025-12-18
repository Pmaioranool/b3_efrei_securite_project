const RGPD = require("../models/RGPD.model");

/**
 * Contrôleur RGPD : Gestion des demandes de droits RGPD
 */
class RGPDController {
  /**
   * GET /api/rgpd/my-data
   * Récupère toutes les données personnelles de l'utilisateur connecté
   * Article 15 RGPD : Droit d'accès
   */
  async getMyData(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = await RGPD.getUserData(userId);

      res.json({
        message: "Vos données personnelles",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rgpd/export
   * Exporte les données au format JSON (portabilité)
   * Article 20 RGPD : Droit à la portabilité
   */
  async exportMyData(req, res, next) {
    try {
      const userId = req.user.userId;
      const exportData = await RGPD.exportUserData(userId);

      // Définir le nom du fichier avec timestamp
      const filename = `data_export_${userId}_${Date.now()}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/rgpd/delete-account
   * Supprime définitivement toutes les données de l'utilisateur
   * Article 17 RGPD : Droit à l'oubli
   */
  async deleteMyAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { confirmation } = req.body;

      // Validation : l'utilisateur doit confirmer explicitement
      if (confirmation !== "DELETE_MY_ACCOUNT") {
        return res.status(400).json({
          error: "Confirmation requise",
          message:
            'Vous devez envoyer { "confirmation": "DELETE_MY_ACCOUNT" } pour confirmer la suppression définitive',
        });
      }

      const result = await RGPD.deleteUserData(userId);

      res.json({
        message:
          "Votre compte et toutes vos données ont été supprimés définitivement",
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rgpd/anonymize
   * Anonymise les données de l'utilisateur (alternative à la suppression)
   */
  async anonymizeMyAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await RGPD.anonymizeUserData(userId);

      res.json({
        message: "Votre compte a été anonymisé",
        result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RGPDController();
