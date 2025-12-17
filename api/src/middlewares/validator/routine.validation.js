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
    const parse =
      typeof cronParser === "function"
        ? cronParser
        : cronParser.parseExpression;
    parse(cron, {
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
      const { body, param } = require("express-validator");
      const { handleValidationErrors } = require("../validation.middleware");
      const cronParser = require("cron-parser");

      // Helper pour valider l'expression CRON en supportant les différentes signatures de cron-parser
      const validateCron = (cron, tz) => {
        const parse = typeof cronParser === "function" ? cronParser : cronParser.parseExpression;
        parse(cron, tz ? { tz } : undefined);
      };

      exports.validateRoutineCreation = [
        body("userId")
          .exists().withMessage("Le champ 'userId' est requis")
          .bail()
          .isInt({ min: 1 }).withMessage("Le champ 'userId' doit être un nombre entier"),
        body("workoutId")
          .exists().withMessage("Le champ 'workoutId' est requis")
          .bail()
          .isMongoId().withMessage("Le champ 'workoutId' doit être un ObjectId MongoDB valide"),
        body("cron")
          .exists().withMessage("Le champ 'cron' est requis")
          .bail()
          .custom((value, { req }) => {
            try {
              validateCron(value, req.body.timezone || "Europe/Paris");
              return true;
            } catch (e) {
              throw new Error(`Expression CRON invalide: ${e.message}`);
            }
          }),
        body("timezone")
          .optional()
          .custom((value) => {
            const zones = Intl.supportedValuesOf("timeZone");
            if (!zones.includes(value)) {
              throw new Error("Timezone invalide");
            }
            return true;
          }),
        handleValidationErrors,
      ];

      exports.validateRoutineUpdate = [
        param("id").isMongoId().withMessage("id doit être un ObjectId MongoDB valide"),
        body().custom((value, { req }) => {
          if (!req.body.workoutId && !req.body.cron && !req.body.timezone) {
            throw new Error("Au moins un champ doit être fourni (workoutId, cron, ou timezone)");
          }
          return true;
        }),
        body("workoutId")
          .optional()
          .isMongoId()
          .withMessage("Le champ 'workoutId' doit être un ObjectId MongoDB valide"),
        body("cron")
          .optional()
          .custom((value, { req }) => {
            try {
              validateCron(value, req.body.timezone || "Europe/Paris");
              return true;
            } catch (e) {
              throw new Error(`Expression CRON invalide: ${e.message}`);
            }
          }),
        body("timezone")
          .optional()
          .custom((value) => {
            const zones = Intl.supportedValuesOf("timeZone");
            if (!zones.includes(value)) {
              throw new Error("Timezone invalide");
            }
            return true;
          }),
        handleValidationErrors,
      ];

      exports.validateRoutineId = [
        param("id").isMongoId().withMessage("id doit être un ObjectId MongoDB valide"),
        handleValidationErrors,
      ];

      exports.cronExamples = {
        "Tous les jours à 8h": "0 8 * * *",
        "Lun/Mer/Ven à 7h30": "30 7 * * 1,3,5",
        "Toutes les 2 heures": "0 */2 * * *",
        "Tous les dimanches à 12h": "0 12 * * 0",
        "Premier jour du mois à 9h": "0 9 1 * *",
        "Du lundi au vendredi à 18h": "0 18 * * 1-5",
      };
