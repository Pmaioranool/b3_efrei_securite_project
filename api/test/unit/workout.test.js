const Workout = require("../../src/models/Workout.model");
const WorkoutController = require("../../src/controllers/Workout.controller");

jest.mock("../../src/models/Workout.model");

describe("Workout Controller (with exercises populated)", () => {
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

  describe("getWorkout", () => {
    it("should return all workouts with populated exercises", async () => {
      const mockWorkouts = [
        {
          _id: "1",
          name: "Full Body",
          duration: 45,
          exercises: [
            { _id: "e1", Title: "Push Up", Level: "Beginner" },
            { _id: "e2", Title: "Squat", Level: "Beginner" },
          ],
        },
      ];
      Workout.getAll.mockResolvedValue(mockWorkouts);

      await WorkoutController.getWorkout(req, res, next);

      expect(Workout.getAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWorkouts);

      // extra assertions on exercises presence
      const returned = res.json.mock.calls[0][0];
      expect(returned[0].exercises).toBeInstanceOf(Array);
      expect(returned[0].exercises[0].Title).toBe("Push Up");
    });

    it("should call next on error", async () => {
      const err = new Error("DB fail");
      Workout.getAll.mockRejectedValue(err);

      await WorkoutController.getWorkout(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getWorkoutById", () => {
    it("should return a workout by id with exercises populated", async () => {
      const mockWorkout = {
        _id: "1",
        name: "Core",
        duration: 30,
        exercises: [{ _id: "e3", Title: "Plank", Level: "Intermediate" }],
      };
      req.params.id = "1";
      Workout.getById.mockResolvedValue(mockWorkout);

      await WorkoutController.getWorkoutById(req, res, next);

      expect(Workout.getById).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWorkout);

      const returned = res.json.mock.calls[0][0];
      expect(returned.exercises).toHaveLength(1);
      expect(returned.exercises[0].Title).toBe("Plank");
    });

    it("should call next on error", async () => {
      const err = new Error("Not found");
      req.params.id = "bad";
      Workout.getById.mockRejectedValue(err);

      await WorkoutController.getWorkoutById(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("createWorkout", () => {
    it("should create a workout and return 201 including exercises", async () => {
      const newWorkout = {
        _id: "10",
        name: "Leg Day",
        template: false,
        userId: 7,
        exercises: [
          {
            _id: "e4",
            Title: "Lunge",
            Level: "Intermediate",
            sets: [{ rep: 10, weight: 40 }],
          },
        ],
      };

      req.body = {
        name: "Leg Day",
        userId: 7,
        template: false,
        exercises: [
          {
            exercise: "e4",
            rest: 90,
            sets: [{ rep: 10, weight: 40 }],
          },
        ],
      };

      Workout.create.mockResolvedValue(newWorkout);

      await WorkoutController.createWorkout(req, res, next);

      expect(Workout.create).toHaveBeenCalledWith({
        name: "Leg Day",
        userId: 7,
        template: false,
        exercises: [
          {
            exercise: "e4",
            rest: 90,
            sets: [{ rep: 10, weight: 40 }],
          },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newWorkout);

      const returned = res.json.mock.calls[0][0];
      expect(returned.exercises[0].sets[0].rep).toBe(10);
    });

    it("should return 400 on validation error", async () => {
      // Missing sets -> invalid
      req.body = {
        name: "Invalid",
        userId: 1,
        template: false,
        exercises: [{ exercise: "e1", rest: 60, sets: [] }],
      };

      await WorkoutController.createWorkout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("au moins un set"),
        })
      );
    });
  });

  describe("updateWorkout", () => {
    it("should update a workout and return it with exercises", async () => {
      const updated = {
        _id: "1",
        name: "Updated",
        template: false,
        userId: 3,
        exercises: [
          {
            _id: "e5",
            Title: "Deadlift",
            Level: "Advanced",
            sets: [{ rep: 5, weight: 120 }],
          },
        ],
      };
      req.params.id = "1";
      req.body = {
        name: "Updated",
        userId: 3,
        template: false,
        exercises: [
          { exercise: "e5", rest: 120, sets: [{ rep: 5, weight: 120 }] },
        ],
      };
      Workout.update.mockResolvedValue(updated);

      await WorkoutController.updateWorkout(req, res, next);

      expect(Workout.update).toHaveBeenCalledWith("1", {
        name: "Updated",
        userId: 3,
        template: false,
        exercises: [
          { exercise: "e5", rest: 120, sets: [{ rep: 5, weight: 120 }] },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);

      const returned = res.json.mock.calls[0][0];
      expect(returned.exercises[0].sets[0].weight).toBe(120);
    });

    it("should return 400 on validation error", async () => {
      req.params.id = "1";
      req.body = {
        name: "Bad",
        exercises: [
          { exercise: "e5", rest: 120, sets: [{ rep: 0 }] }, // rep invalid
        ],
      };

      await WorkoutController.updateWorkout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining(
            "Exercice 1, set 1: rep doit être >= 1."
          ),
        })
      );
    });
  });

  describe("deleteWorkout", () => {
    it("should delete a workout and return success message", async () => {
      req.params.id = "1";
      Workout.delete.mockResolvedValue({ _id: "1", name: "W1" });

      await WorkoutController.deleteWorkout(req, res, next);

      expect(Workout.delete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Workout deleted successfully",
      });
    });

    it("should call next on delete error", async () => {
      const err = new Error("Delete fail");
      req.params.id = "bad";
      Workout.delete.mockRejectedValue(err);

      await WorkoutController.deleteWorkout(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
