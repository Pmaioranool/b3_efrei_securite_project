const User = require("../models/User.model");

exports.getUser = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pagesize = parseInt(req.query.pagesize) || 10;
  try {
    const users = await User.getAll(page, pagesize);
    return res.status(200).json(users);
  } catch (e) {
    next(e);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.getById(req.params.id);
    return res.status(200).json(user);
  } catch (e) {
    next(e);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { pseudonym, email, birthdate } = req.body;
    const updatedUser = await User.update(req.params.id, {
      pseudonym,
      email,
      birthdate,
    });
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.updateUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const updatedUser = await User.updatePassword(req.params.id, password);
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.updateUserLastLogin = async (req, res, next) => {
  try {
    const { last_login } = req.body;
    const updatedUser = await User.updateLastLogin(req.params.id, last_login);
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.incrementUserWorkoutsCompleted = async (req, res, next) => {
  try {
    const { workoutId } = req.body;
    const updatedUser = await User.incrementWorkoutsCompleted(
      req.params.id,
      workoutId
    );
    return res.status(200).json(updatedUser);
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.delete(req.params.id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    next(e);
  }
};
