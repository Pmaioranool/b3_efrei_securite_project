const cronParser = require("cron-parser");

/**
 * Middleware de validation pour les routines
 */

/**
 * Valide les données pour la création d'une routine
 */
exports.validateRoutineCreation = (req, res, next) => {
  const { userId, workoutId, cron, timezone } = req.body;

  // Vérifier les champs requis
  if (!userId) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'userId' est requis",
    });
  }

  if (!workoutId) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'workoutId' est requis",
    });
  }

  if (!cron) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'cron' est requis",
    });
  }

  // Valider que userId est un nombre
  if (!Number.isInteger(Number(userId))) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'userId' doit être un nombre entier",
    });
  }

  // Valider que workoutId est une chaîne non vide
  if (typeof workoutId !== "string" || workoutId.trim() === "") {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'workoutId' doit être une chaîne non vide",
    });
  }

  // Valider l'expression CRON
  try {
    cronParser.parseExpression(cron, {
      tz: timezone || "Europe/Paris",
    });
  } catch (error) {
    return res.status(400).json({
      error: "Expression CRON invalide",
      message: `L'expression CRON '${cron}' n'est pas valide: ${error.message}`,
      help: "Format CRON: 'minute heure jour mois jour-semaine' (ex: '0 8 * * 1,3,5' pour lun/mer/ven à 8h)",
    });
  }

  // Valider la timezone si fournie
  if (timezone) {
    const validTimezones = Intl.supportedValuesOf("timeZone");
    if (!validTimezones.includes(timezone)) {
      return res.status(400).json({
        error: "Timezone invalide",
        message: `La timezone '${timezone}' n'est pas valide`,
        examples: [
          "Europe/Paris",
          "America/New_York",
          "Asia/Tokyo",
          "Australia/Sydney",
        ],
      });
    }
  }

  next();
};

/**
 * Valide les données pour la mise à jour d'une routine
 */
exports.validateRoutineUpdate = (req, res, next) => {
  const { workoutId, cron, timezone } = req.body;

  // Au moins un champ doit être fourni pour la mise à jour
  if (!workoutId && !cron && !timezone) {
    return res.status(400).json({
      error: "Validation échouée",
      message:
        "Au moins un champ doit être fourni (workoutId, cron, ou timezone)",
    });
  }

  // Valider workoutId si fourni
  if (workoutId && (typeof workoutId !== "string" || workoutId.trim() === "")) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "Le champ 'workoutId' doit être une chaîne non vide",
    });
  }

  // Valider l'expression CRON si fournie
  if (cron) {
    try {
      cronParser.parseExpression(cron, {
        tz: timezone || "Europe/Paris",
      });
    } catch (error) {
      return res.status(400).json({
        error: "Expression CRON invalide",
        message: `L'expression CRON '${cron}' n'est pas valide: ${error.message}`,
        help: "Format CRON: 'minute heure jour mois jour-semaine' (ex: '0 8 * * 1,3,5')",
      });
    }
  }

  // Valider la timezone si fournie
  if (timezone) {
    const validTimezones = Intl.supportedValuesOf("timeZone");
    if (!validTimezones.includes(timezone)) {
      return res.status(400).json({
        error: "Timezone invalide",
        message: `La timezone '${timezone}' n'est pas valide`,
        examples: [
          "Europe/Paris",
          "America/New_York",
          "Asia/Tokyo",
          "Australia/Sydney",
        ],
      });
    }
  }

  next();
};

/**
 * Valide l'ID MongoDB dans les paramètres
 */
exports.validateRoutineId = (req, res, next) => {
  const { id } = req.params;

  // Vérifier que l'ID est fourni
  if (!id) {
    return res.status(400).json({
      error: "Validation échouée",
      message: "L'ID de la routine est requis",
    });
  }

  // Vérifier le format de l'ObjectId MongoDB (24 caractères hexadécimaux)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({
      error: "Format d'ID invalide",
      message: `L'ID '${id}' n'est pas un ObjectId MongoDB valide`,
      help: "L'ID doit être une chaîne de 24 caractères hexadécimaux",
    });
  }

  next();
};

/**
 * Exemples d'expressions CRON valides
 */
exports.cronExamples = {
  "Tous les jours à 8h": "0 8 * * *",
  "Lun/Mer/Ven à 7h30": "30 7 * * 1,3,5",
  "Toutes les 2 heures": "0 */2 * * *",
  "Tous les dimanches à 12h": "0 12 * * 0",
  "Premier jour du mois à 9h": "0 9 1 * *",
  "Du lundi au vendredi à 18h": "0 18 * * 1-5",
};
