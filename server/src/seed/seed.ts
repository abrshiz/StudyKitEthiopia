/**
 * Seeds reference + demo data for local development.
 * Run: npm run seed --prefix server
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import {
  AiContext,
  Badge,
  ChatMessage,
  CourseProgress,
  Course,
  Department,
  Material,
  Notification,
  Plan,
  SupportTicket,
  User,
  UserBadge,
  UserProgress,
} from "../models/index.js";
import { detectRoleFromEmail } from "../utils/role-from-email.js";
import { chunkText } from "../services/ai-context.service.js";

const DEMO_PASSWORD = "StudyKit123!";
const DEMO_STUDENT = "student@aau.edu.et";
const DEMO_ADMIN = "admin@aau.edu.et";
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
      features: ["5 downloads/day", "Basic AI chat", "Single department"],
      sortOrder: 0,
    },
    {
      slug: "student",
      name: "Student",
      price: 99,
      period: "month",
      popular: true,
      features: [
        "50 downloads/day",
        "Unlimited AI chat",
        "All departments",
        "Watermarked PDFs",
      ],
      sortOrder: 1,
    },
    {
      slug: "premium",
      name: "Premium",
      price: 299,
      period: "month",
      features: [
        "Everything in Student",
        "Priority AI",
        "Past exams archive",
        "Email support",
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
    { slug: "first-download", name: "First Download", icon: "📥", description: "First material" },
    { slug: "quiz-master", name: "Quiz Master", icon: "🧠", description: "10 quizzes" },
    { slug: "night-owl", name: "Night Owl", icon: "🌙", description: "Study after 10 PM" },
    { slug: "streak-30", name: "30-Day Streak", icon: "⚡", description: "30 day streak" },
    {
      slug: "materials-100",
      name: "100 Materials",
      icon: "📚",
      description: "100 materials opened",
    },
    { slug: "downloader-bronze", name: "Bronze Scholar", icon: "🥉", description: "10 downloads" },
    { slug: "downloader-silver", name: "Silver Scholar", icon: "🥈", description: "50 downloads" },
    { slug: "downloader-gold", name: "Gold Scholar", icon: "🥇", description: "100 downloads" },
  ]);
  console.info("[seed] badges");
}

async function upsertUser(email: string, fields: Record<string, unknown>) {
  // Use findOneAndUpdate({upsert:true}) so we don't crash on existing
  // demo users (likely from a previous schema). Existing fields are
  // overwritten with the canonical demo values; missing fields are filled.
  return User.findOneAndUpdate(
    { email },
    { $set: fields, $setOnInsert: { email } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedUsers() {
  const csDept = await Department.findOne({ name: "Computer Science" });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const student = await upsertUser(DEMO_STUDENT, {
    name: "Demo Student",
    passwordHash: hash,
    role: detectRoleFromEmail(DEMO_STUDENT),
    approvalStatus: "approved",
    approvedAt: new Date(),
    university: "Addis Ababa University",
    year: "Year 2",
    departmentId: csDept?._id ?? null,
    subscription: { plan: "free", dailyDownloadsLeft: 5 },
  });

  const professor = await upsertUser(DEMO_PROFESSOR, {
    name: "Prof. Tewodros (CS)",
    passwordHash: hash,
    role: "professor",
    approvalStatus: "approved",
    approvedAt: new Date(),
    university: "Addis Ababa University",
    departmentId: csDept?._id ?? null,
    professorDepartmentId: csDept?._id ?? null,
  });

  const admin = await upsertUser(DEMO_ADMIN, {
    name: "StudyKit Admin",
    passwordHash: hash,
    role: "admin",
    approvalStatus: "approved",
    approvedAt: new Date(),
    university: "Addis Ababa University",
  });

  console.info("[seed] demo users upserted (password: StudyKit123!)");
  return { student, professor, admin, csDept };
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

  // Synthetic AI context so the chat works without an actual PDF.
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
    chunks.map((chunkText, idx) => ({
      materialId: sample._id,
      departmentId: csDeptId,
      courseCode: "CSE 201",
      chunkText,
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

  const badges = await Badge.find({ slug: { $in: ["streak-7", "first-download"] } }).lean();
  if (badges.length) {
    await UserBadge.insertMany(
      badges.map((b) => ({ userId: studentId, badgeId: b._id, earnedAt: new Date() })),
    );
  }

  await Notification.insertMany([
    {
      userId: studentId,
      title: "New material uploaded",
      body: "Algorithms lecture notes are now in your library.",
      type: "material",
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

async function seedTickets(studentId: Types.ObjectId, csDeptId: Types.ObjectId) {
  if ((await SupportTicket.countDocuments()) > 0) {
    console.info("[seed] tickets already exist — skipped");
    return;
  }

  await SupportTicket.insertMany([
    {
      userId: studentId,
      subject: "Cannot open CSE 202 past exam",
      message: "The download keeps failing on my laptop. Mobile works fine.",
      status: "Open",
      departmentId: csDeptId,
    },
    {
      userId: studentId,
      subject: "AI assistant gave wrong answer for sorting",
      message: "It said bubble sort is O(n log n). Could you double-check?",
      status: "In progress",
      departmentId: csDeptId,
      adminResponse:
        "Thanks for reporting — looking into the chunking. Bubble sort is O(n^2) worst case.",
    },
  ]);
  console.info("[seed] 2 sample tickets");
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
  await seedTickets(users.student._id, users.csDept._id);

  await disconnectDatabase();
  console.info("[seed] done");
  console.info(`[seed] sign in:`);
  console.info(`  student   → ${DEMO_STUDENT} / ${DEMO_PASSWORD}`);
  console.info(`  professor → ${DEMO_PROFESSOR} / ${DEMO_PASSWORD}`);
  console.info(`  admin     → ${DEMO_ADMIN} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
