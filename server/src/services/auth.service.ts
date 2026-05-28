import bcrypt from "bcryptjs";
import { Department, User } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { mapPublicUser, type PublicUser } from "../mappers/index.js";

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

  const passwordHash = await bcrypt.hash(input.password, 12);

  const created = await User.create({
    name: input.name.trim(),
    email,
    passwordHash,
    // Every signup is a student by default. Users can self-promote to
    // `professor` later to publish kits into the shared library.
    role: "student",
    phone: input.phone,
    university: inferUniversityFromEmail(email),
    year: "Year 1",
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

  return toSessionUser(mapPublicUser(user.toObject()));
}

/**
 * Idempotent upsert for OAuth (Microsoft) sign-ins.
 *
 * - Matches by `microsoftId` first, then by `email`.
 * - New accounts always start as `student` and are immediately usable —
 *   there is no admin approval gate.
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
    const created = await User.create({
      name: input.name?.trim() || email.split("@")[0],
      email,
      microsoftId: input.microsoftId,
      role: "student",
      university: inferUniversityFromEmail(email),
      year: "Year 1",
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

export async function setUserDepartment(
  userId: string,
  departmentId: string,
): Promise<SessionUser> {
  const dbUser = await User.findById(userId);
  if (!dbUser) throw new HttpError(401, "User not found");

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

/**
 * Promote the current user to `professor` so their uploads land in the
 * shared library. Idempotent — calling it on someone already a professor
 * is a no-op.
 */
export async function selfPromoteToProfessor(userId: string): Promise<SessionUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { role: "professor" },
    { new: true },
  )
    .populate(userPopulate)
    .lean();
  if (!user) throw new HttpError(404, "User not found");
  return toSessionUser(mapPublicUser(user));
}

function inferUniversityFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? "";
  const slug = domain.split(".")[0] ?? "university";
  if (slug === "edu" || slug === "university") return "Ethiopian University";
  return `${slug.toUpperCase()} University`;
}
