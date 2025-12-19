const Exercise = require("../models/Exercise.model");

exports.getExercise = async (req, res, next) => {
  try {
    const { title, BodyPart, Equipment, limit, skip, all } = req.query;

    const exercises = await Exercise.getAll({
      title,
      BodyPart,
      Equipment,
      limit,
      skip,
      all,
    });
    console.log(exercises);
    return res.status(200).json(exercises);
  } catch (e) {
    next(e);
  }
};

exports.getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.getById(req.params.id);
    return res.status(200).json(exercise);
  } catch (e) {
    next(e);
  }
};

exports.createExercise = async (req, res, next) => {
  try {
    const {
      Title,
      Desc = "",
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating = 0,
      RatingDesc = "",
    } = req.body;
    const newExercise = await Exercise.create({
      Title,
      Desc,
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating,
      RatingDesc,
    });
    return res.status(201).json(newExercise);
  } catch (e) {
    next(e);
  }
};

exports.updateExercise = async (req, res, next) => {
  try {
    const {
      Title,
      Desc = "",
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating = 0,
      RatingDesc = "",
    } = req.body;
    const updatedExercise = await Exercise.update(req.params.id, {
      Title,
      Desc,
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating,
      RatingDesc,
    });
    return res.status(200).json(updatedExercise);
  } catch (e) {
    next(e);
  }
};

exports.deleteExercise = async (req, res, next) => {
  try {
    await Exercise.delete(req.params.id);
    return res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (e) {
    next(e);
  }
};
