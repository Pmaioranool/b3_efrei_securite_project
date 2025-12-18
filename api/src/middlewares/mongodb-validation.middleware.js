const mongoose = require("mongoose");

/**
 * Middleware de validation ObjectId MongoDB
 * Valide que les paramètres ID sont des ObjectId valides
 * Prévient les NoSQL injection en rejetant les IDs invalides
 *
 * @param {string} paramName - Nom du paramètre à valider (ex: 'id', 'workoutId')
 * @returns {Function} Middleware Express
 *
 * @example
 * router.get('/:id', validateObjectId('id'), controller.getById);
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        error: "Validation échouée",
        message: `Paramètre '${paramName}' manquant`,
      });
    }

    // Vérifier que c'est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Validation échouée",
        message: `Le paramètre '${paramName}' doit être un ObjectId MongoDB valide`,
        details: `Reçu: "${id}"`,
      });
    }

    // Convertir en ObjectId
    req.params[paramName] = new mongoose.Types.ObjectId(id);
    next();
  };
};

/**
 * Middleware pour valider plusieurs paramètres ObjectId
 * @param {string[]} paramNames - Array de noms de paramètres à valider
 * @returns {Function} Middleware Express
 *
 * @example
 * router.put('/:routineId/workouts/:workoutId',
 *   validateMultipleObjectIds(['routineId', 'workoutId']),
 *   controller.update);
 */
const validateMultipleObjectIds = (paramNames = []) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];

      if (!id) {
        return res.status(400).json({
          error: "Validation échouée",
          message: `Paramètre '${paramName}' manquant`,
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Validation échouée",
          message: `Le paramètre '${paramName}' doit être un ObjectId MongoDB valide`,
          details: `Reçu: "${id}"`,
        });
      }

      req.params[paramName] = new mongoose.Types.ObjectId(id);
    }

    next();
  };
};

module.exports = {
  validateObjectId,
  validateMultipleObjectIds,
};
