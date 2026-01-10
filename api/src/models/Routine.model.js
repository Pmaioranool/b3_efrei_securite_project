const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cronParser = require("cron-parser");

const RoutineSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

    activeWeeks: {
      type: [Number], // Semaines actives dans le cycle (ex: [1, 3] pour actif semaines 1 et 3 sur 4)
      default: [1],
      validate: { // Ensure values are between 1 and intervalWeeks
        validator: function (v) {
          // Cannot validate against intervalWeeks here easily without access to 'this' context fully loaded, usually done in pre-save or controller
          return Array.isArray(v) && v.every(val => val > 0);
        },
        message: "Active weeks must be positive integers."
      }
    },
    // Date de début du cycle (pour calculer le modulo correctement)
    startDate: { type: Date, default: Date.now },

    intervalWeeks: {
      type: Number,
      default: 1, // 1 = chaque semaine, 2 = une semaine sur 2, etc.
      min: 1
    }
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

  static async create({ userId, workoutId, cron, timezone, intervalWeeks, activeWeeks, startDate }) {
    if (!userId || !workoutId || !cron) {
      throw new Error("Missing required fields.");
    }

    // Default startDate to now if not provided
    const start = startDate ? new Date(startDate) : new Date();

    const routine = new RoutineModel({
      userId,
      workoutId,
      cron,
      timezone: timezone || "UTC",
      intervalWeeks: intervalWeeks || 1,
      activeWeeks: activeWeeks || [1],
      startDate: start
    });

    return await routine.save();
  }

  static async delete(id) {
    await RoutineModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  static async update(id, { workoutId, cron, timezone, intervalWeeks, activeWeeks, startDate }) {
    const updateData = {};
    if (workoutId) updateData.workoutId = workoutId;
    if (cron) updateData.cron = cron;
    if (timezone) updateData.timezone = timezone;
    if (intervalWeeks) updateData.intervalWeeks = intervalWeeks;
    if (activeWeeks) updateData.activeWeeks = activeWeeks;
    if (startDate) updateData.startDate = startDate;
    const routine = await RoutineModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return routine;
  }
}

module.exports = Routine;
