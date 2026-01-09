import apiService from "./apiService";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  date: string;
  duration_minutes: number;
  calories_burned?: number;
  status: "planned" | "completed" | "skipped";
  is_template: boolean;
  exercises?: Exercise[];
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id: string;
  workout_id?: string;
  exercise_id: string;
  name: string;
  muscle_group?: string;
  equipment?: string;
  sets: Set[];
  order_index?: number;
}

export interface Set {
  id?: string;
  reps: number;
  weight: number;
  duration_seconds?: number;
  rest_seconds?: number;
  completed: boolean;
}

export interface CreateWorkoutData {
  name: string;
  userId: string;
  template?: boolean;
  exercises: Array<{
    exercise: string; // MongoDB exercise ID
    sets: Array<{
      rep: number;
      weight?: number;
      duration?: number;
      rest: number;
    }>;
  }>;
}

class WorkoutService {
  private static instance: WorkoutService;

  private constructor() {}

  public static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }

  /**
   * Get all workouts for current user
   */
  async getWorkouts(): Promise<Workout[]> {
    return apiService.get<Workout[]>("/api/workouts/user/me");
  }

  /**
   * Get workout by ID
   */
  async getWorkoutById(id: string): Promise<Workout> {
    return apiService.get<Workout>(`/api/workouts/${id}`);
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<Workout[]> {
    return apiService.get<Workout[]>("/api/workouts/templates");
  }

  /**
   * Create a new workout
   */
  async createWorkout(data: CreateWorkoutData): Promise<Workout> {
    return apiService.post<Workout>("/api/workouts", data);
  }

  /**
   * Update a workout
   */
  async updateWorkout(
    id: string,
    data: Partial<CreateWorkoutData>
  ): Promise<Workout> {
    return apiService.put<Workout>(`/api/workouts/${id}`, data);
  }

  /**
   * Complete a workout
   */
  async completeWorkout(id: string): Promise<Workout> {
    return apiService.post<Workout>(`/api/workouts/${id}/complete`, {});
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(id: string): Promise<void> {
    return apiService.delete<void>(`/api/workouts/${id}`);
  }

  /**
   * Get workouts for a specific date range
   */
  async getWorkoutsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Workout[]> {
    const workouts = await this.getWorkouts();
    return workouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return (
        workoutDate >= new Date(startDate) && workoutDate <= new Date(endDate)
      );
    });
  }

  /**
   * Get completed workouts count
   */
  async getCompletedCount(): Promise<number> {
    const workouts = await this.getWorkouts();
    return workouts.filter((w) => w.status === "completed").length;
  }

  /**
   * Get weekly stats
   */
  async getWeeklyStats(): Promise<{
    count: number;
    duration: number;
    calories: number;
    volume: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const workouts = await this.getWorkoutsByDateRange(
      weekAgo.toISOString(),
      now.toISOString()
    );

    const completed = workouts.filter((w) => w.status === "completed");

    return {
      count: completed.length,
      duration: completed.reduce(
        (sum, w) => sum + (w.duration_minutes || 0),
        0
      ),
      calories: completed.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
      volume: completed.reduce((sum, w) => {
        const exercises = w.exercises || [];
        return (
          sum +
          exercises.reduce((exSum, ex) => {
            return (
              exSum +
              ex.sets.reduce((setSum, set) => {
                return setSum + set.weight * set.reps;
              }, 0)
            );
          }, 0)
        );
      }, 0),
    };
  }
}

export default WorkoutService.getInstance();
