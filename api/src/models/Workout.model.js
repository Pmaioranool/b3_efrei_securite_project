const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkoutSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: Number },
    // Template : permet de partager le workout entre utilisateurs sans données personnelles (charge, durée)
    template: { type: Boolean, default: false },
    exercises: [
      {
        exercise: {
          type: Schema.Types.ObjectId,
          ref: "Exercise",
          required: true,
        },
        // Sets obligatoires : au moins 1 set requis
        // - rest : temps de repos en secondes
        // - rep : nombre de répétitions (OPTIONNEL, pour exercices à répétitions)
        // - weight : charge en kg (OPTIONNEL, pour suivi personnel)
        // - duration : durée en secondes (OPTIONNEL, pour exercices chronométrés)
        sets: {
          type: [
            {
              rest: { type: Number, default: 60, required: true }, // rest time in seconds
              rep: { type: Number, required: true, min: 1 },
              weight: { type: Number, min: 0 }, // Optionnel : charge en kg
              duration: { type: Number, min: 0 }, // Optionnel : durée en secondes
            },
          ],
          required: true,
          validate: {
            validator: function (sets) {
              return sets && sets.length > 0;
            },
            message: "Au moins un set est requis pour chaque exercice",
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const WorkoutModel = mongoose.model("Workout", WorkoutSchema);

class Workout {
  static async getAll() {
    return await WorkoutModel.find().populate("exercises.exercise").exec();
  }

  // Récupère uniquement les templates publics partageables
  static async getTemplates() {
    return await WorkoutModel.find({ template: true })
      .populate("exercises.exercise")
      .exec();
  }

  static async getByUserId(userId) {
    return await WorkoutModel.find({ userId })
      .populate("exercises.exercise")
      .exec();
  }

  static async getById(id) {
    return await WorkoutModel.findById(id)
      .populate("exercises.exercise")
      .exec();
  }

  static async create({ name, userId, template = false, exercises = [] }) {
    if (!name) {
      throw new Error("Name is required to create a workout.");
    }

    if (exercises && !Array.isArray(exercises)) {
      throw new Error("Exercises must be an array.");
    }

    for (const ex of exercises) {
      if (!ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
        throw new Error(`Chaque exercice doit avoir au moins un set.`);
      }
      for (const set of ex.sets) {
        if (!set.rep || set.rep < 1) {
          throw new Error("Chaque set doit avoir au moins 1 répétition.");
        }
        // Validation des champs optionnels
        if (set.weight !== undefined && set.weight < 0) {
          throw new Error("Le poids (weight) doit être >= 0.");
        }
        if (set.duration !== undefined && set.duration < 0) {
          throw new Error("La durée (duration) doit être >= 0.");
        }
      }
    }

    const workout = new WorkoutModel({
      name,
      userId,
      template,
      exercises,
    });

    return await workout.save();
  }

  static async update(id, { name, userId, template, exercises }) {
    const workout = await WorkoutModel.findById(id);
    if (!workout) {
      throw new Error("Workout not found.");
    }

    if (name !== undefined) workout.name = name;
    if (userId !== undefined) workout.userId = userId;
    if (template !== undefined) workout.template = template;

    if (exercises !== undefined) {
      if (!Array.isArray(exercises)) {
        throw new Error("Exercises must be an array.");
      }
      for (const ex of exercises) {
        if (!ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
          throw new Error(`Chaque exercice doit avoir au moins un set.`);
        }
        for (const set of ex.sets) {
          if (!set.rep || set.rep < 1) {
            throw new Error("Chaque set doit avoir au moins 1 répétition.");
          }
          // Validation des champs optionnels
          if (set.weight !== undefined && set.weight < 0) {
            throw new Error("Le poids (weight) doit être >= 0.");
          }
          if (set.duration !== undefined && set.duration < 0) {
            throw new Error("La durée (duration) doit être >= 0.");
          }
        }
      }
      workout.exercises = exercises;
    }

    return await workout.save();
  }

  static async delete(id) {
    const workout = await WorkoutModel.findByIdAndDelete(id);
    if (!workout) {
      throw new Error("Workout not found.");
    }
    return workout;
  }

  // Clone un template pour créer un workout personnel depuis un template
  static async cloneTemplate(templateId, userId, customName = null) {
    const template = await WorkoutModel.findById(templateId);
    if (!template) {
      throw new Error("Template not found.");
    }
    if (!template.template) {
      throw new Error("Ce workout n'est pas un template.");
    }

    const clonedWorkout = new WorkoutModel({
      name: customName || `${template.name} (copie)`,
      userId,
      template: false, // Le clone n'est pas un template
      exercises: template.exercises, // Reprend la structure des exercices et sets
    });

    return await clonedWorkout.save();
  }
}

module.exports = Workout;
