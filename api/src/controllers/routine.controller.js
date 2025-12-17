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
    return res.status(200).json(routine);
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
    const { userId, workoutId, cron, timezone } = req.body;
    const newRoutine = await Routine.create({
      userId,
      workoutId,
      cron,
      timezone,
    });
    return res.status(201).json(newRoutine);
  } catch (e) {
    next(e);
  }
};

exports.updateRoutine = async (req, res, next) => {
  try {
    const { userId, workoutId, cron, timezone } = req.body;
    const updatedRoutine = await Routine.update(req.params.id, {
      userId,
      workoutId,
      cron,
      timezone,
    });
    return res.status(200).json(updatedRoutine);
  } catch (e) {
    next(e);
  }
};

exports.deleteRoutine = async (req, res, next) => {
  try {
    await Routine.delete(req.params.id);
    return res.status(200).json({ message: "Routine deleted successfully" });
  } catch (e) {
    next(e);
  }
};
