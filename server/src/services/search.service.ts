import { Department, Material } from "../models/index.js";
import { mapDepartment, mapMaterial } from "../mappers/index.js";

export async function globalSearch(q: string) {
  const regex = new RegExp(q.trim(), "i");
  const [materials, departments] = await Promise.all([
    Material.find({ $or: [{ title: regex }, { course: regex }] })
      .limit(6)
      .lean(),
    Department.find({ $or: [{ name: regex }, { college: regex }] })
      .limit(6)
      .lean(),
  ]);

  return {
    pages: [],
    materials: materials.map((m) => mapMaterial(m as never)),
    departments: departments.map((d) => mapDepartment(d as never)),
  };
}
