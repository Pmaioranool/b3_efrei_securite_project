const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema(
  {
    Title: { type: String, required: true },
    Desc: { type: String, default: "" },
    Type: { type: String, required: true },
    BodyPart: { type: String, required: true },
    Equipment: { type: String, required: true },
    Level: { type: String, required: true },
    Rating: { type: Number, default: 0 },
    RatingDesc: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const ExerciseModel = mongoose.model("Exercise", ExerciseSchema);

class Exercise {
  static async getAll({
    title,
    BodyPart,
    Equipment,
    limit,
    skip,
    all = false,
  } = {}) {
    const filters = {};
    if (title) filters.Title = new RegExp(title, "i");
    if (BodyPart) filters.BodyPart = BodyPart;
    if (Equipment) filters.Equipment = Equipment;

    let query = ExerciseModel.find(filters);

    if (skip !== undefined) {
      query = query.skip(parseInt(skip || 0, 10));
    }
    if (!all) {
      query = query.limit(parseInt(limit || 10, 10));
    }

    return await query.exec();
  }

  static async getById(id) {
    return await ExerciseModel.findById(id).exec();
  }

  static async create({
    Title,
    Desc = "",
    Type,
    BodyPart,
    Equipment,
    Level,
    Rating = 0,
    RatingDesc = "",
  }) {
    if (!Title || !Type || !BodyPart || !Equipment || !Level) {
      throw new Error(
        "Title, type, bodypart, equipment, level are required to create an exercise."
      );
    }

    const exercise = new ExerciseModel({
      Title,
      Desc,
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating,
      RatingDesc,
    });

    return await exercise.save();
  }

  static async update(
    id,
    {
      Title,
      Desc = "",
      Type,
      BodyPart,
      Equipment,
      Level,
      Rating = 0,
      RatingDesc = "",
    }
  ) {
    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      throw new Error("Exercise not found.");
    }

    if (Title !== undefined) exercise.Title = Title;
    if (Desc !== undefined) exercise.Desc = Desc;
    if (Type !== undefined) exercise.Type = Type;
    if (BodyPart !== undefined) exercise.BodyPart = BodyPart;
    if (Equipment !== undefined) exercise.Equipment = Equipment;
    if (Level !== undefined) exercise.Level = Level;
    if (Rating !== undefined) exercise.Rating = Rating;
    if (RatingDesc !== undefined) exercise.RatingDesc = RatingDesc;

    return await exercise.save();
  }

  static async delete(id) {
    const exercise = await ExerciseModel.findByIdAndDelete(id);
    if (!exercise) {
      throw new Error("Exercise not found.");
    }
    return exercise;
  }
}

module.exports = Exercise;
