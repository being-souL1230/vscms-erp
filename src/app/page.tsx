"use client";
import { useState, useEffect } from "react";
import type {
  UserRole,
  User,
  Course,
  AttendanceRecord,
  GradeRecord,
  FeeRecord,
  FeeStructure,
  FeePayment,
  Assignment,
  AssignmentSubmission,
  TimetableSlot,
  Notice,
  Department,
  LeaveRequest,
  AdmissionInfo,
  StudentDocument,
  Enrollment,
  Section,
  SemesterInfo,
  AcademicSession,
  ExamSchedule,
  ExamDefinition,
  InternalMark,
  PermissionRow,
  FacultyAttendance,
  CourseMaterial,
} from "@/types/erp";
import { initialCourseMaterials } from "@/lib/seed-data";
import {
  Navbar,
  Sidebar,
  LoginPage,
  Ticker,
  ToastContainer,
  PROFILES,
} from "@/components/shell";
import type { ToastMessage } from "@/components/shell";
import {
  AdminDashboard,
  FacultyDashboard,
  StudentDashboard,
} from "@/components/dashboards";
import { CMSbot } from "@/components/cmsbot";
import type { IdVerificationRecord } from "@/components/features";

type AppData = {
  students: User[];
  faculty: User[];
  courses: Course[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  fees: FeeRecord[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  notices: Notice[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  timetable: TimetableSlot[];
  departments: Department[];
  leaves: LeaveRequest[];
  admissions: AdmissionInfo[];
  documents: StudentDocument[];
  sections: Section[];
  semesters: SemesterInfo[];
  sessions: AcademicSession[];
  exams: ExamSchedule[];
  examDefs: ExamDefinition[];
  internalMarks: InternalMark[];
  permissions: PermissionRow[];
  allUsers: User[];
  enrollments: Enrollment[];
  facultyAttendance: FacultyAttendance[];
  courseMaterials: CourseMaterial[];
};

/**
 * fetch with retry: retries network failures and 5xx responses. The backend
 * can be briefly unavailable while it wakes up after Render's free-tier idle
 * sleep or a local restart, and a couple of retries cover that window.
 * 401/403/404/429 are treated as final and returned as-is (auth errors are
 * not transient, and retrying a rate-limit would only make it worse).
 */
async function fetchJson(url: string, init?: RequestInit, attempts = 2): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (
        res.ok ||
        res.status === 401 ||
        res.status === 403 ||
        res.status === 404 ||
        res.status === 429
      )
        return res.json().catch(() => null);
      lastErr = new Error(`${url} returned ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function fetchAllData(force = false, attempt = 0): Promise<AppData> {
  try {
    if (force) {
      await fetchJson("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
    }
    const [s, f, c, a, g, fe, n, as, tt, dp, lv, ad, dc, se, sm, ss, ex, em, im, pm, us, en, fa, fst, fp, cm] = await Promise.all([
      fetchJson("/api/students"),
      fetchJson("/api/faculty"),
      fetchJson("/api/courses"),
      fetchJson("/api/attendance"),
      fetchJson("/api/grades"),
      fetchJson("/api/fees"),
      fetchJson("/api/notices"),
      fetchJson("/api/assignments"),
      fetchJson("/api/timetable"),
      fetchJson("/api/departments"),
      fetchJson("/api/leaves"),
      fetchJson("/api/admissions"),
      fetchJson("/api/documents"),
      fetchJson("/api/sections"),
      fetchJson("/api/semesters"),
      fetchJson("/api/sessions"),
      fetchJson("/api/exams"),
      fetchJson("/api/exam-master"),
      fetchJson("/api/internal-marks"),
      fetchJson("/api/permissions"),
      fetchJson("/api/users"),
      fetchJson("/api/enrollments"),
      fetchJson("/api/faculty-attendance"),
      fetchJson("/api/fee-structures"),
      fetchJson("/api/fee-payments"),
      fetchJson("/api/course-materials"),
    ]);
  return {
    students: Array.isArray(s) ? s : [],
    faculty: Array.isArray(f) ? f : [],
    courses: Array.isArray(c) ? c : [],
    attendance: Array.isArray(a) ? a : [],
    grades: Array.isArray(g) ? g : [],
    fees: Array.isArray(fe) ? fe : [],
    feeStructures: Array.isArray(fst) ? fst : [],
    feePayments: Array.isArray(fp) ? fp : [],
    notices: Array.isArray(n) ? n : [],
    assignments: Array.isArray(as?.assignments) ? as.assignments : [],
    submissions: Array.isArray(as?.submissions) ? as.submissions : [],
    timetable: Array.isArray(tt) ? tt : [],
    departments: Array.isArray(dp) ? dp : [],
    leaves: Array.isArray(lv) ? lv : [],
    admissions: Array.isArray(ad) ? ad : [],
    documents: Array.isArray(dc) ? dc : [],
    sections: Array.isArray(se) ? se : [],
    semesters: Array.isArray(sm) ? sm : [],
    sessions: Array.isArray(ss) ? ss : [],
    exams: Array.isArray(ex) ? ex : [],
    examDefs: Array.isArray(em) ? em : [],
    internalMarks: Array.isArray(im) ? im : [],
    permissions: Array.isArray(pm) ? pm : [],
    allUsers: Array.isArray(us) ? us : [],
    enrollments: Array.isArray(en) ? en : [],
    facultyAttendance: Array.isArray(fa) ? fa : [],
    courseMaterials: Array.isArray(cm) && cm.length > 0 ? cm : initialCourseMaterials,
    };
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 6000 * (attempt + 1)));
      return fetchAllData(force, attempt + 1);
    }
    throw e;
  }
}

export default function VscmsErpApp() {
  const [role, setRole] = useState<UserRole>("admin");
  const [user, setUser] = useState<User | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [tab, setTab] = useState<string>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  const [students, setStudents] = useState<User[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionInfo[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [examDefs, setExamDefs] = useState<ExamDefinition[]>([]);
  const [internalMarks, setInternalMarks] = useState<InternalMark[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [facultyAttendance, setFacultyAttendance] = useState<FacultyAttendance[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>(initialCourseMaterials);
  const [idVerifications, setIdVerifications] = useState<Record<string, IdVerificationRecord>>({
    "2024-BCA-001": {
      rollNo: "2024-BCA-001",
      studentName: "Aarav Rao",
      department: "Data Science",
      status: "verified",
      verifiedBy: "Dr. Aris Thorne (HOD Computer Science)",
      verifiedAt: "2026-08-18 10:30 AM",
    },
    "2024-BCA-002": {
      rollNo: "2024-BCA-002",
      studentName: "Priya Nair",
      department: "Computer Applications",
      status: "pending",
      requestedAt: "2026-08-18 09:15 AM",
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vscms_id_verifications");
        if (raw) {
          const parsed = JSON.parse(raw);
          setIdVerifications((prev) => ({ ...prev, ...parsed }));
        }
      } catch {}
    }
  }, []);

  const requestStudentVerification = (rollNo: string) => {
    const student = students.find((s) => s.rollNo === rollNo) || user;
    const newRecord: IdVerificationRecord = {
      rollNo,
      studentName: student?.name || "Student",
      department: student?.department || "General",
      status: "pending",
      requestedAt: new Date().toLocaleString(),
    };
    setIdVerifications((prev) => {
      const updated = { ...prev, [rollNo]: newRecord };
      if (typeof window !== "undefined") {
        try { localStorage.setItem("vscms_id_verifications", JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    toast("info", "Verification Requested", "Verification request sent to Faculty/Registrar.");
  };

  const approveStudentVerification = (rollNo: string, facultyName: string) => {
    const student = students.find((s) => s.rollNo === rollNo);
    const updatedRecord: IdVerificationRecord = {
      rollNo,
      studentName: student?.name || "Student",
      department: student?.department || "General",
      status: "verified",
      verifiedBy: facultyName,
      verifiedAt: new Date().toLocaleString(),
    };
    setIdVerifications((prev) => {
      const updated = { ...prev, [rollNo]: updatedRecord };
      if (typeof window !== "undefined") {
        try { localStorage.setItem("vscms_id_verifications", JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    toast("success", "ID Card Verified", `Student ${student?.name || rollNo} is now officially verified.`);
  };

  const rejectStudentVerification = (rollNo: string, reason: string) => {
    const student = students.find((s) => s.rollNo === rollNo);
    const updatedRecord: IdVerificationRecord = {
      rollNo,
      studentName: student?.name || "Student",
      department: student?.department || "General",
      status: "rejected",
      rejectReason: reason,
    };
    setIdVerifications((prev) => {
      const updated = { ...prev, [rollNo]: updatedRecord };
      if (typeof window !== "undefined") {
        try { localStorage.setItem("vscms_id_verifications", JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    toast("info", "Verification Flagged", `ID verification status for ${rollNo} updated.`);
  };

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (type: ToastMessage["type"], title: string, message: string) => {
    // Unique id only for list keys/timeout bookkeeping randomness is fine here.
    // eslint-disable-next-line react-hooks/purity
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((p) => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4600);
  };
  const dismiss = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  // Pushes a fresh AppData snapshot into all the module states. Used both on
  // initial mount and after login (login happens after the mount fetch ran
  // anonymously, so admin-only collections like users/permissions would stay
  // empty without this reload).
  const applyData = (data: AppData) => {
    setStudents(data.students);
    setFaculty(data.faculty);
    setCourses(data.courses);
    setAttendance(data.attendance);
    setGrades(data.grades);
    setFees(data.fees);
    setFeeStructures(data.feeStructures);
    setFeePayments(data.feePayments);
    setNotices(data.notices);
    setAssignments(data.assignments);
    setSubmissions(data.submissions);
    setTimetable(data.timetable);
    setDepartments(data.departments);
    setLeaves(data.leaves);
    setAdmissions(data.admissions);
    setDocuments(data.documents);
    setSections(data.sections);
    setSemesters(data.semesters);
    setSessions(data.sessions);
    setExams(data.exams);
    setExamDefs(data.examDefs);
    setInternalMarks(data.internalMarks);
    setPermissions(data.permissions);
    setAllUsers(data.allUsers);
    setEnrollments(data.enrollments);
    setFacultyAttendance(data.facultyAttendance);
    
    let localSaved: CourseMaterial[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vscms_course_materials");
        if (raw) localSaved = JSON.parse(raw);
      } catch {}
    }
    const combined = [...(data.courseMaterials || []), ...localSaved];
    const uniqueMap = new Map<number, CourseMaterial>();
    (combined.length ? combined : initialCourseMaterials).forEach((m) => {
      uniqueMap.set(m.id, m);
    });
    setCourseMaterials(Array.from(uniqueMap.values()));
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const session = await fetch("/api/auth/me");
        if (session.ok) {
          const { user: signedInUser } = await session.json();
          if (ignore) return;
          setUser(signedInUser);
          setRole(signedInUser.role);
          setLoggedIn(true);
        }
        const data = await fetchAllData();
        if (ignore) return;
        applyData(data);
      } catch (e) {
        console.error("load failed", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const switchRole = (r: UserRole) => {
    setTab("overview");
    setRole(r);
    setUser(PROFILES[r]);
    fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body?.user) setUser(body.user);
      })
      .catch(() => {});

    toast(
      "info",
      `Console - ${r}`,
      r === "admin"
        ? "Admin panel is now active."
        : r === "faculty"
          ? "Teacher desk ready for attendance and grades."
          : "Student view ready for attendance, grades and fees.",
    );
  };

  const reseed = async () => {
    setSeeding(true);
    try {
      const data = await fetchAllData(true);
      setStudents(data.students);
      setFaculty(data.faculty);
      setCourses(data.courses);
      setAttendance(data.attendance);
      setGrades(data.grades);
      setFees(data.fees);
      setFeeStructures(data.feeStructures);
      setFeePayments(data.feePayments);
      setNotices(data.notices);
      setAssignments(data.assignments);
      setSubmissions(data.submissions);
      setTimetable(data.timetable);
      setDepartments(data.departments);
      setLeaves(data.leaves);
      setAdmissions(data.admissions);
      setDocuments(data.documents);
      setSections(data.sections);
      setSemesters(data.semesters);
      setSessions(data.sessions);
      setExams(data.exams);
      setExamDefs(data.examDefs);
      setInternalMarks(data.internalMarks);
      setPermissions(data.permissions);
      setAllUsers(data.allUsers);
      setEnrollments(data.enrollments);
      setFacultyAttendance(data.facultyAttendance);
      toast("success", "Data refreshed", "The demo data has been reloaded.");
    } catch {
      toast("error", "Refresh failed", "Could not reload the data.");
    } finally {
      setSeeding(false);
    }
  };

  const addStudent = async (d: Partial<User>) => {
    const r = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    setStudents((p) => [c, ...p]);
    toast("success", "Student added", `${c.name} added to the list.`);
  };
  const updStudent = async (d: Partial<User>) => {
    const r = await fetch("/api/students", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    setStudents((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", "Student updated", "Student details saved.");
  };
  const delStudent = async (id: number) => {
    await fetch(`/api/students?id=${id}`, { method: "DELETE" });
    setStudents((p) => p.filter((x) => x.id !== id));
    toast("info", "Student removed", "Student deleted from the list.");
  };
  const addFaculty = async (d: Partial<User>) => {
    const r = await fetch("/api/faculty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    setFaculty((p) => [c, ...p]);
    toast("success", "Teacher added", `${c.name} added to the staff.`);
  };
  const updFaculty = async (d: Partial<User>) => {
    const r = await fetch("/api/faculty", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    setFaculty((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", "Teacher updated", "Staff details saved.");
  };
  const delFaculty = async (id: number) => {
    await fetch(`/api/faculty?id=${id}`, { method: "DELETE" });
    setFaculty((p) => p.filter((x) => x.id !== id));
    toast("info", "Teacher removed", "Staff member deleted.");
  };
  const addCourse = async (d: Partial<Course>) => {
    const r = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    setCourses((p) => [c, ...p]);
    toast("success", "Course added", `${c.code} added to the list.`);
  };
  const delCourse = async (id: number) => {
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
    setCourses((p) => p.filter((x) => x.id !== id));
    toast("info", "Course removed", "Course removed from the list.");
  };
  const addNotice = async (d: Partial<Notice>) => {
    const r = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json().catch(() => null);
    if (!r.ok) {
      toast("error", "Notice failed", (c && c.error) || `Server error (${r.status})`);
      return;
    }
    if (c && c.id) setNotices((p) => [c, ...p]);
    toast("success", "Notice posted", "Published to all users.");
  };
  const delNotice = async (id: number) => {
    await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
    setNotices((p) => p.filter((x) => x.id !== id));
    toast("info", "Notice removed", "Removed from the board.");
  };
  const payFee = async (id: number, amount?: number, method?: string) => {
    const r = await fetch("/api/fees", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, amount, paymentMethod: method }) });
    const u = await r.json();
    if (!u.id) {
      toast("error", "Payment failed", u.error || "Could not process payment.");
      return;
    }
    setFees((p) => p.map((x) => (x.id === u.id ? u : x)));
    const fresh = await fetch("/api/fee-payments").then((res) => res.json());
    if (Array.isArray(fresh)) setFeePayments(fresh);
    toast("success", "Payment recorded", `Receipt ${u.receiptNumber || "-"} saved.`);
  };
  const submitAtt = async (recs: Partial<AttendanceRecord>[]) => {
    await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recs) });
    const fresh = await fetch("/api/attendance").then((r) => r.json());
    if (Array.isArray(fresh)) setAttendance(fresh);
    toast("success", "Attendance saved", `${recs.length} student(s) recorded.`);
  };
  const submitFacultyAtt = async (rows: Partial<FacultyAttendance>[]) => {
    if (rows.length === 0) return;
    const r = await fetch("/api/faculty-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      toast("error", "Save failed", b.error || "Could not save faculty attendance.");
      return;
    }
    const fresh = await fetch("/api/faculty-attendance").then((res) => res.json());
    if (Array.isArray(fresh)) setFacultyAttendance(fresh);
    toast("success", "Register saved", `${rows.length} staff record(s) marked.`);
  };
  const submitGrade = async (g: Partial<GradeRecord>) => {
    const r = await fetch("/api/grades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) });
    const c = await r.json();
    setGrades((p) => [c, ...p]);
    toast("success", "Grade added", `${c.studentName} - ${c.gradeLetter}.`);
  };
  const createAsg = async (a: Partial<Assignment>) => {
    const r = await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
    const c = await r.json();
    setAssignments((p) => [c, ...p]);
    toast("success", "Assignment posted", `${c.title} sent to students.`);
  };
  const submitAsg = async (d: { assignmentId: number; text: string; fileUrl: string }) => {
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "submission",
        assignmentId: d.assignmentId,
        studentId: user?.id || PROFILES.student.id,
        studentName: user?.name || PROFILES.student.name,
        submissionText: d.text,
        fileUrl: d.fileUrl,
      }),
    });
    toast("success", "Assignment submitted", "Your work has been sent to the teacher.");
  };

  const gradeSubmission = async (submissionId: number, marks: string, feedback: string) => {
    const r = await fetch("/api/assignments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, marks, feedback }),
    });
    if (!r.ok) {
      toast("error", "Grading failed", "Could not save marks for this submission.");
      return;
    }
    const u = await r.json();
    setSubmissions((p) => p.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
    toast("success", "Submission graded", `Marks ${marks || ""} recorded.`);
  };

  const addTimetable = async (d: Partial<TimetableSlot>) => {
    const r = await fetch("/api/timetable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    setTimetable((p) => [...p, c]);
    toast("success", "Slot added", `${c.courseCode} scheduled for ${c.dayOfWeek}.`);
  };
  const updTimetable = async (d: Partial<TimetableSlot>) => {
    const r = await fetch("/api/timetable", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    setTimetable((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", "Slot updated", "Timetable entry saved.");
  };
  const delTimetable = async (id: number) => {
    await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
    setTimetable((p) => p.filter((x) => x.id !== id));
    toast("info", "Slot removed", "Timetable entry deleted.");
  };

  const addDepartment = async (d: Partial<Department>) => {
    const r = await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    setDepartments((p) => [...p, c]);
    toast("success", "Department added", `${c.code} registered.`);
  };
  const updDepartment = async (d: Partial<Department>) => {
    const r = await fetch("/api/departments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    setDepartments((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", "Department updated", "Details saved.");
  };
  const delDepartment = async (id: number) => {
    await fetch(`/api/departments?id=${id}`, { method: "DELETE" });
    setDepartments((p) => p.filter((x) => x.id !== id));
    toast("info", "Department removed", "Department deleted.");
  };

  const addLeave = async (d: { fromDate: string; toDate: string; reason: string }) => {
    const r = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      toast("error", "Request failed", b.error || "Could not submit leave.");
      return;
    }
    const c = await r.json();
    setLeaves((p) => [c, ...p]);
    toast("success", "Leave submitted", "Your request is pending approval.");
  };
  const reviewLeave = async (id: number, status: "approved" | "rejected", remarks?: string) => {
    const r = await fetch("/api/leaves", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, remarks }) });
    const u = await r.json();
    setLeaves((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", `Leave ${status}`, `${u.studentName}'s request was ${status}.`);
  };

  /* ---------- new modules: setup entities, exams, documents, users, permissions, profile ---------- */
  const makeCrud = <T extends { id: number }>(
    endpoint: string,
    setter: (updater: (prev: T[]) => T[]) => void,
    label: string,
  ) => ({
    add: async (d: Partial<T>) => {
      const r = await fetch(`/api/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const c = (await r.json()) as T;
      setter((p) => [c, ...p]);
      toast("success", `${label} added`, "Saved to database.");
    },
    update: async (d: Partial<T>) => {
      const r = await fetch(`/api/${endpoint}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const u = (await r.json()) as T;
      setter((p) => p.map((x) => (x.id === u.id ? u : x)));
      toast("success", `${label} updated`, "Changes saved.");
    },
    del: async (id: number) => {
      await fetch(`/api/${endpoint}?id=${id}`, { method: "DELETE" });
      setter((p) => p.filter((x) => x.id !== id));
      toast("info", `${label} removed`, "Entry deleted.");
    },
  });
  const setupSem = makeCrud<SemesterInfo>("semesters", setSemesters, "Semester");
  const setupSec = makeCrud<Section>("sections", setSections, "Section");
  const setupSes = makeCrud<AcademicSession>("sessions", setSessions, "Session");
  const setupExam = makeCrud<ExamSchedule>("exams", setExams, "Exam");
  const setupExamDef = makeCrud<ExamDefinition>("exam-master", setExamDefs, "Exam");
  const setupEnr = makeCrud<Enrollment>("enrollments", setEnrollments, "Enrollment");
  const setupFeeStruct = makeCrud<FeeStructure>("fee-structures", setFeeStructures, "Fee structure");
  const generateInvoices = async () => {
    const r = await fetch("/api/fees/generate", { method: "POST" });
    const b = await r.json().catch(() => ({}));
    const fresh = await fetch("/api/fees").then((res) => res.json());
    if (Array.isArray(fresh)) setFees(fresh);
    if (Number(b?.created) > 0) {
      toast("success", "Invoices generated", `${b.created} invoice(s) created from the fee structure.`);
    } else {
      toast("info", "Nothing to generate", "Every enrolled student already has invoices from the structure.");
    }
  };

  const uploadDocument = async (d: { title: string; category: string; fileName: string; mimeType: string; fileSize: number; data: string }) => {
    const r = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      toast("error", "Upload failed", b.error || "Could not upload document.");
      return;
    }
    const c = await r.json();
    setDocuments((p) => [c, ...p]);
    toast("success", "Document uploaded", `${c.title} is pending verification.`);
  };
  const updateDocumentStatus = async (id: number, status: string) => {
    const r = await fetch("/api/documents", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const u = await r.json();
    setDocuments((p) => p.map((x) => (x.id === u.id ? u : x)));
    toast("success", "Document updated", `Marked ${status}.`);
  };
  const deleteDocument = async (id: number) => {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setDocuments((p) => p.filter((x) => x.id !== id));
    toast("info", "Document deleted", "Removed from vault.");
  };
  const updateUser = async (d: { id: number; role?: string; status?: string; password?: string }) => {
    const r = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    if (u.id) {
      setAllUsers((p) => p.map((x) => (x.id === u.id ? u : x)));
      toast("success", "User updated", d.password ? "Password reset successfully." : "Role / status saved.");
    } else {
      toast("error", "Update failed", u.error || "Could not update user.");
    }
  };
  const savePermissions = async (rows: PermissionRow[]) => {
    const r = await fetch("/api/permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
    if (r.ok) {
      setPermissions(rows);
      toast("success", "Permissions saved", "Access matrix updated.");
    } else {
      toast("error", "Save failed", "Could not update permissions.");
    }
  };
  const updateProfile = async (d: { phone?: string; avatarUrl?: string }) => {
    const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const u = await r.json();
    if (u.id) {
      setUser(u);
      toast("success", "Profile updated", "Contact details saved.");
    } else {
      toast("error", "Update failed", u.error || "Could not save profile.");
    }
  };
  const saveAdmission = async (d: Partial<AdmissionInfo>) => {
    const r = await fetch("/api/admissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const c = await r.json();
    if (c.studentId) {
      setAdmissions((p) =>
        p.some((x) => x.studentId === c.studentId) ? p.map((x) => (x.studentId === c.studentId ? c : x)) : [c, ...p],
      );
      toast("success", "Admission details saved", "Record updated.");
    } else {
      toast("error", "Save failed", c.error || "Could not save admission details.");
    }
  };
  const saveMarks = async (rows: Partial<InternalMark>[], status?: string) => {
    if (rows.length === 0) {
      toast("error", "Nothing to save", "Enter marks for at least one student.");
      return;
    }
    const r = await fetch("/api/internal-marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(status ? { rows, status } : rows),
    });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      toast("error", "Save failed", b.error || "Could not save marks.");
      return;
    }
    const fresh = await fetch("/api/internal-marks").then((res) => res.json());
    if (Array.isArray(fresh)) setInternalMarks(fresh);
    toast(
      "success",
      status === "submitted" ? "Sheet submitted" : "Draft saved",
      status === "submitted"
        ? `${rows.length} record(s) sent to the Examination Cell for approval.`
        : `${rows.length} record(s) recorded with auto grades.`,
    );
  };
  const changeMarkStatus = async (courseId: number, examType: string, status: string) => {
    const r = await fetch("/api/internal-marks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, examType, status }),
    });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      toast("error", "Status change failed", b.error || "Could not update status.");
      return;
    }
    const res = await r.json().catch(() => ({}));
    if (Number(res?.count) === 0) {
      toast("info", "Nothing changed", "This sheet is already in that state.");
      return;
    }
    const fresh = await fetch("/api/internal-marks").then((res) => res.json());
    if (Array.isArray(fresh)) setInternalMarks(fresh);
    const verb = status === "approved" ? "approved & published" : status === "submitted" ? "submitted for approval" : "reverted to draft";
    toast("success", "Status updated", `Sheet ${verb}.`);
  };
  const deleteMark = async (id: number) => {
    await fetch(`/api/internal-marks?id=${id}`, { method: "DELETE" });
    setInternalMarks((p) => p.filter((x) => x.id !== id));
    toast("info", "Marks removed", "Result entry deleted.");
  };

  const pendingFees = fees.filter((f) => f.status === "pending").length;

  const uploadCourseMaterial = async (m: Partial<CourseMaterial>) => {
    let created: any = null;
    try {
      const res = await fetch("/api/course-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      });
      if (res.ok) {
        created = await res.json().catch(() => null);
      }
    } catch (e) {
      console.warn("API upload fallback to local state:", e);
    }

    let targetMaterial: CourseMaterial;
    if (created && created.id) {
      targetMaterial = created;
    } else {
      const tempId = Date.now();
      targetMaterial = {
        id: tempId,
        courseId: m.courseId || 1,
        courseCode: m.courseCode || "BCA101",
        courseName: m.courseName || "Introduction to Programming",
        moduleName: m.moduleName || "Module 1",
        title: m.title || "Untitled Resource",
        description: m.description || "",
        type: (m.type as any) || "PDF",
        fileUrl: m.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileSize: m.fileSize || "1.5 MB",
        facultyId: user?.id,
        facultyName: user?.name || m.facultyName || "Faculty Member",
        downloadCount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
    }

    setCourseMaterials((prev) => {
      const updated = [targetMaterial, ...prev.filter((p) => p.id !== targetMaterial.id)];
      if (typeof window !== "undefined") {
        try { localStorage.setItem("vscms_course_materials", JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    toast("success", "Material Published", `"${targetMaterial.title}" is now available for students.`);
  };

  const deleteCourseMaterial = async (id: number) => {
    try {
      await fetch(`/api/course-materials?id=${id}`, { method: "DELETE" });
    } catch {}
    setCourseMaterials((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (typeof window !== "undefined") {
        try { localStorage.setItem("vscms_course_materials", JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    toast("info", "Material Removed", "Digital resource deleted successfully.");
  };

  const incrementCourseMaterialDownload = async (id: number) => {
    try {
      await fetch("/api/course-materials/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
    setCourseMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );
  };

  if (!loggedIn) {
    return (
      <>
        <LoginPage
          allUsers={[...students, ...faculty]}
          onLogin={async (u, r) => {
            setUser(u);
            setRole(r);
            setTab("overview");
            setLoggedIn(true);
            toast("success", "Welcome", `Hello ${u.name.split(" ")[0]}!`);
            // Reload everything with the fresh session: the mount fetch ran
            // anonymously (before login) so admin-only data would stay empty.
            try {
              const data = await fetchAllData();
              applyData(data);
            } catch (e) {
              console.error("reload after login failed", e);
            }
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  const currentTabLabel = (() => {
    const labels: Record<string, string> = {
      overview: "Dashboard",
      students: "Students",
      faculty: "Teachers",
      courses: "Courses",
      materials: "Course Materials",
      departments: "Departments",
      fees: "Fees",
      notices: "Notices",
      timetable: "Timetable",
      exams: "Exam Schedule",
      setup: "Academic Setup",
      documents: "Documents",
      users: "Users & Roles",
      permissions: "Permissions",
      reports: "Reports",
      attendance: "Attendance",
      grades: "Grades",
      assignments: "Assignments",
      marks: "Exam Marks",
      leaves: "Leave Requests",
      myleave: "My Leave",
      performance: "Performance",
      myattendance: "My Attendance",
      results: "My Grades",
      leave: "Leave Request",
      history: "Academic History",
      idcard: "ID Card",
      profile: "My Profile",
      admitcard: "Admit Card",
    };
    return labels[tab] || "Dashboard";
  })();

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Ticker />
      <Navbar
        currentUser={user}
        activeRole={role}
        onRoleChange={switchRole}
        onLogout={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setLoggedIn(false); }}
        onResetSeed={reseed}
        isSeeding={seeding}
        canReset={user?.role === "admin"}
        notices={notices}
        onToast={toast}
        isMobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
        currentTabLabel={currentTabLabel}
      />

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-5">
        <Sidebar
          activeRole={role}
          currentTab={tab}
          onTabChange={(t) => { setTab(t); setMobileNavOpen(false); }}
          onRoleChange={switchRole}
          pendingFeeCount={pendingFees}
          assignmentsCount={assignments.length}
          isOpenMobile={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="border-2 border-ink bg-paper hard p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative h-12 w-12 border-2 border-ink bg-paper-3 flex items-center justify-center">
                <span className="hazard h-6 w-6 animate-pulse" />
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink">
                Loading data...
              </p>
              <p className="font-serif italic text-sm text-muted">
                Getting students, courses and fee records from local storage.
              </p>
            </div>
          ) : role === "admin" ? (
            <AdminDashboard
              currentTab={tab}
              students={students}
              faculty={faculty}
              courses={courses}
              feeRecords={fees}
              notices={notices}
              departments={departments}
              timetable={timetable}
              attendanceRecords={attendance}
              grades={grades}
              admissions={admissions}
              documents={documents}
              sections={sections}
              semesters={semesters}
              sessions={sessions}
              exams={exams}
              examDefs={examDefs}
              internalMarks={internalMarks}
              permissions={permissions}
              allUsers={allUsers}
              enrollments={enrollments}
              onAddStudent={addStudent}
              onUpdateStudent={updStudent}
              onDeleteStudent={delStudent}
              onAddFaculty={addFaculty}
              onUpdateFaculty={updFaculty}
              onDeleteFaculty={delFaculty}
              onAddCourse={addCourse}
              onDeleteCourse={delCourse}
              onAddNotice={addNotice}
              onDeleteNotice={delNotice}
              onPayFee={payFee}
              onAddTimetable={addTimetable}
              onUpdateTimetable={updTimetable}
              onDeleteTimetable={delTimetable}
              onAddDepartment={addDepartment}
              onUpdateDepartment={updDepartment}
              onDeleteDepartment={delDepartment}
              onAddExam={setupExam.add}
              onUpdateExam={setupExam.update}
              onDeleteExam={setupExam.del}
              onAddExamDef={setupExamDef.add}
              onUpdateExamDef={setupExamDef.update}
              onDeleteExamDef={setupExamDef.del}
              onDeleteMark={deleteMark}
              onChangeMarkStatus={changeMarkStatus}
              facultyAttendance={facultyAttendance}
              onMarkFacultyAttendance={submitFacultyAtt}
              onAddSemester={setupSem.add}
              onUpdateSemester={setupSem.update}
              onDeleteSemester={setupSem.del}
              onAddSection={setupSec.add}
              onUpdateSection={setupSec.update}
              onDeleteSection={setupSec.del}
              onAddSession={setupSes.add}
              onUpdateSession={setupSes.update}
              onDeleteSession={setupSes.del}
              onAddEnrollment={setupEnr.add}
              onDeleteEnrollment={setupEnr.del}
              onUpdateDocumentStatus={updateDocumentStatus}
              onDeleteDocument={deleteDocument}
              onUpdateUser={updateUser}
              onSavePermissions={savePermissions}
              feeStructures={feeStructures}
              feePayments={feePayments}
              onAddFeeStructure={setupFeeStruct.add}
              onUpdateFeeStructure={setupFeeStruct.update}
              onDeleteFeeStructure={setupFeeStruct.del}
              onGenerateInvoices={generateInvoices}
              courseMaterials={courseMaterials}
              onUploadMaterial={uploadCourseMaterial}
              onDeleteMaterial={deleteCourseMaterial}
              onIncrementDownload={incrementCourseMaterialDownload}
            />
          ) : role === "faculty" ? (
            <FacultyDashboard
              currentTab={tab}
              currentUser={user}
              courses={courses}
              students={students}
              attendanceRecords={attendance}
              grades={grades}
              assignments={assignments}
              submissions={submissions}
              timetable={timetable}
              leaves={leaves}
              notices={notices}
              enrollments={enrollments}
              internalMarks={internalMarks}
              facultyAttendance={facultyAttendance}
              feeRecords={fees}
              feePayments={feePayments}
              onPayFee={payFee}
              onSaveMarks={saveMarks}
              onDeleteMark={deleteMark}
              onChangeMarkStatus={changeMarkStatus}
              onSubmitAttendance={submitAtt}
              onSubmitGrade={submitGrade}
              onCreateAssignment={createAsg}
              onGradeSubmission={gradeSubmission}
              onReviewLeave={reviewLeave}
              onAddLeave={addLeave}
              onAddNotice={addNotice}
              onDeleteNotice={delNotice}
              permissions={permissions}
              onAddTimetable={addTimetable}
              onDeleteTimetable={delTimetable}
              courseMaterials={courseMaterials}
              onUploadMaterial={uploadCourseMaterial}
              onDeleteMaterial={deleteCourseMaterial}
              onIncrementDownload={incrementCourseMaterialDownload}
              idVerifications={idVerifications}
              onApproveIdVerification={approveStudentVerification}
              onRejectIdVerification={rejectStudentVerification}
            />
          ) : (
            <StudentDashboard
              currentTab={tab}
              currentUser={user}
              attendanceRecords={attendance}
              grades={grades}
              feeRecords={fees}
              feePayments={feePayments}
              assignments={assignments}
              submissions={submissions}
              timetable={timetable}
              notices={notices}
              leaves={leaves}
              admissions={admissions}
              documents={documents}
              exams={exams}
              enrollments={enrollments}
              internalMarks={internalMarks}
              onTabChange={setTab}
              onPayFee={payFee}
              onSubmitAssignment={submitAsg}
              onAddLeave={addLeave}
              onUploadDocument={uploadDocument}
              onDeleteDocument={deleteDocument}
              onUpdateProfile={updateProfile}
              onSaveAdmission={saveAdmission}
              courses={courses}
              courseMaterials={courseMaterials}
              onUploadMaterial={uploadCourseMaterial}
              onDeleteMaterial={deleteCourseMaterial}
              onIncrementDownload={incrementCourseMaterialDownload}
              idVerifications={idVerifications}
              onRequestVerification={requestStudentVerification}
            />
          )}
        </main>
      </div>

      <footer className="border-t-2 border-ink bg-ink text-paper">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/70">
          <span>VSCMS · College of Management Studies</span>
          <span className="flex items-center gap-2">
            <span className="blink h-2 w-2 bg-blood" />
            Version 2.4 - 2026
          </span>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <CMSbot currentUser={user} activeRole={role} notices={notices} />
    </div>
  );
}
