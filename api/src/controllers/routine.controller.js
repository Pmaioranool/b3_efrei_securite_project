const Routine = require("../models/Routine.model");

exports.getRoutine = async (req, res, next) => {
  try {
    const routines = await Routine.getAll();
    return res.status(200).json(routines);
  } catch (e) {
    next(e);
  }
};

exports.getRoutineById = async (req, res, next) => {
  try {
    const routine = await Routine.getById(req.params.id);
    if (!routine) {
      return res.status(404).json({ error: "Routine non trouvée" });
    }
    return res.status(200).json(routine);
  } catch (e) {
    next(e);
  }
};

exports.getRoutinesByCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const routines = await Routine.getByUserId(userId);
    return res.status(200).json(routines);
  } catch (e) {
    next(e);
  }
};

exports.getRoutinesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const routines = await Routine.getByUserId(userId);
    return res.status(200).json(routines);
  } catch (e) {
    next(e);
  }
};

exports.createRoutine = async (req, res, next) => {
  try {
    const { workoutId, cron, timezone, intervalWeeks, activeWeeks } = req.body;
    // Use userId from authenticated token, not from body
    const userId = req.user.userId;
    const newRoutine = await Routine.create({
      userId,
      workoutId,
      cron,
      timezone,
      intervalWeeks,
      activeWeeks
    });
    return res.status(201).json(newRoutine);
  } catch (e) {
    next(e);
  }
};

exports.updateRoutine = async (req, res, next) => {
  try {
    const { userId, workoutId, cron, timezone, intervalWeeks, activeWeeks, startDate } = req.body;
    const routineId = req.params.id;
    const authenticatedUserId = req.user?.userId;
    const userRole = req.user?.role;

    // Check ownership
    const existingRoutine = await Routine.getById(routineId);
    if (!existingRoutine) {
      return res.status(404).json({ error: "Routine non trouvée" });
    }

    if (userRole !== "ADMIN" && String(existingRoutine.userId?._id || existingRoutine.userId) !== String(authenticatedUserId)) {
      return res.status(403).json({ error: "Vous ne pouvez modifier que vos propres routines." });
    }

    const updatedRoutine = await Routine.update(routineId, {
      userId,
      workoutId,
      cron,
      timezone,
      intervalWeeks,
      activeWeeks,
      startDate
    });
    return res.status(200).json(updatedRoutine);
  } catch (e) {
    next(e);
  }
};

exports.deleteRoutine = async (req, res, next) => {
  try {
    const routineId = req.params.id;
    const authenticatedUserId = req.user?.userId;
    const userRole = req.user?.role;

    // Check ownership
    const existingRoutine = await Routine.getById(routineId);
    if (!existingRoutine) {
      return res.status(404).json({ error: "Routine non trouvée" });
    }

    if (userRole !== "ADMIN" && String(existingRoutine.userId?._id || existingRoutine.userId) !== String(authenticatedUserId)) {
      return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres routines." });
    }

    await Routine.delete(routineId);
    return res.status(200).json({ message: "Routine deleted successfully" });
  } catch (e) {
    next(e);
  }
};
