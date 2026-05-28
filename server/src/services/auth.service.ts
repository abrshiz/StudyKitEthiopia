import bcrypt from "bcryptjs";
import { Department, User } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { mapPublicUser, type PublicUser } from "../mappers/index.js";
import { detectRoleFromEmail } from "../utils/role-from-email.js";

const userPopulate = { path: "departmentId", select: "name college" };

/** Exact regex from the product spec — accepts any subdomain of edu.et. */
const EDU_ET = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*(edu\.et|university\.edu\.et)$/;

export type SessionUser = PublicUser & { _id: string };

function toSessionUser(user: PublicUser): SessionUser {
  return { ...user, _id: user.id };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<SessionUser> {
  if (!EDU_ET.test(input.email))
    throw new HttpError(400, "Email must be a .edu.et university address");

  const email = input.email.toLowerCase();
  const exists = await User.exists({ email });
  if (exists) throw new HttpError(409, "Email already registered");

  const role = detectRoleFromEmail(email);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const created = await User.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role,
    approvalStatus: "pending",
    phone: input.phone,
    university: inferUniversityFromEmail(email),
    year: role === "student" ? "Year 1" : undefined,
  });

  const populated = await User.findById(created._id).populate(userPopulate).lean();
  if (!populated) throw new HttpError(500, "Failed to load new user");
  return toSessionUser(mapPublicUser(populated));
}

export async function loginUser(email: string, password: string): Promise<SessionUser> {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .populate(userPopulate);
  if (!user || !user.passwordHash) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  if (user.approvalStatus === "pending") {
    throw new HttpError(403, "Your account is waiting for admin approval.");
  }
  if (user.approvalStatus === "rejected") {
    throw new HttpError(403, "Your registration was not approved. Contact your university admin.");
  }

  return toSessionUser(mapPublicUser(user.toObject()));
}

/**
 * Idempotent upsert for OAuth (Microsoft) sign-ins.
 *
 * - Matches by `microsoftId` first, then by `email`.
 * - New accounts inherit the role detected from the email and start in
 *   `approvalStatus: 'pending'` so admins still gate access.
 */
export async function upsertOAuthUser(input: {
  email: string;
  name: string;
  microsoftId: string;
}): Promise<SessionUser> {
  const email = input.email.toLowerCase();
  if (!EDU_ET.test(email)) {
    throw new HttpError(400, "Only .edu.et accounts can sign in with Microsoft");
  }

  let user = await User.findOne({ microsoftId: input.microsoftId }).populate(userPopulate);
  if (!user) {
    user = await User.findOne({ email }).populate(userPopulate);
  }

  if (user) {
    if (!user.microsoftId) {
      user.microsoftId = input.microsoftId;
      await user.save();
    }
  } else {
    const role = detectRoleFromEmail(email);
    const created = await User.create({
      name: input.name?.trim() || email.split("@")[0],
      email,
      microsoftId: input.microsoftId,
      role,
      approvalStatus: "pending",
      university: inferUniversityFromEmail(email),
      year: role === "student" ? "Year 1" : undefined,
    });
    const loaded = await User.findById(created._id).populate(userPopulate);
    if (!loaded) throw new HttpError(500, "Failed to load new OAuth user");
    user = loaded;
  }

  return toSessionUser(mapPublicUser(user.toObject()));
}

export async function getCurrentUser(idOrEmail: string): Promise<SessionUser> {
  const query = idOrEmail.includes("@")
    ? { email: idOrEmail.toLowerCase() }
    : { _id: idOrEmail };
  const user = await User.findOne(query).populate(userPopulate).lean();
  if (!user) throw new HttpError(404, "User not found");
  return toSessionUser(mapPublicUser(user));
}

export async function setUserDepartment(userId: string, departmentId: string): Promise<SessionUser> {
  const dbUser = await User.findById(userId);
  if (!dbUser) throw new HttpError(401, "User not found");
  if (dbUser.role !== "student") {
    throw new HttpError(400, "Only students select a study department");
  }

  const dept = await Department.findById(departmentId);
  if (!dept) throw new HttpError(404, "Department not found");

  const user = await User.findByIdAndUpdate(
    userId,
    { departmentId: dept._id },
    { new: true },
  )
    .populate(userPopulate)
    .lean();

  if (!user) throw new HttpError(401, "User not found");
  return toSessionUser(mapPublicUser(user));
}

function inferUniversityFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? "";
  const slug = domain.split(".")[0] ?? "university";
  if (slug === "edu" || slug === "university") return "Ethiopian University";
  return `${slug.toUpperCase()} University`;
}
