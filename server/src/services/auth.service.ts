import bcrypt from "bcryptjs";
import { Department, User } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { mapPublicUser } from "../mappers/index.js";
import { detectRoleFromEmail } from "../utils/role-from-email.js";

const userPopulate = { path: "departmentId", select: "name college" };

const EDU_ET = /^.+@(.+\.)?(edu\.et|university\.edu\.et)$/i;

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  if (!EDU_ET.test(input.email)) throw new HttpError(400, "Email must be a .edu.et address");

  const email = input.email.toLowerCase();
  const exists = await User.exists({ email });
  if (exists) throw new HttpError(409, "Email already registered");

  const role = detectRoleFromEmail(email);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role,
    approvalStatus: "pending",
    phone: input.phone,
    university: inferUniversityFromEmail(email),
    year: role === "student" ? "Year 1" : undefined,
  });

  const populated = await User.findById(user._id).populate(userPopulate).lean();
  return mapPublicUser(populated ?? user);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .populate(userPopulate);
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  if (user.approvalStatus === "pending") {
    throw new HttpError(403, "Your account is waiting for admin approval.");
  }
  if (user.approvalStatus === "rejected") {
    throw new HttpError(403, "Your registration was not approved. Contact your university admin.");
  }

  return mapPublicUser(user);
}

export async function getCurrentUser(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).populate(userPopulate).lean();
  if (!user) throw new HttpError(404, "User not found");
  return mapPublicUser(user);
}

export async function setUserDepartment(email: string, departmentId: string) {
  const dbUser = await User.findOne({ email: email.toLowerCase() });
  if (!dbUser) throw new HttpError(401, "User not found");
  if (dbUser.role !== "student") {
    throw new HttpError(400, "Only students select a study department");
  }

  const dept = await Department.findById(departmentId);
  if (!dept) throw new HttpError(404, "Department not found");

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { departmentId: dept._id },
    { new: true },
  )
    .populate(userPopulate)
    .lean();

  if (!user) throw new HttpError(401, "User not found");
  return mapPublicUser(user);
}

function inferUniversityFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? "";
  const slug = domain.split(".")[0] ?? "university";
  if (slug === "edu" || slug === "university") return "Ethiopian University";
  return `${slug.toUpperCase()} University`;
}
