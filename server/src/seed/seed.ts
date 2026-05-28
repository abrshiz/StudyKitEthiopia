/**
 * Seeds reference + demo data for local development.
 * Run: npm run seed --prefix server
 *
 * NOTE: this is the phase-1 minimal seed. Phase 5 ("phase5-seed") rewrites
 * it to also create demo StudyKits, flashcards, quizzes, summaries, etc.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import {
  AiContext,
  Badge,
  ChatMessage,
  Course,
  CourseProgress,
  Department,
  Flashcard,
  Material,
  Notification,
  Plan,
  QuizQuestion,
  StudyGuide,
  StudyKit,
  Summary,
  User,
  UserBadge,
  UserProgress,
} from "../models/index.js";
import { chunkText } from "../services/ai-context.service.js";

const DEMO_PASSWORD = "StudyKit123!";
const DEMO_STUDENT = "student@aau.edu.et";
const DEMO_PROFESSOR = "prof.cs@aau.edu.et";

const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;

const colleges = [
  "Engineering & Technology",
  "Health Sciences",
  "Natural Sciences",
  "Agriculture",
  "Business & Economics",
  "Law",
  "Education",
  "Arts",
  "Language & Communication",
  "Social Sciences & Humanities",
] as const;

const departmentNames = [
  "Software Engineering",
  "Computer Science",
  "Information Technology",
  "Medicine (MD)",
  "Pharmacy",
  "Accounting",
  "Economics",
  "Law (LLB)",
  "Mathematics",
  "Nursing",
  "Civil Engineering",
  "Electrical Engineering",
  "Amharic Language",
  "Afaan Oromo",
  "Public Health",
  "Architecture",
];

function pickCollege(name: string): string {
  if (/Engineering|Architecture|Civil|Electrical|Software|Computer|Information Technology/.test(name))
    return colleges[0];
  if (/Medicine|Pharmacy|Nursing|Health/.test(name)) return colleges[1];
  if (/Mathematics|Natural/.test(name)) return colleges[2];
  if (/Law/.test(name)) return colleges[5];
  if (/Accounting|Economics|Business/.test(name)) return colleges[4];
  if (/Amharic|Oromo|Language/.test(name)) return colleges[8];
  return colleges[9];
}

async function seedDepartments() {
  const count = await Department.countDocuments();
  if (count > 0) {
    console.info("[seed] departments already exist — skipped");
    return;
  }

  const docs = departmentNames.map((name, i) => ({
    name,
    college: pickCollege(name),
    studentCount: 200 + i * 137,
  }));

  await Department.insertMany(docs);
  console.info(`[seed] ${docs.length} departments`);
}

async function seedPlans() {
  await Plan.deleteMany({});
  await Plan.insertMany([
    {
      slug: "free",
      name: "Free",
      price: 0,
      period: "forever",
      features: ["3 study kits / month", "Basic AI chat", "Flashcards + summaries"],
      sortOrder: 0,
    },
    {
      slug: "student",
      name: "Student",
      price: 99,
      period: "month",
      popular: true,
      features: [
        "30 study kits / month",
        "Smart Study (adaptive quiz)",
        "Practice tests",
        "YouTube transcript ingest",
      ],
      sortOrder: 1,
    },
    {
      slug: "premium",
      name: "Premium",
      price: 299,
      period: "month",
      features: [
        "Unlimited study kits",
        "Gemini 1.5 Pro priority",
        "Exam analytics",
        "Game modes",
      ],
      sortOrder: 2,
    },
  ]);
  console.info("[seed] plans (free / student / premium)");
}

async function seedBadges() {
  await Badge.deleteMany({});
  await Badge.insertMany([
    { slug: "streak-7", name: "7-Day Streak", icon: "🔥", description: "7 days in a row" },
    { slug: "streak-30", name: "30-Day Streak", icon: "⚡", description: "30 day streak" },
    { slug: "first-kit", name: "First Kit", icon: "🎒", description: "Created your first study kit" },
    {
      slug: "quiz-master",
      name: "Quiz Master",
      icon: "🧠",
      description: "Finished 10 quizzes",
    },
    {
      slug: "kit-creator-bronze",
      name: "Bronze Creator",
      icon: "🥉",
      description: "Created 5 study kits",
    },
    {
      slug: "kit-creator-silver",
      name: "Silver Creator",
      icon: "🥈",
      description: "Created 25 study kits",
    },
    {
      slug: "kit-creator-gold",
      name: "Gold Creator",
      icon: "🥇",
      description: "Created 100 study kits",
    },
  ]);
  console.info("[seed] badges");
}

async function upsertUser(email: string, fields: Record<string, unknown>) {
  return User.findOneAndUpdate(
    { email },
    {
      $set: fields,
      $setOnInsert: { email },
      // Make sure we drop any legacy fields that no longer exist on the schema.
      $unset: {
        approvalStatus: "",
        approvedAt: "",
        approvedById: "",
        professorDepartmentId: "",
        "subscription.dailyDownloadsLeft": "",
        "subscription.dailyDownloadsResetAt": "",
        "subscription.totalDownloads": "",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedUsers() {
  const csDept = await Department.findOne({ name: "Computer Science" });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const student = await upsertUser(DEMO_STUDENT, {
    name: "Demo Student",
    passwordHash: hash,
    role: "student",
    university: "Addis Ababa University",
    year: "Year 2",
    departmentId: csDept?._id ?? null,
  });

  const professor = await upsertUser(DEMO_PROFESSOR, {
    name: "Prof. Tewodros (CS)",
    passwordHash: hash,
    role: "professor",
    university: "Addis Ababa University",
    departmentId: csDept?._id ?? null,
  });

  console.info("[seed] demo users upserted (password: StudyKit123!)");
  return { student, professor, csDept };
}

async function seedCoursesForCs(csDeptId: Types.ObjectId) {
  if ((await Course.countDocuments({ departmentId: csDeptId })) > 0) return;
  await Course.insertMany([
    { departmentId: csDeptId, code: "CSE 201", title: "Algorithms", year: 2, semester: "Semester I" },
    { departmentId: csDeptId, code: "CSE 202", title: "Data Structures", year: 2, semester: "Semester I" },
    { departmentId: csDeptId, code: "CSE 303", title: "Operating Systems", year: 3, semester: "Semester I" },
  ]);
}

async function seedMaterials(uploaderId: Types.ObjectId, csDeptId: Types.ObjectId) {
  if ((await Material.countDocuments()) > 0) {
    console.info("[seed] materials already exist — skipped");
    return;
  }

  const swDept = await Department.findOne({ name: "Software Engineering" });
  const itDept = await Department.findOne({ name: "Information Technology" });

  const now = Date.now();
  const expiry = new Date(now + FOUR_MONTHS_MS);

  const sample = await Material.create({
    title: "Introduction to Algorithms — Lecture Notes",
    type: "PDF",
    course: "Algorithms",
    courseCode: "CSE 201",
    semester: "Year 2 · Semester I",
    sizeLabel: "4.2 MB",
    departmentId: csDeptId,
    uploadedById: uploaderId,
    downloadCount: 8,
    expiryDate: expiry,
  });

  const seedText = [
    "Big-O notation describes the upper bound of an algorithm's runtime relative to its input size.",
    "Binary search runs in O(log n) time because each comparison halves the search space.",
    "Merge sort runs in O(n log n) time and is a stable, divide-and-conquer sorting algorithm.",
    "Quicksort runs in O(n log n) on average but O(n^2) in the worst case when the pivot is poorly chosen.",
    "A hash table provides expected O(1) lookup, insert, and delete operations when the load factor stays low.",
    "Graphs can be traversed using breadth-first search (BFS) for shortest paths in unweighted graphs and depth-first search (DFS) for cycle detection and topological sorting.",
    "Dijkstra's algorithm computes shortest paths from a source node in a graph with non-negative edge weights.",
    "Dynamic programming solves problems by combining solutions to overlapping subproblems and is commonly used for the longest common subsequence and knapsack problems.",
  ].join("\n");

  const chunks = chunkText(seedText, 500);
  await AiContext.insertMany(
    chunks.map((chunk, idx) => ({
      materialId: sample._id,
      departmentId: csDeptId,
      courseCode: "CSE 201",
      chunkText: chunk,
      chunkIndex: idx,
    })),
  );

  const more = [
    {
      title: "Operating Systems — Slides",
      type: "PPT",
      course: "Operating Systems",
      courseCode: "CSE 303",
      semester: "Year 3 · Semester I",
      sizeLabel: "8.4 MB",
      departmentId: csDeptId,
      downloadCount: 12,
    },
    {
      title: "IT Networks — Past Exam 2024",
      type: "PDF",
      course: "Computer Networks",
      courseCode: "ITT 305",
      semester: "Year 3 · Semester II",
      sizeLabel: "1.1 MB",
      departmentId: itDept?._id ?? csDeptId,
      downloadCount: 5,
    },
    {
      title: "Software Engineering — Project Guidelines",
      type: "DOC",
      course: "Software Engineering",
      courseCode: "SWE 301",
      semester: "Year 3 · Semester II",
      sizeLabel: "620 KB",
      departmentId: swDept?._id ?? csDeptId,
      downloadCount: 3,
    },
  ];

  await Material.insertMany(
    more.map((r) => ({
      ...r,
      uploadedById: uploaderId,
      expiryDate: expiry,
    })),
  );

  console.info(`[seed] 1 indexed PDF + ${more.length} more materials`);
}

async function seedUserData(studentId: Types.ObjectId) {
  if (await UserProgress.exists({ userId: studentId })) {
    console.info("[seed] user progress already exists — skipped");
    return;
  }

  await UserProgress.create({
    userId: studentId,
    currentStreakDays: 5,
    longestStreakDays: 12,
    weeklyActivity: [2, 3, 1, 4, 2, 0, 3],
    weeklyMinutes: 420,
    materialsRead: 18,
  });

  await CourseProgress.insertMany([
    { userId: studentId, course: "CSE 201", percent: 72, hoursLabel: "14h" },
    { userId: studentId, course: "CSE 202", percent: 45, hoursLabel: "8h" },
    { userId: studentId, course: "CSE 303", percent: 30, hoursLabel: "5h" },
  ]);

  const badges = await Badge.find({ slug: { $in: ["streak-7", "first-kit"] } }).lean();
  if (badges.length) {
    await UserBadge.insertMany(
      badges.map((b) => ({ userId: studentId, badgeId: b._id, earnedAt: new Date() })),
    );
  }

  await Notification.insertMany([
    {
      userId: studentId,
      title: "Welcome to StudyKit",
      body: "Upload your first PDF or paste a YouTube link to build a study kit.",
      type: "system",
      read: false,
    },
    {
      userId: studentId,
      title: "Streak reminder",
      body: "You are on a 5-day study streak. Keep it up!",
      type: "system",
      read: false,
    },
  ]);

  await ChatMessage.insertMany([
    {
      userId: studentId,
      role: "user",
      text: "Explain Big-O notation for binary search.",
    },
    {
      userId: studentId,
      role: "ai",
      text: "Binary search runs in O(log n) time because each step halves the search space.",
    },
  ]);

  console.info("[seed] progress, notifications, chat for demo student");
}

async function seedDemoStudyKits(
  professorId: Types.ObjectId,
  studentId: Types.ObjectId,
  csDeptId: Types.ObjectId,
) {
  const existing = await StudyKit.countDocuments({ isPublic: true });
  if (existing >= 2) {
    console.info("[seed] public study kits already exist — skipped");
    return;
  }

  const algoText = [
    "Big-O notation describes the upper bound of an algorithm's runtime.",
    "Binary search runs in O(log n). Merge sort is O(n log n). Quicksort averages O(n log n).",
    "Hash tables offer expected O(1) operations. BFS finds shortest paths in unweighted graphs.",
    "Dijkstra's algorithm handles non-negative edge weights. Dynamic programming breaks problems into subproblems.",
  ].join("\n");

  const photoText = [
    "Photosynthesis converts light energy into chemical energy in chloroplasts.",
    "The light reactions produce ATP and NADPH in the thylakoid membrane.",
    "The Calvin cycle fixes CO2 into glucose in the stroma.",
    "Chlorophyll absorbs red and blue light; green light is reflected.",
    "Factors affecting rate: light intensity, CO2 concentration, and temperature.",
  ].join("\n");

  const algoKit = await StudyKit.create({
    userId: professorId,
    title: "CSE 201 — Algorithms (public demo)",
    description: "Sample public kit for the shared library",
    sourceType: "topic",
    language: "en",
    isPublic: true,
    sharedDepartmentId: csDeptId,
    sourceMeta: { topicPrompt: "University algorithms midterm" },
    flashcardCount: 8,
    quizQuestionCount: 5,
    hasSummary: true,
    hasGuide: true,
  });

  await AiContext.insertMany(
    chunkText(algoText, 500).map((chunkText, idx) => ({
      studyKitId: algoKit._id,
      departmentId: csDeptId,
      chunkText,
      chunkIndex: idx,
    })),
  );

  const algoCards = [
    { front: "What is Big-O?", back: "Upper bound on growth rate of an algorithm vs input size." },
    { front: "Binary search time?", back: "O(log n) — halving search space each step." },
    { front: "Merge sort time?", back: "O(n log n), stable divide-and-conquer sort." },
    { front: "Worst case quicksort?", back: "O(n²) with bad pivot choice." },
    { front: "Hash table lookup?", back: "Expected O(1) with low load factor." },
    { front: "BFS use case?", back: "Shortest path in unweighted graphs." },
    { front: "Dijkstra requirement?", back: "Non-negative edge weights." },
    { front: "DP idea?", back: "Solve overlapping subproblems and reuse results." },
  ];
  await Flashcard.insertMany(
    algoCards.map((c) => ({ ...c, studyKitId: algoKit._id, userId: professorId })),
  );

  await QuizQuestion.insertMany([
    {
      studyKitId: algoKit._id,
      type: "mc",
      prompt: "Average time for merge sort?",
      choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      answer: "O(n log n)",
      explanation: "Merge sort always runs in O(n log n).",
      difficulty: "medium",
    },
    {
      studyKitId: algoKit._id,
      type: "tf",
      prompt: "Binary search works on unsorted arrays.",
      choices: ["True", "False"],
      answer: "False",
      explanation: "The array must be sorted.",
      difficulty: "easy",
    },
    {
      studyKitId: algoKit._id,
      type: "short",
      prompt: "What does BFS stand for?",
      choices: [],
      answer: "Breadth-first search",
      difficulty: "easy",
    },
    {
      studyKitId: algoKit._id,
      type: "mc",
      prompt: "Hash table average lookup?",
      choices: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      answer: "O(1)",
      difficulty: "medium",
    },
    {
      studyKitId: algoKit._id,
      type: "short",
      prompt: "Dijkstra cannot handle ___ edge weights.",
      choices: [],
      answer: "negative",
      difficulty: "hard",
    },
  ]);

  await Summary.create({
    studyKitId: algoKit._id,
    content:
      "## Algorithms overview\n\n- **Big-O** measures worst-case growth.\n- **Binary search** needs sorted data.\n- **Merge sort** is stable O(n log n).\n- **Graphs**: BFS for unweighted shortest paths; Dijkstra for weighted.",
    language: "en",
  });

  await StudyGuide.create({
    studyKitId: algoKit._id,
    content:
      "## Overview\nCore CS2 algorithms for Ethiopian university exams.\n\n## Key Concepts\nSorting, searching, graphs, dynamic programming.\n\n## Practice Questions\n1. Prove merge sort is O(n log n).\n2. When does quicksort degrade?",
    language: "en",
  });

  const photoKit = await StudyKit.create({
    userId: studentId,
    title: "Photosynthesis — Biology demo",
    description: "Typed-topic kit example",
    sourceType: "topic",
    language: "en",
    isPublic: true,
    sharedDepartmentId: csDeptId,
    sourceMeta: { topicPrompt: "Photosynthesis for freshman biology" },
    flashcardCount: 8,
    quizQuestionCount: 5,
    hasSummary: true,
    hasGuide: true,
  });

  await AiContext.insertMany(
    chunkText(photoText, 500).map((chunkText, idx) => ({
      studyKitId: photoKit._id,
      departmentId: csDeptId,
      chunkText,
      chunkIndex: idx,
    })),
  );

  await Flashcard.insertMany(
    [
      { front: "Where does photosynthesis occur?", back: "Chloroplasts in plant cells." },
      { front: "Products of light reactions?", back: "ATP and NADPH." },
      { front: "Calvin cycle location?", back: "Stroma of the chloroplast." },
      { front: "Primary pigment?", back: "Chlorophyll a." },
    ].map((c) => ({ ...c, studyKitId: photoKit._id, userId: studentId })),
  );

  photoKit.flashcardCount = 4;
  await photoKit.save();

  console.info("[seed] 2 public demo study kits (Algorithms + Photosynthesis)");
}

async function main() {
  await connectDatabase();
  await seedDepartments();
  await seedPlans();
  await seedBadges();

  const users = await seedUsers();
  if (!users?.professor || !users.student || !users.csDept) {
    console.warn("[seed] missing demo users — aborting material/progress seeding");
    await disconnectDatabase();
    return;
  }

  await seedCoursesForCs(users.csDept._id);
  await seedMaterials(users.professor._id, users.csDept._id);
  await seedUserData(users.student._id);
  await seedDemoStudyKits(users.professor._id, users.student._id, users.csDept._id);

  await disconnectDatabase();
  console.info("[seed] done");
  console.info(`[seed] sign in:`);
  console.info(`  student   → ${DEMO_STUDENT} / ${DEMO_PASSWORD}`);
  console.info(`  professor → ${DEMO_PROFESSOR} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
