export type Assessment = {
  id: string;
  name: string;
  kind: string;
  max_marks: number;
  assessment_date: string | null;
  description: string | null;
  sort_order: number;
};

export type Student = {
  id: string;
  name: string;
  roll: string;
  email: string | null;
  user_id: string | null;
};

export type GradeStep = { grade: string; min: number };
export type Weights = Record<string, number>;

export const DEFAULT_KINDS = ["CT", "Quiz", "Presentation", "Midterm", "Final"] as const;
export const ASSESSMENT_KINDS = [
  "CT",
  "Quiz",
  "Presentation",
  "Midterm",
  "Final",
  "Assignment",
  "Lab",
  "Viva",
  "Project",
  "Participation",
] as const;

export type AttendanceStat = {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
};

export function emptyAttendance(total = 0): AttendanceStat {
  return { total, present: 0, late: 0, absent: 0, percentage: 0 };
}

/** Late counts as half a class present. */
export function attendancePercentage(s: Omit<AttendanceStat, "percentage">): number {
  if (!s.total) return 0;
  return ((s.present + s.late * 0.5) / s.total) * 100;
}

export function letterGrade(percentage: number, scale: GradeStep[]): string {
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  for (const step of sorted) if (percentage >= step.min) return step.grade;
  return sorted[sorted.length - 1]?.grade ?? "F";
}

export type ComponentResult = {
  kind: string;
  weight: number;
  obtained: number;
  max: number;
  weighted: number;
};

export type StudentResult = {
  components: ComponentResult[];
  rawTotal: number;
  rawMax: number;
  percentage: number;
  grade: string;
  attendance: AttendanceStat;
};

export function computeResult(opts: {
  assessments: Assessment[];
  scores: Record<string, number | null>;
  attendance: AttendanceStat;
  weights: Weights;
  scale: GradeStep[];
}): StudentResult {
  const { assessments, scores, attendance, weights, scale } = opts;
  const kinds = new Set<string>(assessments.map((a) => a.kind));
  const components: ComponentResult[] = [];

  const attWeight = Number(weights["Attendance"] ?? 0);
  if (attWeight > 0 && attendance.total > 0) {
    components.push({
      kind: "Attendance",
      weight: attWeight,
      obtained: attendance.percentage,
      max: 100,
      weighted: (attendance.percentage / 100) * attWeight,
    });
  }

  for (const kind of kinds) {
    const items = assessments.filter((a) => a.kind === kind);
    const max = items.reduce((sum, a) => sum + Number(a.max_marks), 0);
    const obtained = items.reduce((sum, a) => sum + Number(scores[a.id] ?? 0), 0);
    const weight = Number(weights[kind] ?? 0);
    components.push({
      kind,
      weight,
      obtained,
      max,
      weighted: max > 0 ? (obtained / max) * weight : 0,
    });
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = components.reduce((sum, c) => sum + c.weighted, 0);
  const percentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  const rawMax = assessments.reduce((sum, a) => sum + Number(a.max_marks), 0);
  const rawTotal = assessments.reduce((sum, a) => sum + Number(scores[a.id] ?? 0), 0);

  return {
    components,
    rawTotal,
    rawMax,
    percentage,
    grade: totalWeight > 0 ? letterGrade(percentage, scale) : "—",
    attendance,
  };
}

export function gradeTone(grade: string): "good" | "mid" | "low" | "fail" {
  if (grade.startsWith("A")) return "good";
  if (grade.startsWith("B")) return "mid";
  if (grade === "F") return "fail";
  return "low";
}

export function generateClassCode(subject: string, section: string): string {
  const initials =
    subject
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4) || "CLS";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  const sec = (section || "X").replace(/\s+/g, "").toUpperCase().slice(0, 2);
  return `${initials}-${sec}${suffix}`;
}

export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}
