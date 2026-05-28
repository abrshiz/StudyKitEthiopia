import { useApiQuery } from "./use-api-query";
import { fetchCourses } from "@/lib/api/courses";
import { useAuth } from "@/context/auth-context";

export function useCourses(q: string) {
  const { department } = useAuth();
  return useApiQuery(
    ["courses", department?.id, q],
    () => fetchCourses({ departmentId: department?.id, q, active: true }),
    { staleTime: 60_000 },
  );
}
