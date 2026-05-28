/**
 * Seeds reference + demo data for local development.
 * Run: npm run seed --prefix server
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import {
  Badge,
  ChatMessage,
  CourseProgress,
  Department,
  Material,
  Notification,
  Plan,
  User,
  UserBadge,
  UserProgress,
} from "../models/index.js";
import { detectRoleFromEmail } from "../utils/role-from-email.js";

const DEMO_PASSWORD = "StudyKit123!";
const DEMO_STUDENT = "student@aau.edu.et";
const DEMO_ADMIN = "admin@aau.edu.et";
const DEMO_PROFESSOR = "professor@aau.edu.et";

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
  if (/Engineering|Architecture|Civil|Electrical|Software|Computer/.test(name))
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
  const count = await Plan.countDocuments();
  if (count > 0) return;

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
      price: 199,
      period: "month",
      popular: true,
      features: ["50 downloads/day", "Unlimited AI chat", "All departments", "Offline mode"],
      sortOrder: 1,
    },
    {
      slug: "semester",
      name: "Semester",
      price: 899,
      period: "semester",
      features: ["Everything in Student", "Priority AI", "Past exams archive"],
      sortOrder: 2,
    },
  ]);
  console.info("[seed] plans");
}

async function seedBadges() {
  const count = await Badge.countDocuments();
  if (count > 0) return;

  await Badge.insertMany([
    { slug: "streak-7", name: "7-Day Streak", icon: "🔥", description: "7 days in a row" },
    { slug: "first-download", name: "First Download", icon: "📥", description: "First material" },
    { slug: "quiz-master", name: "Quiz Master", icon: "🧠", description: "10 quizzes" },
    { slug: "night-owl", name: "Night Owl", icon: "🌙", description: "Study after 10 PM" },
    { slug: "streak-30", name: "30-Day Streak", icon: "⚡", description: "30 day streak" },
    { slug: "materials-100", name: "100 Materials", icon: "📚", description: "100 materials opened" },
  ]);
  console.info("[seed] badges");
}

async function seedUsers() {
  await User.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: "approved", approvedAt: new Date() } },
  );

  if (await User.exists({ email: DEMO_STUDENT })) {
    await User.updateMany(
      { email: { $in: [DEMO_STUDENT, DEMO_PROFESSOR, DEMO_ADMIN] } },
      { $set: { approvalStatus: "approved", approvedAt: new Date() } },
    );
    console.info("[seed] demo users already exist — ensured approved");
    const student = await User.findOne({ email: DEMO_STUDENT });
    const professor = await User.findOne({ email: DEMO_PROFESSOR });
    return student && professor ? { student, professor } : undefined;
  }

  const swDept = await Department.findOne({ name: "Software Engineering" });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [student, professor, admin] = await User.insertMany([
    {
      name: "Demo Student",
      email: DEMO_STUDENT,
      passwordHash: hash,
      role: detectRoleFromEmail(DEMO_STUDENT),
      approvalStatus: "approved",
      approvedAt: new Date(),
      university: "Addis Ababa University",
      year: "Year 2",
      departmentId: swDept?._id ?? null,
    },
    {
      name: "Demo Professor",
      email: DEMO_PROFESSOR,
      passwordHash: hash,
      role: detectRoleFromEmail(DEMO_PROFESSOR),
      approvalStatus: "approved",
      approvedAt: new Date(),
      university: "Addis Ababa University",
      departmentId: swDept?._id ?? null,
    },
    {
      name: "Demo Admin",
      email: DEMO_ADMIN,
      passwordHash: hash,
      role: detectRoleFromEmail(DEMO_ADMIN),
      approvalStatus: "approved",
      approvedAt: new Date(),
      university: "Addis Ababa University",
    },
  ]);

  console.info("[seed] demo users (password: StudyKit123!)");
  return { student, professor, admin, swDept };
}

async function seedMaterials(uploaderId: Types.ObjectId) {
  if ((await Material.countDocuments()) > 0) {
    console.info("[seed] materials already exist — skipped");
    return;
  }

  const departments = await Department.find({
    name: { $in: ["Software Engineering", "Computer Science", "Medicine (MD)"] },
  }).lean();

  const byName = Object.fromEntries(departments.map((d) => [d.name, d._id]));
  const swId = byName["Software Engineering"];
  const csId = byName["Computer Science"];
  const medId = byName["Medicine (MD)"];

  if (!swId || !csId || !medId) {
    console.warn("[seed] departments missing — skip materials");
    return;
  }

  const rows = [
    {
      title: "Introduction to Algorithms — Lecture Notes",
      type: "PDF",
      course: "CSE 201",
      semester: "Year 2 · Semester I",
      sizeLabel: "4.2 MB",
      departmentId: swId,
      downloadCount: 128,
    },
    {
      title: "Data Structures — Past Exam 2024",
      type: "PDF",
      course: "CSE 202",
      semester: "Year 2 · Semester I",
      sizeLabel: "1.1 MB",
      departmentId: swId,
      downloadCount: 89,
    },
    {
      title: "Software Engineering — Project Guidelines",
      type: "DOC",
      course: "SWE 301",
      semester: "Year 3 · Semester II",
      sizeLabel: "620 KB",
      departmentId: swId,
      downloadCount: 45,
    },
    {
      title: "Operating Systems — Slides",
      type: "PPT",
      course: "CSE 303",
      semester: "Year 3 · Semester I",
      sizeLabel: "8.4 MB",
      departmentId: csId,
      downloadCount: 201,
    },
    {
      title: "Database Systems — Final Exam",
      type: "PDF",
      course: "CSE 304",
      semester: "Year 3 · Semester II",
      sizeLabel: "2.3 MB",
      departmentId: csId,
      downloadCount: 156,
    },
    {
      title: "Anatomy I — Study Guide",
      type: "PDF",
      course: "MED 101",
      semester: "Year 1 · Semester I",
      sizeLabel: "6.7 MB",
      departmentId: medId,
      downloadCount: 72,
    },
  ] as const;

  await Material.insertMany(
    rows.map((r) => ({
      ...r,
      uploadedById: uploaderId,
      fileUrl: "",
    })),
  );
  console.info(`[seed] ${rows.length} materials`);
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
    { userId: studentId, course: "SWE 301", percent: 30, hoursLabel: "5h" },
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
      body: "Data Structures — Past Exam 2024 is now in your library.",
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
    {
      userId: studentId,
      title: "Student plan",
      body: "Upgrade to unlock unlimited AI chat and offline mode.",
      type: "billing",
      read: true,
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

async function main() {
  await connectDatabase();
  await seedDepartments();
  await seedPlans();
  await seedBadges();

  const users = await seedUsers();
  if (users?.professor && users.student) {
    await seedMaterials(users.professor._id);
    await seedUserData(users.student._id);
  }

  await disconnectDatabase();
  console.info("[seed] done");
  console.info(`[seed] sign in: ${DEMO_STUDENT} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
