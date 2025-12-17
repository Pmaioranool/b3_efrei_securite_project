const User = require("../../src/models/User.model");
const UserController = require("../../src/controllers/User.controller");

jest.mock("../../src/models/User.model");

describe("User Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();

    // S'assurer que toutes les méthodes utilisées sont des mocks
    User.getAll = jest.fn();
    User.getById = jest.fn();
    User.update = jest.fn();
    User.updatePassword = jest.fn();
    User.updateLastLogin = jest.fn();
    User.incrementWorkoutsCompleted = jest.fn();
    User.delete = jest.fn();
  });

  describe("getUser", () => {
    it("should return all users", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          workouts_completed: 5,
          last_login: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          workouts_completed: 3,
          last_login: "2023-01-02T00:00:00.000Z",
        },
      ];
      User.getAll.mockResolvedValue(mockUsers);

      await UserController.getUser(req, res, next);

      expect(User.getAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);

      const returned = res.json.mock.calls[0][0];
      expect(returned).toHaveLength(2);
      expect(returned[0].name).toBe("John Doe");
      expect(returned[1].email).toBe("jane@example.com");
    });

    it("should call next on error", async () => {
      const err = new Error("DB fail");
      User.getAll.mockRejectedValue(err);

      await UserController.getUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getUserById", () => {
    it("should return a user by id", async () => {
      const mockUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        workouts_completed: 5,
        last_login: "2023-01-01T00:00:00.000Z",
      };
      req.params.id = "1";
      User.getById.mockResolvedValue(mockUser);

      await UserController.getUserById(req, res, next);

      expect(User.getById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);

      const returned = res.json.mock.calls[0][0];
      expect(returned.name).toBe("John Doe");
      expect(returned.email).toBe("john@example.com");
    });

    it("should call next on error", async () => {
      const err = new Error("User not found");
      req.params.id = "bad";
      User.getById.mockRejectedValue(err);

      await UserController.getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("updateUser", () => {
    it("should update a user and return it", async () => {
      const updatedUser = {
        id: "1",
        name: "John Updated",
        email: "john.updated@example.com",
        workouts_completed: 5,
        last_login: "2023-01-01T00:00:00.000Z",
      };
      req.params.id = "1";
      req.body = {
        name: "John Updated",
        email: "john.updated@example.com",
        password: "newpassword123",
      };
      User.update.mockResolvedValue(updatedUser);

      await UserController.updateUser(req, res, next);

      expect(User.update).toHaveBeenCalledWith("1", {
        name: "John Updated",
        email: "john.updated@example.com",
        password: "newpassword123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedUser);

      const returned = res.json.mock.calls[0][0];
      expect(returned.name).toBe("John Updated");
      expect(returned.email).toBe("john.updated@example.com");
    });

    it("should call next on update error", async () => {
      const err = new Error("Update fail");
      req.params.id = "bad";
      User.update.mockRejectedValue(err);

      await UserController.updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("updateUserPassword", () => {
    it("should update user password and return user", async () => {
      const updatedUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        workouts_completed: 5,
      };
      req.params.id = "1";
      req.body = { password: "newsecurepassword" };
      User.updatePassword.mockResolvedValue(updatedUser);

      await UserController.updateUserPassword(req, res, next);

      expect(User.updatePassword).toHaveBeenCalledWith(
        "1",
        "newsecurepassword"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should call next on password update error", async () => {
      const err = new Error("Password update fail");
      req.params.id = "bad";
      User.updatePassword.mockRejectedValue(err);

      await UserController.updateUserPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("updateUserLastLogin", () => {
    it("should update user last login and return user", async () => {
      const updatedUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        last_login: "2023-01-03T00:00:00.000Z",
      };
      req.params.id = "1";
      req.body = { last_login: "2023-01-03T00:00:00.000Z" };
      User.updateLastLogin.mockResolvedValue(updatedUser);

      await UserController.updateUserLastLogin(req, res, next);

      expect(User.updateLastLogin).toHaveBeenCalledWith(
        "1",
        "2023-01-03T00:00:00.000Z"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedUser);

      const returned = res.json.mock.calls[0][0];
      expect(returned.last_login).toBe("2023-01-03T00:00:00.000Z");
    });

    it("should call next on last login update error", async () => {
      const err = new Error("Last login update fail");
      req.params.id = "bad";
      User.updateLastLogin.mockRejectedValue(err);

      await UserController.updateUserLastLogin(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("incrementUserWorkoutsCompleted", () => {
    it("should increment workouts completed and return user", async () => {
      const updatedUser = {
        user: {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          workouts_completed: 6,
        },
      };
      req.params.id = "1";
      req.body = { workoutId: "workout123" };
      User.incrementWorkoutsCompleted.mockResolvedValue(updatedUser);

      await UserController.incrementUserWorkoutsCompleted(req, res, next);

      expect(User.incrementWorkoutsCompleted).toHaveBeenCalledWith(
        "1",
        "workout123"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedUser);

      const returned = res.json.mock.calls[0][0];
      expect(returned.user.workouts_completed).toBe(6);
    });

    it("should call next on increment workouts error", async () => {
      const err = new Error("Increment workouts fail");
      req.params.id = "bad";
      User.incrementWorkoutsCompleted.mockRejectedValue(err);

      await UserController.incrementUserWorkoutsCompleted(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("deleteUser", () => {
    it("should delete a user and return success message", async () => {
      req.params.id = "1";
      User.delete.mockResolvedValue({ deleted: true });

      await UserController.deleteUser(req, res, next);

      expect(User.delete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should call next on delete error", async () => {
      const err = new Error("Delete fail");
      req.params.id = "bad";
      User.delete.mockRejectedValue(err);

      await UserController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
