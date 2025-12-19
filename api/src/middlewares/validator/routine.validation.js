const { body } = require("express-validator");
const { handleValidationErrors } = require("../validation.middleware");
const cronParser = require("cron-parser");
const mongoose = require("mongoose");
const { CronExpressionParser } = require("cron-parser");

exports.validateRoutineCreation = [
  body("workoutId")
    .notEmpty()
    .withMessage("workoutId est requis")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("workoutId doit être un ObjectId Mongo valide"),

  body("cron")
    .notEmpty()
    .withMessage("L'expression cron est requise")
    .isString()
    .withMessage("cron doit être une chaîne de caractères")
    .custom((value) => {
      try {
        CronExpressionParser.parse(value);
        return true;
      } catch (e) {
        console.error("CRON KO:", e.message);
      }
    }),
  body("timezone")
    .optional()
    .isString()
    .withMessage("timezone doit être une chaîne de caractères"),

  handleValidationErrors,
];
