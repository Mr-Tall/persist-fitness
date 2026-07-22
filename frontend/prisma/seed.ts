import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  {
    name: "Barbell Bench Press",
    force: "Push",
    level: "Intermediate",
    mechanic: "Compound",
    equipment: "Barbell",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Triceps", "Shoulders"],
    instructions: [
      "Lie on a flat bench with your feet planted.",
      "Grip the bar slightly wider than shoulder width.",
      "Lower the bar under control to your lower chest.",
      "Press the bar back up while keeping your shoulder blades tight.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Incline Dumbbell Press",
    force: "Push",
    level: "Beginner",
    mechanic: "Compound",
    equipment: "Dumbbells",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Shoulders", "Triceps"],
    instructions: [
      "Set an incline bench around 30 to 45 degrees.",
      "Press the dumbbells upward while keeping control.",
      "Lower until you feel a chest stretch.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Squat",
    force: "Push",
    level: "Intermediate",
    mechanic: "Compound",
    equipment: "Barbell",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    instructions: [
      "Set the bar across your upper back.",
      "Brace your core and keep your feet planted.",
      "Squat down under control.",
      "Drive through your feet to stand back up.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Deadlift",
    force: "Pull",
    level: "Intermediate",
    mechanic: "Compound",
    equipment: "Barbell",
    primaryMuscles: ["Hamstrings", "Glutes", "Back"],
    secondaryMuscles: ["Forearms", "Core"],
    instructions: [
      "Stand with the bar over midfoot.",
      "Brace your core and grip the bar.",
      "Push the floor away and stand tall.",
      "Lower the bar under control.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Leg Press",
    force: "Push",
    level: "Beginner",
    mechanic: "Compound",
    equipment: "Machine",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings"],
    instructions: [
      "Place your feet on the platform.",
      "Lower the sled under control.",
      "Press through your feet without locking your knees hard.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Leg Curl",
    force: "Pull",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Machine",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: [],
    instructions: [
      "Set the pad near your lower leg.",
      "Curl the weight by bending your knees.",
      "Control the return.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Lat Pulldown",
    force: "Pull",
    level: "Beginner",
    mechanic: "Compound",
    equipment: "Cable",
    primaryMuscles: ["Lats"],
    secondaryMuscles: ["Biceps", "Upper Back"],
    instructions: [
      "Grip the bar wider than shoulder width.",
      "Pull the bar toward your upper chest.",
      "Control the bar back up.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Pull-Up",
    force: "Pull",
    level: "Intermediate",
    mechanic: "Compound",
    equipment: "Bodyweight",
    primaryMuscles: ["Lats"],
    secondaryMuscles: ["Biceps", "Upper Back"],
    instructions: [
      "Hang from a pull-up bar.",
      "Pull your chest toward the bar.",
      "Lower under control.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Seated Cable Row",
    force: "Pull",
    level: "Beginner",
    mechanic: "Compound",
    equipment: "Cable",
    primaryMuscles: ["Upper Back", "Lats"],
    secondaryMuscles: ["Biceps"],
    instructions: [
      "Sit tall and grip the handle.",
      "Pull the handle toward your torso.",
      "Squeeze your back, then control the return.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Shoulder Press",
    force: "Push",
    level: "Beginner",
    mechanic: "Compound",
    equipment: "Machine",
    primaryMuscles: ["Shoulders"],
    secondaryMuscles: ["Triceps"],
    instructions: [
      "Set the handles around shoulder height.",
      "Press overhead under control.",
      "Lower back to the start position.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Lateral Raise",
    force: "Push",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Dumbbells",
    primaryMuscles: ["Shoulders"],
    secondaryMuscles: [],
    instructions: [
      "Hold dumbbells at your sides.",
      "Raise your arms out to the side.",
      "Control the dumbbells back down.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Tricep Pushdown",
    force: "Push",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Cable",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: [],
    instructions: [
      "Stand at a cable machine.",
      "Keep your elbows close to your sides.",
      "Push the attachment down until your arms are extended.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Cable Curl",
    force: "Pull",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Cable",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    instructions: [
      "Stand at a cable station.",
      "Curl the handle while keeping elbows stable.",
      "Lower under control.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Hammer Curl",
    force: "Pull",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Dumbbells",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    instructions: [
      "Hold dumbbells with neutral grip.",
      "Curl the dumbbells up without swinging.",
      "Lower under control.",
    ],
    category: "Strength",
    images: [],
  },
  {
    name: "Standing Calf Raise",
    force: "Push",
    level: "Beginner",
    mechanic: "Isolation",
    equipment: "Machine",
    primaryMuscles: ["Calves"],
    secondaryMuscles: [],
    instructions: [
      "Stand with the balls of your feet on the platform.",
      "Raise your heels as high as possible.",
      "Lower under control for a full stretch.",
    ],
    category: "Strength",
    images: [],
  },
];

const exerciseLibraryMetadata = {
  "Barbell Bench Press": {
    movementPattern: "horizontal_push",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Bench Press", "Flat Bench Press", "Barbell Chest Press"],
    tips: [
      "Keep your shoulder blades pulled back and down throughout the set.",
      "Keep your wrists stacked over your elbows as you press.",
    ],
  },
  "Incline Dumbbell Press": {
    movementPattern: "horizontal_push",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Incline DB Press", "Incline Chest Press"],
    tips: [
      "Use a moderate incline to keep the chest as the primary mover.",
      "Keep both dumbbells moving at the same pace.",
    ],
  },
  Squat: {
    movementPattern: "squat",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Back Squat", "Barbell Back Squat"],
    tips: [
      "Brace before each repetition and keep pressure through your whole foot.",
      "Let your knees track in the same direction as your toes.",
    ],
  },
  Deadlift: {
    movementPattern: "hinge",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Conventional Deadlift", "Barbell Deadlift"],
    tips: [
      "Take the slack out of the bar before it leaves the floor.",
      "Keep the bar close to your legs throughout the lift.",
    ],
  },
  "Leg Press": {
    movementPattern: "squat",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Machine Leg Press", "Sled Leg Press"],
    tips: [
      "Keep your hips and lower back supported by the pad.",
      "Use a depth you can control without your pelvis rolling upward.",
    ],
  },
  "Leg Curl": {
    movementPattern: "knee_flexion",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Hamstring Curl", "Machine Leg Curl"],
    tips: [
      "Keep your hips still while bending your knees.",
      "Pause briefly in the shortened position before lowering.",
    ],
  },
  "Lat Pulldown": {
    movementPattern: "vertical_pull",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Cable Pulldown", "Wide Grip Pulldown"],
    tips: [
      "Drive your elbows down instead of pulling with your hands.",
      "Avoid leaning far back to turn the movement into a row.",
    ],
  },
  "Pull-Up": {
    movementPattern: "vertical_pull",
    exerciseType: "bodyweight",
    laterality: "bilateral",
    trackingType: "reps_only",
    aliases: ["Pull Up", "Pronated Pull-Up", "Bodyweight Pull-Up"],
    tips: [
      "Begin each repetition from a controlled full hang.",
      "Keep your ribs down and avoid swinging for strict repetitions.",
    ],
  },
  "Seated Cable Row": {
    movementPattern: "horizontal_pull",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Cable Row", "Seated Row"],
    tips: [
      "Keep your torso stable while pulling your elbows behind you.",
      "Reach forward under control without rounding aggressively.",
    ],
  },
  "Shoulder Press": {
    movementPattern: "vertical_push",
    exerciseType: "compound",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Machine Shoulder Press", "Overhead Press Machine"],
    tips: [
      "Keep your ribs stacked rather than arching to finish the press.",
      "Use a grip that lets your forearms stay close to vertical.",
    ],
  },
  "Lateral Raise": {
    movementPattern: "shoulder_abduction",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Dumbbell Lateral Raise", "Side Raise"],
    tips: [
      "Lead with your elbows and keep a soft bend in your arms.",
      "Use controlled repetitions instead of swinging the weights.",
    ],
  },
  "Tricep Pushdown": {
    movementPattern: "elbow_extension",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Triceps Pushdown", "Cable Pushdown"],
    tips: [
      "Keep your upper arms still beside your torso.",
      "Finish each repetition by fully extending the elbows under control.",
    ],
  },
  "Cable Curl": {
    movementPattern: "elbow_flexion",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Cable Biceps Curl", "Standing Cable Curl"],
    tips: [
      "Keep your elbows close to your sides throughout the curl.",
      "Resist the cable as you return to the starting position.",
    ],
  },
  "Hammer Curl": {
    movementPattern: "elbow_flexion",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Dumbbell Hammer Curl", "Neutral Grip Curl"],
    tips: [
      "Keep a neutral grip from the bottom to the top.",
      "Avoid letting your elbows drift far forward.",
    ],
  },
  "Standing Calf Raise": {
    movementPattern: "plantar_flexion",
    exerciseType: "isolation",
    laterality: "bilateral",
    trackingType: "weight_reps",
    aliases: ["Calf Raise", "Machine Calf Raise"],
    tips: [
      "Pause at the top instead of bouncing through repetitions.",
      "Lower through a comfortable full range before the next repetition.",
    ],
  },
};

async function main() {
  for (const exercise of exercises) {
    const metadata =
      exerciseLibraryMetadata[
        exercise.name as keyof typeof exerciseLibraryMetadata
      ];
    const exerciseData = { ...exercise, ...metadata };

    const existing = await prisma.exercise.findFirst({
      where: {
        name: exercise.name,
      },
    });

    if (existing) {
      await prisma.exercise.update({
        where: {
          id: existing.id,
        },
        data: exerciseData,
      });
    } else {
      await prisma.exercise.create({
        data: exerciseData,
      });
    }
  }

  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
