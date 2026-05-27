// Mock data for the Ethiopian University Study Kit platform

export const universities = [
  "Addis Ababa University",
  "Adama Science & Technology",
  "Bahir Dar University",
  "Jimma University",
  "Mekelle University",
  "Hawassa University",
  "Gondar University",
  "Haramaya University",
];

// Sample of 231 departments across colleges
const deptSeeds = [
  // Engineering & Tech
  "Software Engineering", "Computer Science", "Information Systems", "Information Technology",
  "Electrical Engineering", "Electromechanical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Chemical Engineering", "Industrial Engineering", "Mining Engineering",
  "Aerospace Engineering", "Biomedical Engineering", "Environmental Engineering",
  "Architecture", "Urban Planning", "Geomatics Engineering", "Petroleum Engineering",
  "Materials Engineering", "Manufacturing Engineering", "Telecommunication Engineering",
  // Health Sciences
  "Medicine (MD)", "Pharmacy", "Nursing", "Midwifery", "Public Health", "Anesthesia",
  "Medical Laboratory", "Radiology", "Dental Medicine", "Veterinary Medicine",
  "Physiotherapy", "Optometry", "Health Informatics", "Epidemiology", "Nutrition & Dietetics",
  // Natural & Computational Sciences
  "Mathematics", "Statistics", "Physics", "Chemistry", "Biology", "Biotechnology",
  "Geology", "Geophysics", "Meteorology", "Sport Science", "Astronomy", "Marine Sciences",
  // Agriculture
  "Plant Science", "Animal Science", "Horticulture", "Agricultural Economics",
  "Soil Science", "Forestry", "Fisheries", "Food Science", "Rural Development",
  "Crop Protection", "Agribusiness Management", "Range Ecology",
  // Business & Economics
  "Accounting", "Finance", "Marketing", "Management", "Economics", "Banking & Insurance",
  "Logistics & Supply Chain", "Tourism Management", "Hotel Management", "Project Management",
  "Public Administration", "Human Resource Management", "International Business",
  // Social Sciences & Humanities
  "Sociology", "Psychology", "Anthropology", "History", "Geography", "Political Science",
  "Philosophy", "Theology", "Archaeology", "Demography", "Social Work", "Gender Studies",
  // Language & Communication
  "English Literature", "Amharic Language", "Afaan Oromo", "Tigrigna", "Linguistics",
  "Journalism", "Media & Communication", "Foreign Languages", "Translation Studies",
  // Education
  "Educational Planning", "Curriculum Studies", "Special Needs Education",
  "Adult Education", "Early Childhood Education", "Educational Psychology",
  // Law
  "Law (LLB)", "Federal Law", "Constitutional Law", "Criminal Justice",
  // Arts
  "Theatre Arts", "Music", "Fine Arts", "Film & Television", "Graphic Design",
  "Industrial Design", "Fashion Design",
];

export const departments = Array.from({ length: 231 }, (_, i) => {
  const base = deptSeeds[i % deptSeeds.length];
  const suffix = i >= deptSeeds.length ? ` ${Math.floor(i / deptSeeds.length) + 1}` : "";
  return {
    id: `dept-${i + 1}`,
    name: base + suffix,
    college: pickCollege(base),
    students: 200 + ((i * 73) % 4800),
  };
});

function pickCollege(name: string): string {
  if (/Engineering|Architecture|Mining|Aerospace|Materials|Manufacturing|Telecom/.test(name)) return "Engineering & Technology";
  if (/Medicine|Pharmacy|Nursing|Midwifery|Health|Anesthesia|Laboratory|Radiology|Dental|Veterinary|Physiotherapy|Optometry|Epidemiology|Nutrition/.test(name)) return "Health Sciences";
  if (/Mathematics|Statistics|Physics|Chemistry|Biology|Biotech|Geology|Geophysics|Meteorology|Sport|Astronomy|Marine/.test(name)) return "Natural Sciences";
  if (/Plant|Animal|Horticulture|Agric|Soil|Forest|Fish|Food|Rural|Crop|Range/.test(name)) return "Agriculture";
  if (/Accounting|Finance|Marketing|Management|Economics|Banking|Logistics|Tourism|Hotel|Project|Admin|Resource|Business/.test(name)) return "Business & Economics";
  if (/Law/.test(name)) return "Law";
  if (/Education|Curriculum/.test(name)) return "Education";
  if (/Theatre|Music|Arts|Film|Design|Fashion/.test(name)) return "Arts";
  if (/Language|Literature|Amharic|Oromo|Tigrigna|Linguistics|Journalism|Media|Translation/.test(name)) return "Language & Communication";
  return "Social Sciences & Humanities";
}

export const materials = [
  { id: "m1", title: "Data Structures — Trees & Graphs", type: "PDF", course: "CS-2030", semester: "Year 2 · Sem 1", size: "4.2 MB", updated: "2 days ago", downloads: 1240 },
  { id: "m2", title: "Operating Systems Lecture 7", type: "PPT", course: "CS-3110", semester: "Year 3 · Sem 1", size: "12.8 MB", updated: "5 hours ago", downloads: 892 },
  { id: "m3", title: "Database Systems — Final Notes", type: "PDF", course: "CS-3020", semester: "Year 3 · Sem 2", size: "8.1 MB", updated: "Yesterday", downloads: 2104 },
  { id: "m4", title: "Discrete Math — Practice Set", type: "PDF", course: "MATH-2010", semester: "Year 2 · Sem 1", size: "1.7 MB", updated: "1 week ago", downloads: 678 },
  { id: "m5", title: "Software Engineering — UML Guide", type: "DOC", course: "SE-3050", semester: "Year 3 · Sem 1", size: "2.3 MB", updated: "3 days ago", downloads: 534 },
  { id: "m6", title: "Computer Networks — TCP/IP Deep Dive", type: "PDF", course: "CS-4010", semester: "Year 4 · Sem 1", size: "6.6 MB", updated: "Today", downloads: 318 },
];

export const aiSuggestions = [
  "Summarize Chapter 4 of Operating Systems",
  "Quiz me on Database Normalization",
  "Explain B+ trees with a simple example",
  "Generate flashcards from Networks lecture",
];

export const badges = [
  { name: "7-Day Streak", icon: "🔥", earned: true },
  { name: "First Download", icon: "📥", earned: true },
  { name: "Quiz Master", icon: "🧠", earned: true },
  { name: "Night Owl", icon: "🌙", earned: false },
  { name: "30-Day Streak", icon: "⚡", earned: false },
  { name: "100 Materials", icon: "📚", earned: false },
];

export const plans = [
  { id: "free", name: "Free", price: 0, period: "forever", features: ["5 downloads/day", "Basic AI chat (10 msgs)", "Single department", "Ads supported"] },
  { id: "student", name: "Student", price: 199, period: "month", popular: true, features: ["50 downloads/day", "Unlimited AI chat", "All departments", "Offline mode", "No ads"] },
  { id: "semester", name: "Semester", price: 899, period: "semester", features: ["Everything in Student", "Priority AI model", "Group study rooms", "Past exam archive", "Save 25%"] },
];
