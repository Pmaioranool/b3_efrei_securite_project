const Workout = require("../models/Workout.model");

// Validation légère en entrée pour renvoyer des 400 explicites
function validateExercisesPayload(exercises) {
  if (!Array.isArray(exercises)) {
    throw new Error("Exercises must be an array.");
  }
  exercises.forEach((ex, idx) => {
    if (!ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
      throw new Error(`L'exercice ${idx + 1} doit avoir au moins un set.`);
    }
    ex.sets.forEach((set, setIdx) => {
      if (!set.rep || set.rep < 1) {
        throw new Error(
          `Exercice ${idx + 1}, set ${setIdx + 1}: rep doit être >= 1.`
        );
      }
      if (set.weight !== undefined && set.weight < 0) {
        throw new Error(
          `Exercice ${idx + 1}, set ${setIdx + 1}: weight doit être >= 0.`
        );
      }
      if (set.duration !== undefined && set.duration < 0) {
        throw new Error(
          `Exercice ${idx + 1}, set ${setIdx + 1}: duration doit être >= 0.`
        );
      }
    });
  });
}

exports.getWorkout = async (req, res, next) => {
  try {
    const workouts = await Workout.getAll();
    return res.status(200).json(workouts);
  } catch (e) {
    next(e);
  }
};

exports.getWorkoutById = async (req, res, next) => {
  try {
    const workout = await Workout.getById(req.params.id);
    return res.status(200).json(workout);
  } catch (e) {
    next(e);
  }
};

exports.createWorkout = async (req, res, next) => {
  try {
    const { name, userId, template, exercises } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom du workout est requis" });
    }
    if (template !== true && !userId) {
      return res
        .status(400)
        .json({ error: "userId est requis pour un workout personnel" });
    }
    if (template === true && userId) {
      return res
        .status(400)
        .json({ error: "Un template ne doit pas contenir de userId" });
    }
    if (exercises !== undefined) {
      validateExercisesPayload(exercises);
    }

    const newWorkout = await Workout.create({
      name,
      userId,
      template,
      exercises,
    });
    return res.status(201).json(newWorkout);
  } catch (e) {
    // Les erreurs de validation sont renvoyées en 400
    return res.status(400).json({ error: e.message });
  }
};

exports.updateWorkout = async (req, res, next) => {
  try {
    const { name, userId, template, exercises } = req.body;

    if (exercises !== undefined) {
      validateExercisesPayload(exercises);
    }

    const updatedWorkout = await Workout.update(req.params.id, {
      name,
      userId,
      template,
      exercises,
    });
    return res.status(200).json(updatedWorkout);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

exports.deleteWorkout = async (req, res, next) => {
  try {
    await Workout.delete(req.params.id);
    return res.status(200).json({ message: "Workout deleted successfully" });
  } catch (e) {
    next(e);
  }
};

// Récupère tous les templates publics partageables
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await Workout.getTemplates();
    return res.status(200).json(templates);
  } catch (e) {
    next(e);
  }
};

// Clone un template pour créer son propre workout
exports.cloneTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { userId, customName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId est requis" });
    }

    const clonedWorkout = await Workout.cloneTemplate(
      templateId,
      userId,
      customName
    );
    return res.status(201).json(clonedWorkout);
  } catch (e) {
    next(e);
  }
};

exports.getWorkoutsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const workouts = await Workout.getByUserId(userId);
    return res.status(200).json(workouts);
  } catch (e) {
    next(e);
  }
};
