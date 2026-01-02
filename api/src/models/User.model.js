const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const JWTService = require("../utils/jwt");

const UserSchema = new Schema(
  {
    pseudonym: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "USER" },
    last_login: { type: Date },
    password_updated_at: { type: Date, default: Date.now },
    refresh_token_version: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

const UserModel = mongoose.model("User", UserSchema);

class User {
  static async getAll(page = 1, pagesize = 10) {
    const skip = (page - 1) * pagesize;
    const users = await UserModel.find()
      .select("-password") // Exclude password
      .skip(skip)
      .limit(pagesize)
      .exec();
    return users;
  }

  static async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await UserModel.findById(id).select("-password").exec();
  }

  // Pour l'auth, on a souvent besoin du password
  static async getByEmail(email) {
    return await UserModel.findOne({ email }).exec();
  }

  static async getByPseudonym(pseudonym) {
    return await UserModel.findOne({ pseudonym }).exec();
  }

  // Auth specific: needs secret fields
  static async getAuthState(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await UserModel.findById(id).exec();
  }

  static async create({ pseudonym, email, password, role = "USER" }) {
    const hashedPassword = await JWTService.hashPassword(password);
    const user = new UserModel({
      pseudonym,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();
    return user;
  }

  static async update(id, { pseudonym, email }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updateData = { updated_at: new Date() };
    if (pseudonym) updateData.pseudonym = pseudonym;
    if (email) updateData.email = email;

    const user = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");
    return user;
  }

  static async updatePassword(id, password) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const hashedPassword = await JWTService.hashPassword(password);

    const user = await UserModel.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        password_updated_at: new Date(),
        updated_at: new Date(),
        $inc: { refresh_token_version: 1 },
      },
      { new: true }
    );
    return user;
  }

  static async updateLastLogin(id, lastLogin) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await UserModel.findByIdAndUpdate(
      id,
      { last_login: lastLogin },
      { new: true }
    ).select("-password");
    return user;
  }

  static async bumpRefreshTokenVersion(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await UserModel.findByIdAndUpdate(
      id,
      {
        $inc: { refresh_token_version: 1 },
        updated_at: new Date(),
      },
      { new: true }
    );
    return user;
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { deleted: false };
    await UserModel.findByIdAndDelete(id);
    return { deleted: true };
  }
}

module.exports = User;
