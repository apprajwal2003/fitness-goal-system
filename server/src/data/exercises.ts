export type Modality = 'gym' | 'yoga' | 'home_workout' | 'cardio' | 'mixed';
export type Intensity = 'light' | 'moderate' | 'intense';
export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';
export type GoalType = 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'glutes' | 'full_body' | 'cardio_endurance' | 'flexibility';

export interface Exercise {
  id: string;
  name: string;
  modality: Modality[];
  intensity: Intensity;
  caloriesPerMinute: number; // base rate for 70kg person
  muscleGroups: MuscleGroup[];
  suitableGoals: GoalType[];
  suitableBodyTypes: BodyType[];
  description: string;
  sets?: string;
  reps?: string;
}

export const EXERCISES: Exercise[] = [
  // GYM - INTENSE
  { id: 'barbell-squat', name: 'Barbell Squat', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 9.5, muscleGroups: ['legs', 'glutes', 'core'], suitableGoals: ['build_muscle', 'lose_weight', 'endurance'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Compound lower body movement for strength and mass', sets: '4', reps: '8-12' },
  { id: 'deadlift', name: 'Deadlift', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 10, muscleGroups: ['back', 'legs', 'core'], suitableGoals: ['build_muscle', 'lose_weight'], suitableBodyTypes: ['mesomorph', 'endomorph', 'ectomorph'], description: 'Full body posterior chain builder', sets: '4', reps: '6-8' },
  { id: 'bench-press', name: 'Bench Press', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 8, muscleGroups: ['chest', 'shoulders', 'arms'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['mesomorph', 'ectomorph'], description: 'Primary chest builder for upper body strength', sets: '4', reps: '8-12' },
  { id: 'overhead-press', name: 'Overhead Press', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 7.5, muscleGroups: ['shoulders', 'arms', 'core'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['mesomorph', 'ectomorph'], description: 'Standing shoulder press for deltoid development', sets: '3', reps: '8-10' },
  { id: 'barbell-row', name: 'Barbell Row', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 8, muscleGroups: ['back', 'arms'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['mesomorph', 'ectomorph', 'endomorph'], description: 'Bent-over row for back thickness', sets: '4', reps: '8-12' },
  { id: 'leg-press', name: 'Leg Press', modality: ['gym'], intensity: 'intense', caloriesPerMinute: 8.5, muscleGroups: ['legs', 'glutes'], suitableGoals: ['build_muscle', 'lose_weight'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Machine-based lower body press', sets: '4', reps: '10-15' },
  { id: 'pull-ups', name: 'Pull-ups', modality: ['gym', 'home_workout'], intensity: 'intense', caloriesPerMinute: 9, muscleGroups: ['back', 'arms'], suitableGoals: ['build_muscle', 'endurance', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph'], description: 'Upper body pull for back and biceps', sets: '4', reps: '6-12' },

  // GYM - MODERATE
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', modality: ['gym', 'home_workout'], intensity: 'moderate', caloriesPerMinute: 5, muscleGroups: ['arms'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Isolation exercise for bicep development', sets: '3', reps: '10-15' },
  { id: 'tricep-dips', name: 'Tricep Dips', modality: ['gym', 'home_workout'], intensity: 'moderate', caloriesPerMinute: 6.5, muscleGroups: ['arms', 'chest', 'shoulders'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph'], description: 'Bodyweight tricep and chest exercise', sets: '3', reps: '10-15' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', modality: ['gym'], intensity: 'moderate', caloriesPerMinute: 6, muscleGroups: ['back', 'arms'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Cable back exercise for width', sets: '3', reps: '10-12' },
  { id: 'cable-fly', name: 'Cable Fly', modality: ['gym'], intensity: 'moderate', caloriesPerMinute: 5.5, muscleGroups: ['chest'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph'], description: 'Chest isolation for definition', sets: '3', reps: '12-15' },
  { id: 'leg-extension', name: 'Leg Extension', modality: ['gym'], intensity: 'moderate', caloriesPerMinute: 5.5, muscleGroups: ['legs'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Quadriceps isolation machine', sets: '3', reps: '12-15' },
  { id: 'seated-row', name: 'Seated Row', modality: ['gym'], intensity: 'moderate', caloriesPerMinute: 6, muscleGroups: ['back', 'arms'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Cable row for back thickness', sets: '3', reps: '10-12' },

  // CARDIO - INTENSE
  { id: 'hiit-sprints', name: 'HIIT Sprints', modality: ['cardio', 'gym'], intensity: 'intense', caloriesPerMinute: 14, muscleGroups: ['cardio_endurance', 'legs'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['endomorph', 'mesomorph'], description: 'High-intensity interval sprints for maximum fat burn', sets: '8', reps: '30s sprint / 30s rest' },
  { id: 'jump-rope', name: 'Jump Rope', modality: ['cardio', 'home_workout'], intensity: 'intense', caloriesPerMinute: 12, muscleGroups: ['cardio_endurance', 'legs', 'core'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Full body cardio with coordination training', sets: '5', reps: '3 min rounds' },
  { id: 'rowing-machine', name: 'Rowing Machine', modality: ['cardio', 'gym'], intensity: 'intense', caloriesPerMinute: 11, muscleGroups: ['cardio_endurance', 'back', 'legs'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Full body cardio and strength', sets: '1', reps: '20-30 min' },
  { id: 'battle-ropes', name: 'Battle Ropes', modality: ['gym', 'cardio'], intensity: 'intense', caloriesPerMinute: 13, muscleGroups: ['arms', 'shoulders', 'core', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Upper body HIIT for explosive power', sets: '6', reps: '30s on / 30s rest' },

  // CARDIO - MODERATE
  { id: 'brisk-walking', name: 'Brisk Walking', modality: ['cardio', 'home_workout'], intensity: 'light', caloriesPerMinute: 5, muscleGroups: ['cardio_endurance', 'legs'], suitableGoals: ['lose_weight', 'maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Low-impact cardiovascular exercise', sets: '1', reps: '30-60 min' },
  { id: 'jogging', name: 'Jogging', modality: ['cardio'], intensity: 'moderate', caloriesPerMinute: 9, muscleGroups: ['cardio_endurance', 'legs'], suitableGoals: ['lose_weight', 'endurance', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Steady-state cardio for endurance building', sets: '1', reps: '20-40 min' },
  { id: 'cycling', name: 'Cycling', modality: ['cardio', 'gym'], intensity: 'moderate', caloriesPerMinute: 8, muscleGroups: ['cardio_endurance', 'legs'], suitableGoals: ['lose_weight', 'endurance', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Low-impact cardio for leg endurance', sets: '1', reps: '30-45 min' },
  { id: 'stair-climber', name: 'Stair Climber', modality: ['gym', 'cardio'], intensity: 'moderate', caloriesPerMinute: 9, muscleGroups: ['legs', 'glutes', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['mesomorph', 'endomorph'], description: 'Simulated stair climbing for glutes and cardio', sets: '1', reps: '20-30 min' },
  { id: 'swimming', name: 'Swimming', modality: ['cardio'], intensity: 'moderate', caloriesPerMinute: 10, muscleGroups: ['full_body', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Zero-impact full body cardio', sets: '1', reps: '30-45 min' },

  // HOME WORKOUT
  { id: 'push-ups', name: 'Push-ups', modality: ['home_workout', 'mixed'], intensity: 'moderate', caloriesPerMinute: 7, muscleGroups: ['chest', 'shoulders', 'arms', 'core'], suitableGoals: ['build_muscle', 'maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Classic bodyweight chest and tricep exercise', sets: '4', reps: '15-25' },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', modality: ['home_workout', 'mixed'], intensity: 'moderate', caloriesPerMinute: 7.5, muscleGroups: ['legs', 'glutes', 'core'], suitableGoals: ['lose_weight', 'maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Fundamental lower body movement', sets: '4', reps: '15-20' },
  { id: 'lunges', name: 'Lunges', modality: ['home_workout', 'gym', 'mixed'], intensity: 'moderate', caloriesPerMinute: 7, muscleGroups: ['legs', 'glutes'], suitableGoals: ['build_muscle', 'lose_weight', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Unilateral leg exercise for balance and strength', sets: '3', reps: '12 each leg' },
  { id: 'plank', name: 'Plank', modality: ['home_workout', 'mixed', 'yoga'], intensity: 'moderate', caloriesPerMinute: 4, muscleGroups: ['core'], suitableGoals: ['maintain', 'endurance', 'build_muscle'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Isometric core stability exercise', sets: '3', reps: '45-60s hold' },
  { id: 'burpees', name: 'Burpees', modality: ['home_workout', 'cardio', 'mixed'], intensity: 'intense', caloriesPerMinute: 12, muscleGroups: ['full_body', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Full body explosive exercise for fat burning', sets: '4', reps: '10-15' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', modality: ['home_workout', 'cardio', 'mixed'], intensity: 'intense', caloriesPerMinute: 11, muscleGroups: ['core', 'cardio_endurance', 'legs'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Dynamic cardio core exercise', sets: '4', reps: '30s' },
  { id: 'glute-bridge', name: 'Glute Bridge', modality: ['home_workout', 'mixed'], intensity: 'light', caloriesPerMinute: 4.5, muscleGroups: ['glutes', 'core'], suitableGoals: ['build_muscle', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Hip extension for glute activation', sets: '3', reps: '15-20' },
  { id: 'jumping-jacks', name: 'Jumping Jacks', modality: ['home_workout', 'cardio'], intensity: 'moderate', caloriesPerMinute: 8, muscleGroups: ['full_body', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance', 'maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Classic warm-up and cardio exercise', sets: '3', reps: '30-50' },
  { id: 'high-knees', name: 'High Knees', modality: ['home_workout', 'cardio'], intensity: 'intense', caloriesPerMinute: 10, muscleGroups: ['legs', 'core', 'cardio_endurance'], suitableGoals: ['lose_weight', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'High-intensity standing knee drives', sets: '4', reps: '30s' },
  { id: 'wall-sit', name: 'Wall Sit', modality: ['home_workout'], intensity: 'moderate', caloriesPerMinute: 5, muscleGroups: ['legs', 'core'], suitableGoals: ['maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Isometric quad hold against a wall', sets: '3', reps: '30-60s' },
  { id: 'superman', name: 'Superman Hold', modality: ['home_workout', 'mixed'], intensity: 'light', caloriesPerMinute: 3.5, muscleGroups: ['back', 'core', 'glutes'], suitableGoals: ['maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Posterior chain activation lying face down', sets: '3', reps: '15-20' },

  // YOGA
  { id: 'sun-salutation', name: 'Sun Salutation (Surya Namaskar)', modality: ['yoga'], intensity: 'moderate', caloriesPerMinute: 6, muscleGroups: ['full_body', 'flexibility'], suitableGoals: ['maintain', 'endurance', 'lose_weight'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Dynamic yoga flow for flexibility and strength', sets: '5-10', reps: 'rounds' },
  { id: 'warrior-poses', name: 'Warrior Poses (I, II, III)', modality: ['yoga'], intensity: 'moderate', caloriesPerMinute: 5, muscleGroups: ['legs', 'core', 'flexibility'], suitableGoals: ['maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Standing balance poses for leg strength and stability', sets: '3', reps: '30s each side' },
  { id: 'downward-dog', name: 'Downward Dog', modality: ['yoga'], intensity: 'light', caloriesPerMinute: 3.5, muscleGroups: ['shoulders', 'back', 'legs', 'flexibility'], suitableGoals: ['maintain', 'endurance'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Foundational inversion for full body stretch', sets: '1', reps: '1-2 min hold' },
  { id: 'tree-pose', name: 'Tree Pose (Vrksasana)', modality: ['yoga'], intensity: 'light', caloriesPerMinute: 3, muscleGroups: ['legs', 'core', 'flexibility'], suitableGoals: ['maintain'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Balance pose for focus and stability', sets: '2', reps: '30-60s each side' },
  { id: 'power-yoga', name: 'Power Yoga Flow', modality: ['yoga', 'mixed'], intensity: 'intense', caloriesPerMinute: 8, muscleGroups: ['full_body', 'flexibility', 'core'], suitableGoals: ['lose_weight', 'endurance', 'build_muscle'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Vigorous yoga combining strength and flexibility', sets: '1', reps: '30-45 min' },
  { id: 'yoga-stretching', name: 'Yoga Stretching & Cool Down', modality: ['yoga', 'mixed', 'home_workout'], intensity: 'light', caloriesPerMinute: 2.5, muscleGroups: ['flexibility', 'full_body'], suitableGoals: ['maintain', 'endurance', 'lose_weight', 'build_muscle'], suitableBodyTypes: ['ectomorph', 'mesomorph', 'endomorph'], description: 'Gentle stretches for recovery and flexibility', sets: '1', reps: '10-15 min' },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
