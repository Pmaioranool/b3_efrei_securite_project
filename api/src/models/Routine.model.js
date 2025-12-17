const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cronParser = require("cron-parser");

const RoutineSchema = new Schema(
  {
    userId: {
      type: Number,
      required: true,
    },

    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      required: true,
    },

    cron: {
      type: String,
      required: true,
      trim: true, // 🔥 essentiel
    },

    timezone: {
      type: String,
      default: "Europe/Paris",
    },
  },
  { timestamps: true }
);

const RoutineModel = mongoose.model("Routine", RoutineSchema);

class Routine {
  static async getAll() {
    return await RoutineModel.find().populate("workoutId").exec();
  }

  static async getById(id) {
    return await RoutineModel.findById(id).populate("workoutId").exec();
  }

  static async getByUserId(userId) {
    return await RoutineModel.find({ userId }).populate("workoutId").exec();
  }

  static async create({ userId, workoutId, cron, timezone = "Europe/Paris" }) {
    if (!userId || !workoutId || !cron) {
      throw new Error(
        "userId, workoutId, and cron are required to create a routine."
      );
    }
    const routine = new RoutineModel({ userId, workoutId, cron, timezone });
    await routine.save();
    return routine;
  }

  static async delete(id) {
    await RoutineModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  static async update(id, { workoutId, cron, timezone }) {
    const updateData = {};
    if (workoutId) updateData.workoutId = workoutId;
    if (cron) updateData.cron = cron;
    if (timezone) updateData.timezone = timezone;
    const routine = await RoutineModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return routine;
  }
}

module.exports = Routine;
