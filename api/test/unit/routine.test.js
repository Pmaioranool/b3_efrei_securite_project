const Routine = require("../../src/models/Routine.model");
const RoutineController = require("../../src/controllers/routine.controller");

jest.mock("../../src/models/Routine.model");

describe("Routine Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getRoutine", () => {
    it("should return all routines with populated workouts", async () => {
      const mockRoutines = [
        {
          _id: "routine1",
          userId: 1,
          workoutId: {
            _id: "workout1",
            name: "Morning Workout",
            exercises: [],
          },
          cron: "0 8 * * 1,3,5",
          timezone: "Europe/Paris",
          createdAt: "2023-12-01T10:00:00Z",
          updatedAt: "2023-12-01T10:00:00Z",
        },
        {
          _id: "routine2",
          userId: 2,
          workoutId: {
            _id: "workout2",
            name: "Evening Workout",
            exercises: [],
          },
          cron: "0 18 * * 2,4,6",
          timezone: "Europe/Paris",
          createdAt: "2023-12-02T10:00:00Z",
          updatedAt: "2023-12-02T10:00:00Z",
        },
      ];
      Routine.getAll.mockResolvedValue(mockRoutines);

      await RoutineController.getRoutine(req, res, next);

      expect(Routine.getAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRoutines);

      const returned = res.json.mock.calls[0][0];
      expect(returned).toBeInstanceOf(Array);
      expect(returned).toHaveLength(2);
      expect(returned[0].workoutId.name).toBe("Morning Workout");
    });

    it("should call next on error", async () => {
      const err = new Error("Database connection failed");
      Routine.getAll.mockRejectedValue(err);

      await RoutineController.getRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should return empty array when no routines exist", async () => {
      Routine.getAll.mockResolvedValue([]);

      await RoutineController.getRoutine(req, res, next);

      expect(Routine.getAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getRoutineById", () => {
    it("should return a routine by id with workout populated", async () => {
      const mockRoutine = {
        _id: "routine1",
        userId: 1,
        workoutId: {
          _id: "workout1",
          name: "Core Routine",
          exercises: [{ Title: "Plank" }],
        },
        cron: "0 7 * * *",
        timezone: "Europe/Paris",
      };
      req.params.id = "routine1";
      Routine.getById.mockResolvedValue(mockRoutine);

      await RoutineController.getRoutineById(req, res, next);

      expect(Routine.getById).toHaveBeenCalledWith("routine1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRoutine);

      const returned = res.json.mock.calls[0][0];
      expect(returned.workoutId.name).toBe("Core Routine");
      expect(returned.cron).toBe("0 7 * * *");
    });

    it("should call next on error when routine not found", async () => {
      const err = new Error("Routine not found");
      req.params.id = "invalidId";
      Routine.getById.mockRejectedValue(err);

      await RoutineController.getRoutineById(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle invalid ObjectId format", async () => {
      const err = new Error("Cast to ObjectId failed");
      req.params.id = "invalid-format";
      Routine.getById.mockRejectedValue(err);

      await RoutineController.getRoutineById(req, res, next);

      expect(Routine.getById).toHaveBeenCalledWith("invalid-format");
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("createRoutine", () => {
    it("should create a routine and return 201", async () => {
      const newRoutine = {
        _id: "routine10",
        userId: 5,
        workoutId: "workout5",
        cron: "0 6 * * 1,3,5",
        timezone: "Europe/Paris",
        createdAt: "2023-12-17T10:00:00Z",
        updatedAt: "2023-12-17T10:00:00Z",
      };

      req.body = {
        userId: 5,
        workoutId: "workout5",
        cron: "0 6 * * 1,3,5",
        timezone: "Europe/Paris",
      };

      Routine.create.mockResolvedValue(newRoutine);

      await RoutineController.createRoutine(req, res, next);

      expect(Routine.create).toHaveBeenCalledWith({
        userId: 5,
        workoutId: "workout5",
        cron: "0 6 * * 1,3,5",
        timezone: "Europe/Paris",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newRoutine);
    });

    it("should create routine with default timezone when not provided", async () => {
      const newRoutine = {
        _id: "routine11",
        userId: 3,
        workoutId: "workout3",
        cron: "0 9 * * *",
        timezone: "Europe/Paris",
      };

      req.body = {
        userId: 3,
        workoutId: "workout3",
        cron: "0 9 * * *",
      };

      Routine.create.mockResolvedValue(newRoutine);

      await RoutineController.createRoutine(req, res, next);

      expect(Routine.create).toHaveBeenCalledWith({
        userId: 3,
        workoutId: "workout3",
        cron: "0 9 * * *",
        timezone: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on validation error for invalid cron", async () => {
      const err = new Error("Invalid cron expression");
      req.body = {
        userId: 1,
        workoutId: "workout1",
        cron: "invalid-cron",
      };

      Routine.create.mockRejectedValue(err);

      await RoutineController.createRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next when required fields are missing", async () => {
      const err = new Error(
        "userId, workoutId, and cron are required to create a routine."
      );
      req.body = {
        userId: 1,
        // missing workoutId and cron
      };

      Routine.create.mockRejectedValue(err);

      await RoutineController.createRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });

    it("should handle various cron expressions", async () => {
      const cronExamples = [
        "0 8 * * 1,3,5", // Every Mon, Wed, Fri at 8am
        "0 */2 * * *", // Every 2 hours
        "30 12 * * 0", // Every Sunday at 12:30pm
        "0 0 1 * *", // First day of month
      ];

      for (const cron of cronExamples) {
        const newRoutine = {
          _id: `routine${cron}`,
          userId: 1,
          workoutId: "workout1",
          cron: cron,
          timezone: "Europe/Paris",
        };

        req.body = {
          userId: 1,
          workoutId: "workout1",
          cron: cron,
        };

        Routine.create.mockResolvedValue(newRoutine);

        await RoutineController.createRoutine(req, res, next);

        expect(Routine.create).toHaveBeenCalledWith(
          expect.objectContaining({ cron })
        );
      }
    });
  });

  describe("updateRoutine", () => {
    it("should update a routine and return it", async () => {
      const updated = {
        _id: "routine1",
        userId: 1,
        workoutId: "workout2",
        cron: "0 10 * * 1,3,5",
        timezone: "America/New_York",
      };

      req.params.id = "routine1";
      req.body = {
        userId: 1,
        workoutId: "workout2",
        cron: "0 10 * * 1,3,5",
        timezone: "America/New_York",
      };

      Routine.update.mockResolvedValue(updated);

      await RoutineController.updateRoutine(req, res, next);

      expect(Routine.update).toHaveBeenCalledWith("routine1", {
        userId: 1,
        workoutId: "workout2",
        cron: "0 10 * * 1,3,5",
        timezone: "America/New_York",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should update only specified fields", async () => {
      const updated = {
        _id: "routine1",
        userId: 1,
        workoutId: "workout1",
        cron: "0 12 * * *",
        timezone: "Europe/Paris",
      };

      req.params.id = "routine1";
      req.body = {
        cron: "0 12 * * *", // Only updating cron
      };

      Routine.update.mockResolvedValue(updated);

      await RoutineController.updateRoutine(req, res, next);

      expect(Routine.update).toHaveBeenCalledWith("routine1", {
        userId: undefined,
        workoutId: undefined,
        cron: "0 12 * * *",
        timezone: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on update error", async () => {
      const err = new Error("Routine not found for update");
      req.params.id = "nonexistent";
      req.body = {
        cron: "0 8 * * *",
      };

      Routine.update.mockRejectedValue(err);

      await RoutineController.updateRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle invalid cron expression on update", async () => {
      const err = new Error("Invalid cron expression");
      req.params.id = "routine1";
      req.body = {
        cron: "bad cron format",
      };

      Routine.update.mockRejectedValue(err);

      await RoutineController.updateRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("deleteRoutine", () => {
    it("should delete a routine and return success message", async () => {
      req.params.id = "routine1";
      Routine.delete.mockResolvedValue({ deleted: true });

      await RoutineController.deleteRoutine(req, res, next);

      expect(Routine.delete).toHaveBeenCalledWith("routine1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Routine deleted successfully",
      });
    });

    it("should call next on delete error", async () => {
      const err = new Error("Delete operation failed");
      req.params.id = "routine1";
      Routine.delete.mockRejectedValue(err);

      await RoutineController.deleteRoutine(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should handle non-existent routine deletion", async () => {
      const err = new Error("Routine not found");
      req.params.id = "nonexistent";
      Routine.delete.mockRejectedValue(err);

      await RoutineController.deleteRoutine(req, res, next);

      expect(Routine.delete).toHaveBeenCalledWith("nonexistent");
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("Edge Cases and Integration Scenarios", () => {
    it("should handle concurrent routine creation", async () => {
      const routines = [
        {
          userId: 1,
          workoutId: "workout1",
          cron: "0 8 * * 1",
          timezone: "Europe/Paris",
        },
        {
          userId: 1,
          workoutId: "workout2",
          cron: "0 18 * * 1",
          timezone: "Europe/Paris",
        },
      ];

      for (const routine of routines) {
        req.body = routine;
        Routine.create.mockResolvedValue({ _id: "new", ...routine });

        await RoutineController.createRoutine(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    });

    it("should handle timezone changes", async () => {
      const timezones = [
        "Europe/Paris",
        "America/New_York",
        "Asia/Tokyo",
        "Australia/Sydney",
      ];

      for (const timezone of timezones) {
        const updated = {
          _id: "routine1",
          userId: 1,
          workoutId: "workout1",
          cron: "0 8 * * *",
          timezone: timezone,
        };

        req.params.id = "routine1";
        req.body = { timezone };
        Routine.update.mockResolvedValue(updated);

        await RoutineController.updateRoutine(req, res, next);

        expect(Routine.update).toHaveBeenCalledWith(
          "routine1",
          expect.objectContaining({ timezone })
        );
      }
    });

    it("should validate user can have multiple routines", async () => {
      const userRoutines = [
        {
          _id: "r1",
          userId: 1,
          workoutId: "w1",
          cron: "0 8 * * *",
        },
        {
          _id: "r2",
          userId: 1,
          workoutId: "w2",
          cron: "0 18 * * *",
        },
        {
          _id: "r3",
          userId: 1,
          workoutId: "w3",
          cron: "0 12 * * 0",
        },
      ];

      Routine.getAll.mockResolvedValue(userRoutines);

      await RoutineController.getRoutine(req, res, next);

      const returned = res.json.mock.calls[0][0];
      expect(returned).toHaveLength(3);
      expect(returned.every((r) => r.userId === 1)).toBe(true);
    });
  });
});
