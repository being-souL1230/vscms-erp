"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  FileText,
  Award,
  CheckSquare,
  Bell,
  Plus,
  Search,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Send,
  Printer,
  Clock,
  Layers,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import type {
  User,
  Course,
  FeeRecord,
  FeeStructure,
  FeePayment,
  Notice,
  AttendanceRecord,
  GradeRecord,
  Assignment,
  AssignmentSubmission,
  TimetableSlot,
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
} from "@/types/erp";
import { feeRemaining, feeEffectiveStatus } from "@/types/erp";
import {
  BrutalButton,
  Tag,
  Stamp,
  SectionTitle,
  EmptyState,
  Field,
  INPUT,
  Hazard,
  StudentModal,
  CourseModal,
  FeeReceiptModal,
  SquareAvatar,
  FacultyModal,
  DepartmentModal,
  TimetableModal,
  FeeStructureModal,
  FeePayModal,
  FeeHistoryModal,
} from "@/components/shell";
import { DonutChart, StackedBar, CHART_PALETTE } from "@/components/charts";
import {
  AdminExamCellTab,
  AdminSetupTab,
  AdminDocumentsTab,
  AdminUsersTab,
  AdminPermissionsTab,
  AdminReportsTab,
  FacultyNoticesTab,
  FacultyPerformanceTab,
  FacultyLeaveTab,
  FacultyMarksEntryTab,
  FacultyMyAttendanceTab,
  FacultyFeesTab,
  AdminAttendanceTab,
  AttendanceCalendar,
  StudentDocumentsTab,
  StudentIdCardTab,
  StudentExamsTab,
  StudentProfileTab,
  StudentHistoryTab,
  StudentResultsTab,
  StudentAdmitCardTab,
} from "@/components/features";

/* ---------- shared UI components for dashboards ---------- */
function Stat({
  mark,
  label,
  value,
  unit,
  foot,
  dark = false,
  accent = false,
  Icon,
}: {
  mark: string;
  label: string;
  value: string | number;
  unit?: string;
  foot?: string;
  dark?: boolean;
  accent?: boolean;
  Icon?: typeof Users;
}) {
  return (
    <div
      className={`lift relative border-2 border-ink p-4 hard overflow-hidden ${
        dark ? "bg-ink text-paper" : "bg-paper text-ink"
      }`}
    >
      <span className="hazard absolute top-0 right-0 h-3 w-3 rounded-bl-md rounded-tr-[10px]" />
      <div className="flex items-start justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${dark ? "text-paper/55" : "text-muted"}`}
        >
          {mark} · {label}
        </span>
        {Icon && (
          <Icon className={`w-4 h-4 ${dark ? "text-blood" : "text-ink"}`} />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={`font-display text-4xl leading-none ${
            accent && !dark ? "text-blood" : ""
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className={`font-mono text-[11px] ${dark ? "text-paper/60" : "text-muted"}`}>
            {unit}
          </span>
        )}
      </div>
      {foot && (
        <p className={`mt-2 font-serif italic text-xs ${dark ? "text-paper/70" : "text-muted"}`}>
          {foot}
        </p>
      )}
    </div>
  );
}

function Meter({ value, dark = false }: { value: number; dark?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`border-2 ${dark ? "border-paper/30" : "border-ink"} h-4 bg-transparent p-0.5`}>
      <div className="h-full hazard" style={{ width: `${v}%` }} />
    </div>
  );
}


function PanelHeader({
  tag,
  title,
  accent,
  sub,
  right,
}: {
  tag: string;
  title: string;
  accent?: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative bg-ink text-paper border-2 border-ink hard p-5 sm:p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <Hazard className="absolute top-0 left-0 right-0 h-2" />
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Stamp>{tag}</Stamp>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/55">
            {"// VSCMS · 2026"}
          </span>
        </div>
        <h1 className="font-display uppercase text-2xl sm:text-3xl lg:text-4xl leading-[0.9] text-paper">
          {title} {accent && <span className="text-blood">{accent}</span>}
        </h1>
        {sub && <p className="mt-2 font-serif italic text-sm text-paper/75 max-w-xl">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap gap-2 mt-2 md:mt-0">{right}</div>}
    </div>
  );
}

const TH =
  "py-2.5 px-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-paper bg-ink";
const TD = "py-2.5 px-3 align-top";

/* ============================================================
   ADMIN PANEL
   ============================================================ */
export function AdminDashboard(props: {
  currentTab: string;
  students: User[];
  faculty: User[];
  courses: Course[];
  feeRecords: FeeRecord[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  notices: Notice[];
  departments: Department[];
  timetable: TimetableSlot[];
  attendanceRecords: AttendanceRecord[];
  grades: GradeRecord[];
  admissions: AdmissionInfo[];
  documents: StudentDocument[];
  sections: Section[];
  semesters: SemesterInfo[];
  sessions: AcademicSession[];
  exams: ExamSchedule[];
  permissions: PermissionRow[];
  allUsers: User[];
  enrollments: Enrollment[];
  onAddStudent: (d: Partial<User>) => void;
  onUpdateStudent: (d: Partial<User>) => void;
  onDeleteStudent: (id: number) => void;
  onAddFaculty: (d: Partial<User>) => void;
  onUpdateFaculty: (d: Partial<User>) => void;
  onDeleteFaculty: (id: number) => void;
  onAddCourse: (d: Partial<Course>) => void;
  onDeleteCourse: (id: number) => void;
  onAddNotice: (d: Partial<Notice>) => void;
  onDeleteNotice: (id: number) => void;
  onPayFee: (id: number, amount?: number, method?: string) => void;
  onAddFeeStructure: (d: Partial<FeeStructure>) => void;
  onUpdateFeeStructure: (d: Partial<FeeStructure>) => void;
  onDeleteFeeStructure: (id: number) => void;
  onGenerateInvoices: () => void;
  onAddTimetable: (d: Partial<TimetableSlot>) => void;
  onUpdateTimetable: (d: Partial<TimetableSlot>) => void;
  onDeleteTimetable: (id: number) => void;
  onAddDepartment: (d: Partial<Department>) => void;
  onUpdateDepartment: (d: Partial<Department>) => void;
  onDeleteDepartment: (id: number) => void;
  onAddExam: (d: Partial<ExamSchedule>) => void;
  onUpdateExam: (d: Partial<ExamSchedule>) => void;
  onDeleteExam: (id: number) => void;
  onAddSemester: (d: Partial<SemesterInfo>) => void;
  onUpdateSemester: (d: Partial<SemesterInfo>) => void;
  onDeleteSemester: (id: number) => void;
  onAddSection: (d: Partial<Section>) => void;
  onUpdateSection: (d: Partial<Section>) => void;
  onDeleteSection: (id: number) => void;
  onAddSession: (d: Partial<AcademicSession>) => void;
  onUpdateSession: (d: Partial<AcademicSession>) => void;
  onDeleteSession: (id: number) => void;
  onAddEnrollment: (d: Partial<Enrollment>) => void;
  onDeleteEnrollment: (id: number) => void;
  examDefs: ExamDefinition[];
  internalMarks: InternalMark[];
  onAddExamDef: (d: Partial<ExamDefinition>) => void;
  onUpdateExamDef: (d: Partial<ExamDefinition>) => void;
  onDeleteExamDef: (id: number) => void;
  onDeleteMark: (id: number) => void;
  onChangeMarkStatus: (courseId: number, examType: string, status: string) => void;
  facultyAttendance: FacultyAttendance[];
  onMarkFacultyAttendance: (rows: Partial<FacultyAttendance>[]) => void;
  onUpdateDocumentStatus: (id: number, status: string) => void;
  onDeleteDocument: (id: number) => void;
  onUpdateUser: (d: { id: number; role?: string; status?: string; password?: string }) => void;
  onSavePermissions: (rows: PermissionRow[]) => void;
}) {
  const {
    currentTab,
    students,
    faculty,
    courses,
    feeRecords,
    notices,
    departments,
    timetable,
    attendanceRecords,
    grades,
    admissions,
    documents,
    sections,
    semesters,
    sessions,
    exams,
    permissions,
    allUsers,
    enrollments,
    examDefs,
    internalMarks,
    onAddStudent,
    onUpdateStudent,
    onDeleteStudent,
    onAddFaculty,
    onUpdateFaculty,
    onDeleteFaculty,
    onAddCourse,
    onDeleteCourse,
    onAddNotice,
    onDeleteNotice,
    onPayFee,
    onAddFeeStructure,
    onUpdateFeeStructure,
    onDeleteFeeStructure,
    onGenerateInvoices,
    feeStructures,
    feePayments,
    onAddTimetable,
    onUpdateTimetable,
    onDeleteTimetable,
    onAddDepartment,
    onUpdateDepartment,
    onDeleteDepartment,
    onAddExam,
    onUpdateExam,
    onDeleteExam,
    onAddExamDef,
    onUpdateExamDef,
    onDeleteExamDef,
    onDeleteMark,
    onChangeMarkStatus,
    facultyAttendance,
    onMarkFacultyAttendance,
    onAddSemester,
    onUpdateSemester,
    onDeleteSemester,
    onAddSection,
    onUpdateSection,
    onDeleteSection,
    onAddSession,
    onUpdateSession,
    onDeleteSession,
    onAddEnrollment,
    onDeleteEnrollment,
    onUpdateDocumentStatus,
    onDeleteDocument,
    onUpdateUser,
    onSavePermissions,
  } = props;

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [stuOpen, setStuOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [crsOpen, setCrsOpen] = useState(false);
  const [receipt, setReceipt] = useState<FeeRecord | null>(null);
  const [feeStructOpen, setFeeStructOpen] = useState(false);
  const [feeStructEdit, setFeeStructEdit] = useState<FeeStructure | null>(null);
  const [historyRecord, setHistoryRecord] = useState<FeeRecord | null>(null);

  // faculty + courses + fees filters
  const [facQ, setFacQ] = useState("");
  const [facOpen, setFacOpen] = useState(false);
  const [facEdit, setFacEdit] = useState<User | null>(null);
  const [crsQ, setCrsQ] = useState("");
  const [feeQ, setFeeQ] = useState("");
  const [logQ, setLogQ] = useState("");
  const [depOpen, setDepOpen] = useState(false);
  const [depEdit, setDepEdit] = useState<Department | null>(null);

  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");
  const [nCat, setNCat] = useState("Academic");
  const [nPrio, setNPrio] = useState<"normal" | "urgent">("normal");

  const filtered = students.filter(
    (s) =>
      (s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(q.toLowerCase())) &&
      (dept === "all" || s.department === dept),
  );

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(facQ.toLowerCase()) ||
      (f.rollNo || "").toLowerCase().includes(facQ.toLowerCase()) ||
      f.department.toLowerCase().includes(facQ.toLowerCase()),
  );
  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(crsQ.toLowerCase()) ||
      c.code.toLowerCase().includes(crsQ.toLowerCase()) ||
      c.department.toLowerCase().includes(crsQ.toLowerCase()),
  );
  const filteredFees = feeRecords.filter(
    (f) =>
      f.studentName.toLowerCase().includes(feeQ.toLowerCase()) ||
      f.rollNo.toLowerCase().includes(feeQ.toLowerCase()) ||
      f.feeType.toLowerCase().includes(feeQ.toLowerCase()),
  );

  const total = feeRecords.reduce((a, f) => a + Number(f.amount || 0), 0);
  const collected = feeRecords.reduce((a, f) => a + Number(f.paidAmount || 0), 0);
  const rate = total > 0 ? Math.round((collected / total) * 100) : 100;
  const pending = feeRecords.filter((f) => feeEffectiveStatus(f) !== "paid").length;
  const overdueList = feeRecords.filter((f) => feeEffectiveStatus(f) === "overdue");
  const pendingAmount = () =>
    feeRecords.filter((f) => feeEffectiveStatus(f) !== "paid").reduce((a, f) => a + feeRemaining(f), 0);
  const deptCounts = (() => {
    const map = new Map<string, number>();
    students.forEach((s) => map.set(s.department, (map.get(s.department) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  })();

  const downloadCSV = (name: string, head: string[], rows: (string | number)[][]) => {
    const csv = "data:text/csv;charset=utf-8," + [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportCSV = () =>
    downloadCSV(
      "vscms_scholars",
      ["Roll", "Name", "Email", "Area", "Sem", "CGPA", "Status"],
      filtered.map((s) => [
        s.rollNo,
        `"${s.name}"`,
        s.email,
        `"${s.department}"`,
        s.semester || 1,
        s.gpa || "-",
        s.status,
      ]),
    );
  const exportCoursesCSV = () =>
    downloadCSV(
      "vscms_courses",
      ["Code", "Name", "Area", "Credits", "Sem", "Faculty", "Room"],
      filteredCourses.map((c) => [
        c.code,
        `"${c.name}"`,
        `"${c.department}"`,
        c.credits,
        c.semester,
        `"${c.facultyName || "TBA"}"`,
        `"${c.room || "-"}"`,
      ]),
    );
  const exportFeesCSV = () =>
    downloadCSV(
      "vscms_fees",
      ["Student", "Roll", "Type", "Amount", "Due", "Status", "Receipt"],
      filteredFees.map((f) => [
        `"${f.studentName}"`,
        f.rollNo,
        `"${f.feeType}"`,
        Number(f.amount).toFixed(2),
        f.dueDate,
        f.status,
        f.receiptNumber || "-",
      ]),
    );

  const postNotice = (e: FormEvent) => {
    e.preventDefault();
    if (!nTitle || !nBody) return;
    onAddNotice({ title: nTitle, content: nBody, category: nCat, priority: nPrio, authorName: "Director's Office" });
    setNTitle("");
    setNBody("");
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        tag="Admin Panel"
        title="Academic Governance"
        accent="& Control"
        sub="Students, teachers, courses and fees - all in one place."
        right={
          <>
            <BrutalButton
              tone="blood"
              onClick={() => {
                setEditing(null);
                setStuOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Enrol Scholar
            </BrutalButton>
            <BrutalButton tone="paper" onClick={() => setCrsOpen(true)}>
              <Plus className="w-4 h-4" /> Add Course
            </BrutalButton>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat mark="01" label="Total Students" value={students.length} unit="active" foot="Across 4 courses" Icon={Users} />
        <Stat mark="02" label="Total Teachers" value={faculty.length} unit="members" foot="Professors & area chairs" Icon={BookOpen} />
            <Stat mark="03" label="Fee Collection" value={`${rate}%`} foot={`₹ ${collected.toLocaleString()} of ${total.toLocaleString()}`} dark accent Icon={DollarSign} />
        <Stat mark="04" label="Active Courses" value={courses.length} unit="this sem" foot="Case-method curriculum" Icon={Layers} />
      </div>

      {/* OVERVIEW */}
      {(currentTab === "overview") && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="border-2 border-ink bg-paper hard p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">Fee Collection</span>
                <span className="font-display text-blood text-lg">₹</span>
              </div>
              <DonutChart
                centerValue={`${rate}%`}
                centerLabel="collected"
                data={[
                  { label: "Collected", value: collected, color: "#2563eb" },
                  { label: "Pending", value: pendingAmount(), color: "#cbd5e1" },
                ]}
              />
            </div>
            <div className="border-2 border-ink bg-paper hard p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">Scholars by Area</span>
                <Users className="w-4 h-4" />
              </div>
              <DonutChart
                centerValue={String(deptCounts.reduce((a, d) => a + d.count, 0))}
                centerLabel="scholars"
                data={deptCounts.map((d, i) => ({
                  label: d.name.replace("BCA ", ""),
                  value: d.count,
                  color: CHART_PALETTE[i % CHART_PALETTE.length],
                }))}
              />
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 border-2 border-ink bg-paper hard">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-paper-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">
                Recent Students
              </span>
              <Tag tone="ink">{students.length} total</Tag>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink">
                    <th className={TH}>Scholar</th>
                    <th className={TH}>Roll</th>
                    <th className={TH}>Area · Sem</th>
                    <th className={TH}>CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                      <td className={TD}>
                        <div className="flex items-center gap-2.5">
                          <SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} />
                          <span className="font-serif font-semibold text-ink group-hover:text-blood">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className={`${TD} font-mono text-[11px] text-blood`}>{s.rollNo}</td>
                      <td className={`${TD} text-muted`}>
                        {s.department} · Sem {s.semester || 1}
                      </td>
                      <td className={TD}>
                        <span className="font-mono text-xs font-bold border-2 border-ink px-1.5 py-0.5 bg-paper-3">
                          {s.gpa || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="border-2 border-ink bg-ink text-paper hard p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/70">
                  Latest Notices
                </span>
                <Bell className="w-4 h-4 text-blood" />
              </div>
              <div className="space-y-2">
                {notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="border border-paper/20 p-2 hover:border-blood">
                    <div className="flex items-center justify-between mb-1">
                      <Tag tone={n.priority === "urgent" ? "blood" : "paper"}>{n.category}</Tag>
                      <span className="font-mono text-[9px] text-paper/50">{n.publishedDate}</span>
                    </div>
                    <p className="font-serif text-[12px] text-paper/90 line-clamp-2">{n.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* STUDENTS */}
      {currentTab === "students" && (
        <div className="border-2 border-ink bg-paper hard">
          <div className="p-4 sm:p-5 space-y-4">
            <SectionTitle
              index="02"
              kicker="Student List"
              title="Enrolled"
              accent="Students"
              sub="Manage student details and grades. Export the list if needed."
              right={
                <>
                  <BrutalButton tone="ghost" onClick={exportCSV}>
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </BrutalButton>
                  <BrutalButton
                    tone="blood"
                    onClick={() => {
                      setEditing(null);
                      setStuOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add Student
                  </BrutalButton>
                </>
              }
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  className={INPUT + " pl-9"}
                  placeholder="search by name or roll number..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select className={INPUT + " sm:w-64"} value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="all">All Departments</option>
                <option>BCA (CSJM)</option>
                <option>BCA (MCU)</option>
                <option>MBA</option>
                <option>BBA</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState label="No students match" hint="Try changing the filter or add a new student." />
            ) : (
              <div className="overflow-x-auto overflow-y-auto border-2 border-ink max-h-[760px]">
                <table className="w-full text-sm">
                  {/* sticky header stays visible while the list scrolls inside this container */}
                  <thead className="sticky top-0 z-10">
                    <tr>
                    <th className={TH}>Student</th>
                    <th className={TH}>Roll / ID</th>
                    <th className={TH}>Course - Sem</th>
                    <th className={TH}>CGPA</th>
                      <th className={TH}>Standing</th>
                      <th className={TH + " text-right"}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                        <td className={TD}>
                          <div className="flex items-center gap-2.5">
                            <SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} />
                            <div className="leading-tight">
                              <span className="font-serif font-semibold text-ink group-hover:text-blood block">
                                {s.name}
                              </span>
                              <span className="font-mono text-[10px] text-muted">{s.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={`${TD} font-mono text-[11px] text-blood font-bold`}>{s.rollNo}</td>
                        <td className={TD}>
                          <span className="text-ink font-serif">{s.department}</span>
                          <span className="block font-mono text-[10px] text-muted">Sem {s.semester || 1}</span>
                        </td>
                        <td className={TD}>
                          <span className="font-mono text-xs font-bold border-2 border-ink bg-paper-3 px-1.5 py-0.5">
                            {s.gpa || "-"} / 4.0
                          </span>
                        </td>
                        <td className={TD}>
                          <Tag tone="ink" className="capitalize">{s.status}</Tag>
                        </td>
                        <td className={TD}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditing(s);
                                setStuOpen(true);
                              }}
                              className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"
                              title="Amend"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStudent(s.id)}
                              className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                              title="Expunge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FACULTY */}
      {currentTab === "faculty" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="03"
            kicker="Teacher List"
            title="Teachers &"
            accent="Area Heads"
            sub="Teaching staff, their roles and the courses they teach."
            right={
              <BrutalButton
                tone="blood"
                onClick={() => {
                  setFacEdit(null);
                  setFacOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Add Teacher
              </BrutalButton>
            }
          />
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              className={INPUT + " pl-9"}
              placeholder="search teachers by name, ID or area..."
              value={facQ}
              onChange={(e) => setFacQ(e.target.value)}
            />
          </div>
          {filteredFaculty.length === 0 ? (
            <EmptyState label="No teachers match" hint="Try a different search or add a new teacher." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFaculty.map((f) => (
                <div key={f.id} className="lift border-2 border-ink bg-paper-3 hard p-4 flex items-start gap-4 group">
                  <SquareAvatar src={f.avatarUrl} initial={f.name.charAt(0)} className="!h-14 !w-14 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display uppercase text-base text-ink leading-tight group-hover:text-blood transition-colors">{f.name}</h4>
                      <span className="font-mono text-[10px] text-blood border border-blood px-1.5 py-0.5 shrink-0">
                        {f.rollNo}
                      </span>
                    </div>
                    <p className="font-serif italic text-sm text-blood mt-0.5">{f.designation || "Teacher"}</p>
                    <p className="font-mono text-[11px] text-muted mt-1">{f.department}</p>
                    <div className="mt-3 pt-2 border-t-2 border-dashed border-ink/25 flex items-center justify-between font-mono text-[10px] text-muted">
                      <span className="truncate">{f.email}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setFacEdit(f);
                            setFacOpen(true);
                          }}
                          className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"
                          title="Amend"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFaculty(f.id)}
                          className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COURSES */}
      {currentTab === "courses" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="04"
            kicker="Course List"
            title="Available"
            accent="Courses"
            sub="Credits, teacher and room details for this sem."
            right={
              <>
                <BrutalButton tone="ghost" onClick={exportCoursesCSV}>
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </BrutalButton>
                <BrutalButton tone="ink" onClick={() => setCrsOpen(true)}>
                  <Plus className="w-4 h-4" /> Add Course
                </BrutalButton>
              </>
            }
          />
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              className={INPUT + " pl-9"}
              placeholder="search courses by name, code or area..."
              value={crsQ}
              onChange={(e) => setCrsQ(e.target.value)}
            />
          </div>
          {filteredCourses.length === 0 ? (
            <EmptyState label="No courses match" hint="Try a different search." />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCourses.map((c) => (
              <div key={c.id} className="lift border-2 border-ink bg-paper-3 hard p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Stamp>{c.code}</Stamp>
                    <span className="font-mono text-[10px] text-muted">
                      {c.credits} CR · Sem {c.semester}
                    </span>
                  </div>
                  <h4 className="font-display uppercase text-sm text-ink leading-tight">{c.name}</h4>
                  <p className="font-mono text-[10px] text-blood mt-1">{c.department}</p>
                  <p className="font-serif italic text-xs text-muted mt-2 leading-snug line-clamp-3">
                    {c.description || "Core course."}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-dashed border-ink/25 flex items-center justify-between">
                  <div className="leading-tight">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Teacher</p>
                    <p className="font-serif text-xs text-ink">{c.facultyName || "TBA"}</p>
                  </div>
                  <button
                    onClick={() => onDeleteCourse(c.id)}
                    className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                     title="Delete course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* FEES */}
      {currentTab === "fees" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="05"
            kicker="Bursar"
            title="Student"
            accent="Fees"
            sub="Course-wise fee structure, invoices, installments and receipts."
            right={
              <div className="flex items-center gap-2">
                <Tag tone="ink">Collected {rate}%</Tag>
                <Tag tone="blood">{pending} pending</Tag>
                <BrutalButton tone="ghost" onClick={exportFeesCSV}>
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </BrutalButton>
              </div>
            }
          />

          {/* Due-date reminders */}
          {overdueList.length > 0 && (
            <div className="border-2 border-blood bg-paper-3 hard p-4 flex flex-wrap items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-blood shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display uppercase text-sm text-blood">Fee Reminders · {overdueList.length} overdue</p>
                <p className="font-serif text-xs text-ink/80 mt-0.5">
                  {overdueList.slice(0, 3).map((f) => `${f.studentName} ${f.feeType} (₹${feeRemaining(f).toFixed(2)})`).join(" · ")}
                  {overdueList.length > 3 ? ` · +${overdueList.length - 3} more` : ""} due date crossed, please follow up.
                </p>
              </div>
              <Tag tone="blood">Overdue</Tag>
            </div>
          )}

          {/* Fee structure per course + semester */}
          <div className="border-2 border-ink">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Fee Structure · per course &amp; semester</span>
              <div className="flex items-center gap-2">
                <BrutalButton tone="ghost" onClick={onGenerateInvoices}>
                  <Layers className="w-4 h-4" /> Generate Invoices
                </BrutalButton>
                <BrutalButton
                  tone="blood"
                  onClick={() => {
                    setFeeStructEdit(null);
                    setFeeStructOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Structure
                </BrutalButton>
              </div>
            </div>
            {feeStructures.length === 0 ? (
              <div className="p-4"><EmptyState label="No fee structures yet" hint="Add a structure invoices auto-generate for enrolled students." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={TH}>Course</th>
                      <th className={TH}>Sem</th>
                      <th className={TH}>Fee Type</th>
                      <th className={TH}>Amount</th>
                      <th className={TH}>Due</th>
                      <th className={TH + " text-right"}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStructures.map((s) => (
                      <tr key={s.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                        <td className={`${TD} font-mono text-[11px] text-blood font-bold`}>{s.courseCode}</td>
                        <td className={`${TD} font-mono text-[11px]`}>{s.semester}</td>
                        <td className={`${TD} text-muted`}>{s.feeType}</td>
                        <td className={`${TD} font-mono font-bold text-ink`}>₹{Number(s.amount).toFixed(2)}</td>
                        <td className={`${TD} font-mono text-[11px] text-muted`}>{s.dueDate}</td>
                        <td className={TD}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setFeeStructEdit(s);
                                setFeeStructOpen(true);
                              }}
                              className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"
                              title="Edit structure"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteFeeStructure(s.id)}
                              className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                              title="Delete structure"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              className={INPUT + " pl-9"}
              placeholder="search by student, roll, course or fee type..."
              value={feeQ}
              onChange={(e) => setFeeQ(e.target.value)}
            />
          </div>
          {filteredFees.length === 0 ? (
            <EmptyState label="No fee records match" hint="Try a different search." />
          ) : (
          <div className="overflow-x-auto border-2 border-ink">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={TH}>Student</th>
                  <th className={TH}>Roll</th>
                  <th className={TH}>Course</th>
                  <th className={TH}>Details</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Due</th>
                  <th className={TH}>Status</th>
                  <th className={TH + " text-right"}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((f) => {
                  const eff = feeEffectiveStatus(f);
                  const rem = feeRemaining(f);
                  const isPartial = Number(f.paidAmount || 0) > 0 && rem > 0;
                  return (
                    <tr key={f.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                      <td className={`${TD} font-serif font-semibold text-ink group-hover:text-blood`}>{f.studentName}</td>
                      <td className={`${TD} font-mono text-[11px] text-blood`}>{f.rollNo}</td>
                      <td className={`${TD} font-mono text-[11px]`}>{f.courseCode || "-"}</td>
                      <td className={`${TD} text-muted`}>{f.feeType}</td>
                      <td className={`${TD} font-mono font-bold text-ink`}>
                        ₹{Number(f.amount).toFixed(2)}
                        {isPartial && <span className="block font-mono text-[10px] font-normal text-muted">₹{Number(f.paidAmount || 0).toFixed(2)} paid</span>}
                      </td>
                      <td className={`${TD} font-mono text-[11px] text-muted`}>{f.dueDate}</td>
                      <td className={TD}>
                        <Tag tone={eff === "paid" ? "ink" : "blood"}>{eff}</Tag>
                      </td>
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryRecord(f)}
                            className="border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-paper press"
                          >
                            Payments
                          </button>
                          <button
                            onClick={() => setReceipt(f)}
                            className="border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-paper press"
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {/* Collections Log audit trail of who collected what */}
          <div className="border-2 border-ink">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                Collections Log · {feePayments.length} transactions
              </span>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  className={INPUT + " pl-9"}
                  placeholder="search by student, collector or receipt..."
                  value={logQ}
                  onChange={(e) => setLogQ(e.target.value)}
                />
              </div>
            </div>
            {feePayments.length === 0 ? (
              <div className="p-4"><EmptyState label="No collections yet" hint="Payments recorded by students, faculty or bursar appear here." /></div>
            ) : (
              <div className="max-h-[340px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className={TH}>Date</th>
                      <th className={TH}>Student</th>
                      <th className={TH}>Roll</th>
                      <th className={TH + " text-right"}>Amount</th>
                      <th className={TH}>Method</th>
                      <th className={TH}>Collected By</th>
                      <th className={TH}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feePayments
                      .filter((p) => {
                        const q = logQ.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          p.studentName.toLowerCase().includes(q) ||
                          String(p.collectedBy || "").toLowerCase().includes(q) ||
                          p.receiptNumber.toLowerCase().includes(q)
                        );
                      })
                      .map((p) => (
                        <tr key={p.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                          <td className={`${TD} font-mono text-[11px]`}>{p.paidAt}</td>
                          <td className={`${TD} font-serif font-semibold text-ink`}>{p.studentName}</td>
                          <td className={`${TD} font-mono text-[11px] text-blood`}>{students.find((s) => s.id === p.studentId)?.rollNo || p.studentId}</td>
                          <td className={`${TD} text-right font-mono font-bold text-ink`}>₹{Number(p.amount).toFixed(2)}</td>
                          <td className={`${TD} text-muted`}>{p.paymentMethod}</td>
                          <td className={`${TD} font-serif text-xs`}>
                            {p.collectedBy || <span className="text-muted">student self</span>}
                          </td>
                          <td className={`${TD} font-mono text-[10px] text-blood`}>{p.receiptNumber}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEPARTMENTS */}
      {currentTab === "departments" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="06"
            kicker="Academic Units"
            title="Departments"
            accent="& Heads"
            sub="Manage schools, heads of departments and campus locations."
            right={
              <BrutalButton
                tone="blood"
                onClick={() => {
                  setDepEdit(null);
                  setDepOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Add Department
              </BrutalButton>
            }
          />
          {departments.length === 0 ? (
            <EmptyState label="No departments on file" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((d) => (
                <div key={d.id} className="lift border-2 border-ink bg-paper-3 hard p-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Stamp>{d.code}</Stamp>
                      <span className="font-mono text-[10px] text-muted">{d.location || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setDepEdit(d);
                          setDepOpen(true);
                        }}
                        className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"
                        title="Amend"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDepartment(d.id)}
                        className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-display uppercase text-base text-ink leading-tight mt-2 group-hover:text-blood transition-colors">
                    {d.name}
                  </h4>
                  <div className="mt-3 pt-2 border-t-2 border-dashed border-ink/25 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-blood">{d.headOfDepartment}</span>
                    <span className="text-muted">
                      {d.studentCount || 0} scholars · {d.facultyCount || 0} staff
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIMETABLE (admin) */}
      {currentTab === "timetable" && (
        <AdminTimetablePanel
          slots={timetable}
          onAdd={onAddTimetable}
          onUpdate={onUpdateTimetable}
          onDelete={onDeleteTimetable}
        />
      )}

      {/* NOTICES */}
      {currentTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={postNotice} className="border-2 border-ink bg-paper hard p-5 h-fit space-y-3.5">
            <SectionTitle kicker="Broadcast" title="Post a" accent="Notice" />
            <Field label="Headline">
              <input className={INPUT} value={nTitle} onChange={(e) => setNTitle(e.target.value)} required placeholder="e.g. Exam schedule update" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select className={INPUT} value={nCat} onChange={(e) => setNCat(e.target.value)}>
                  <option>Academic</option>
                  <option>Exam</option>
                  <option>Event</option>
                  <option>Fee</option>
                </select>
              </Field>
              <Field label="Priority">
                <select className={INPUT} value={nPrio} onChange={(e) => setNPrio(e.target.value as "normal" | "urgent")}>
                  <option value="normal">Standard</option>
                  <option value="urgent">Urgent</option>
                </select>
              </Field>
            </div>
            <Field label="Body">
               <textarea rows={5} className={INPUT} value={nBody} onChange={(e) => setNBody(e.target.value)} required placeholder="Write notice details..." />
            </Field>
              <BrutalButton type="submit" tone="blood" className="w-full">
                <Send className="w-4 h-4" /> Post Notice
              </BrutalButton>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <SectionTitle kicker="On the board" title={`All Notices`} accent={`(${notices.length})`} />
            {notices.length === 0 && <EmptyState label="No notices yet" />}
            {notices.map((n) => (
              <article key={n.id} className="lift border-2 border-ink bg-paper hard p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag tone="ink">{n.category}</Tag>
                    {n.priority === "urgent" && <Stamp>Urgent</Stamp>}
                  </div>
                  <button onClick={() => onDeleteNotice(n.id)} className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-display uppercase text-base text-ink leading-tight">{n.title}</h4>
                <p className="font-serif text-sm text-ink/80 mt-1.5 leading-relaxed">{n.content}</p>
                <div className="mt-3 pt-2 border-t-2 border-dashed border-ink/25 flex items-center justify-between font-mono text-[10px] text-muted">
                  <span>Posted by {n.authorName}</span>
                  <span>{n.publishedDate}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* EXAMINATION CELL (admin) */}
      {currentTab === "exams" && (
        <AdminExamCellTab
          exams={exams}
          examDefs={examDefs}
          marks={internalMarks}
          onAddExam={onAddExam}
          onUpdateExam={onUpdateExam}
          onDeleteExam={onDeleteExam}
          onAddExamDef={onAddExamDef}
          onUpdateExamDef={onUpdateExamDef}
          onDeleteExamDef={onDeleteExamDef}
          onDeleteMark={onDeleteMark}
          onChangeMarkStatus={onChangeMarkStatus}
        />
      )}

      {/* ACADEMIC SETUP (admin) */}
      {currentTab === "setup" && (
        <AdminSetupTab
          semesters={semesters}
          sections={sections}
          sessions={sessions}
          enrollments={enrollments}
          students={students}
          courses={courses}
          onAddSemester={onAddSemester}
          onUpdateSemester={onUpdateSemester}
          onDeleteSemester={onDeleteSemester}
          onAddSection={onAddSection}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddSession={onAddSession}
          onUpdateSession={onUpdateSession}
          onDeleteSession={onDeleteSession}
          onAddEnrollment={onAddEnrollment}
          onDeleteEnrollment={onDeleteEnrollment}
        />
      )}

      {/* DOCUMENTS (admin) */}
      {currentTab === "documents" && (
        <AdminDocumentsTab
          documents={documents}
          onUpdateStatus={onUpdateDocumentStatus}
          onDelete={onDeleteDocument}
        />
      )}

      {/* USERS (admin) */}
      {currentTab === "users" && (
        <AdminUsersTab users={allUsers} onUpdateUser={onUpdateUser} />
      )}

      {/* PERMISSIONS (admin) */}
      {currentTab === "permissions" && (
        <AdminPermissionsTab
          key={permissions
            .map((p) => `${p.role}|${p.module}|${p.canView}${p.canCreate}${p.canEdit}${p.canDelete}`)
            .join(",")}
          permissions={permissions}
          onSave={onSavePermissions}
        />
      )}

      {/* REPORTS (admin) */}
      {currentTab === "reports" && (
        <AdminReportsTab
          students={students}
          courses={courses}
          feeRecords={feeRecords}
          attendance={attendanceRecords}
          grades={grades}
        />
      )}

      {/* ATTENDANCE CONTROL (admin) */}
      {currentTab === "attendance" && (
        <AdminAttendanceTab
          attendance={attendanceRecords}
          students={students}
          facultyList={faculty}
          facultyRecords={facultyAttendance}
          onMarkFaculty={onMarkFacultyAttendance}
        />
      )}

      <StudentModal
        isOpen={stuOpen}
        onClose={() => setStuOpen(false)}
        initialData={editing}
        onSubmit={(d) => {
          if (editing) onUpdateStudent(d);
          else onAddStudent(d);
          setStuOpen(false);
        }}
      />
      <FacultyModal
        isOpen={facOpen}
        onClose={() => setFacOpen(false)}
        initialData={facEdit}
        onSubmit={(d) => {
          if (facEdit) onUpdateFaculty(d);
          else onAddFaculty(d);
          setFacOpen(false);
        }}
      />
      <CourseModal isOpen={crsOpen} onClose={() => setCrsOpen(false)} onSubmit={(d) => { onAddCourse(d); setCrsOpen(false); }} />
      <FeeReceiptModal isOpen={!!receipt} onClose={() => setReceipt(null)} record={receipt} />
      <FeeStructureModal
        isOpen={feeStructOpen}
        onClose={() => setFeeStructOpen(false)}
        courses={courses}
        initialData={feeStructEdit}
        onSubmit={(d) => {
          if (d.id) onUpdateFeeStructure(d);
          else onAddFeeStructure(d);
          setFeeStructOpen(false);
        }}
      />
      <FeeHistoryModal
        isOpen={!!historyRecord}
        payments={feePayments.filter((p) => p.feeRecordId === historyRecord?.id)}
        title={historyRecord ? `${historyRecord.studentName} · ${historyRecord.feeType}` : "Payment History"}
        onClose={() => setHistoryRecord(null)}
      />
      <DepartmentModal
        isOpen={depOpen}
        onClose={() => setDepOpen(false)}
        initialData={depEdit}
        onSubmit={(d) => {
          if (depEdit) onUpdateDepartment(d);
          else onAddDepartment(d);
          setDepOpen(false);
        }}
      />
    </div>
  );
}

/* ============================================================
   ADMIN TIMETABLE PANEL (shared with faculty editing)
   ============================================================ */
function AdminTimetablePanel({
  slots,
  onAdd,
  onUpdate,
  onDelete,
  canEdit = true,
}: {
  slots: TimetableSlot[];
  onAdd: (d: Partial<TimetableSlot>) => void;
  onUpdate?: (d: Partial<TimetableSlot>) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TimetableSlot | null>(null);
  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        index="05"
        kicker="Weekly"
        title="Class"
        accent="Timetable"
        sub="Rooms, timings and teachers for this term. Sorted by day."
        right={
          canEdit ? (
            <BrutalButton
              tone="blood"
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Slot
            </BrutalButton>
          ) : undefined
        }
      />
      {slots.length === 0 ? (
        <EmptyState label="No classes scheduled" hint="Add the first timetable slot." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {slots.map((t) => (
            <div key={t.id} className="lift border-2 border-ink bg-paper-3 hard p-4 group">
              <div className="flex items-center justify-between mb-2">
                <Stamp>{t.dayOfWeek}</Stamp>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-blood border border-blood px-1.5 py-0.5">{t.room}</span>
                  {canEdit && (
                    <>
                      {onUpdate && (
                        <button
                          onClick={() => {
                            setEdit(t);
                            setOpen(true);
                          }}
                          className="border-2 border-ink p-1 hover:bg-ink hover:text-paper press"
                          title="Amend"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(t.id)}
                        className="border-2 border-ink p-1 hover:bg-blood hover:text-paper hover:border-blood press"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h4 className="font-display uppercase text-sm text-ink leading-tight group-hover:text-blood transition-colors">
                {t.courseName}
              </h4>
              <p className="font-mono text-xs text-ink mt-1">
                {t.courseCode} · {t.startTime} {t.endTime}
              </p>
              <p className="font-serif italic text-xs text-muted mt-1">{t.facultyName}</p>
            </div>
          ))}
        </div>
      )}
      <TimetableModal
        isOpen={open}
        onClose={() => setOpen(false)}
        initialData={edit}
        onSubmit={(d) => {
          if (edit && onUpdate) onUpdate(d);
          else onAdd(d);
          setOpen(false);
        }}
      />
    </div>
  );
}

/* ============================================================
   FACULTY / PROFESSOR CONSOLE
   ============================================================ */
export function FacultyDashboard(props: {
  currentTab: string;
  currentUser: User | null;
  courses: Course[];
  students: User[];
  attendanceRecords: AttendanceRecord[];
  grades: GradeRecord[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  timetable: TimetableSlot[];
  leaves: LeaveRequest[];
  notices: Notice[];
  onSubmitAttendance: (r: Partial<AttendanceRecord>[]) => void;
  onSubmitGrade: (g: Partial<GradeRecord>) => void;
  onCreateAssignment: (a: Partial<Assignment>) => void;
  onGradeSubmission: (submissionId: number, marks: string, feedback: string) => void;
  onReviewLeave: (id: number, status: "approved" | "rejected", remarks?: string) => void;
  onAddLeave: (d: { fromDate: string; toDate: string; reason: string }) => void;
  onAddNotice: (d: Partial<Notice>) => void;
  onDeleteNotice: (id: number) => void;
  permissions: PermissionRow[];
  onAddTimetable: (d: Partial<TimetableSlot>) => void;
  onDeleteTimetable: (id: number) => void;
  enrollments: Enrollment[];
  internalMarks: InternalMark[];
  facultyAttendance: FacultyAttendance[];
  feeRecords: FeeRecord[];
  feePayments: FeePayment[];
  onPayFee: (id: number, amount?: number, method?: string) => void;
  onSaveMarks: (rows: Partial<InternalMark>[], status?: string) => void;
  onDeleteMark: (id: number) => void;
  onChangeMarkStatus: (courseId: number, examType: string, status: string) => void;
}) {
  const {
    currentTab,
    currentUser,
    courses,
    students,
    attendanceRecords,
    grades,
    assignments,
    submissions,
    timetable,
    leaves,
    notices,
    enrollments,
    internalMarks,
    facultyAttendance,
    feeRecords,
    feePayments,
    onPayFee,
    onSubmitAttendance,
    onSubmitGrade,
    onCreateAssignment,
    onGradeSubmission,
    onReviewLeave,
    onAddLeave,
    onAddNotice,
    onDeleteNotice,
    permissions,
    onAddTimetable,
    onDeleteTimetable,
    onSaveMarks,
    onDeleteMark,
    onChangeMarkStatus,
  } = props;

  // Faculty cannot review their own leave requests.
  const reviewLeaves = leaves.filter((l) => l.studentId !== currentUser?.id);

  // Faculty can mark attendance for the courses assigned to them, with fallback to all courses catalog.
  const ownedCourses = courses.filter(
    (c) => c.facultyId === currentUser?.id || c.facultyName === currentUser?.name,
  );
  const availableCourses = ownedCourses.length > 0 ? ownedCourses : courses;
  const [courseId, setCourseId] = useState<number>(availableCourses[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState("Lecture 1 (09:00 - 10:30)");
  const rollCourse = availableCourses.find((c) => c.id === courseId) || availableCourses[0];
  // Only students enrolled in the selected course appear on the roll sheet.
  const enrolledIds = new Set(
    enrollments.filter((e) => e.courseId === (rollCourse?.id ?? -1)).map((e) => e.studentId),
  );
  const rollStudents = enrolledIds.size > 0 ? students.filter((s) => enrolledIds.has(s.id)) : students;
  const [sheet, setSheet] = useState<Record<number, "present" | "absent" | "late">>({});
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const statusOf = (id: number) => sheet[id] || "present";
  const setStatus = (id: number, s: "present" | "absent" | "late") => {
    setSheet((p) => ({ ...p, [id]: s }));
    setTouched((p) => ({ ...p, [id]: true }));
  };
  const markAll = (s: "present" | "absent" | "late") => {
    const n: Record<number, "present" | "absent" | "late"> = {};
    const t: Record<number, boolean> = {};
    rollStudents.forEach((x) => {
      n[x.id] = s;
      t[x.id] = true;
    });
    setSheet(n);
    setTouched(t);
  };
  const saveRoll = () => {
    // Only students the teacher actually marked get recorded no accidental
    // "present" defaults for students who were never touched.
    const rows = rollStudents
      .filter((s) => touched[s.id])
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        courseId: rollCourse?.id || 0,
        courseCode: rollCourse?.code || "UNASSIGNED",
        date,
        period,
        status: statusOf(s.id),
        markedBy: currentUser?.name || "Dr. Tanya Mishra",
      }));
    onSubmitAttendance(rows);
  };

  // grades
  const [gStu, setGStu] = useState(students[0]?.id || 1);
  const [gExam, setGExam] = useState("Mid-Term Case Test");
  const [gMarks, setGMarks] = useState("90");
  const [gRemark, setGRemark] = useState("Boardroom-grade defence of the case.");
  const [gradeMode, setGradeMode] = useState<"batch" | "single">("batch");
  const [batchScores, setBatchScores] = useState<Record<number, string>>({});
  const [batchRemarks, setBatchRemarks] = useState<Record<number, string>>({});
  const [gradeSearch, setGradeSearch] = useState("");
  const [isSavingBatchGrades, setIsSavingBatchGrades] = useState(false);

  const letter = (m: number) => (m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B" : m >= 60 ? "C" : "F");

  const postGrade = (e: FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === Number(gStu));
    if (!st) return;
    const m = parseFloat(gMarks) || 0;
    onSubmitGrade({
      studentId: st.id,
      studentName: st.name,
      courseId: rollCourse?.id || 1,
      courseName: `${rollCourse?.name || "Corporate Finance"} (${rollCourse?.code || "FIN601"})`,
      examType: gExam,
      marksObtained: String(m),
      maxMarks: "100.00",
      gradeLetter: letter(m),
      semester: st.semester || 3,
      remarks: gRemark,
    });
  };

  const saveBatchGrades = async () => {
    const toSave = rollStudents.filter((s) => batchScores[s.id] !== undefined && batchScores[s.id].trim() !== "");
    if (toSave.length === 0) return;
    setIsSavingBatchGrades(true);
    try {
      for (const st of toSave) {
        const m = parseFloat(batchScores[st.id]) || 0;
        await onSubmitGrade({
          studentId: st.id,
          studentName: st.name,
          courseId: rollCourse?.id || 1,
          courseName: `${rollCourse?.name || "Corporate Finance"} (${rollCourse?.code || "FIN601"})`,
          examType: gExam,
          marksObtained: String(m),
          maxMarks: "100.00",
          gradeLetter: letter(m),
          semester: st.semester || 3,
          remarks: batchRemarks[st.id] || "Academic evaluation record",
        });
      }
      setBatchScores({});
      setBatchRemarks({});
    } finally {
      setIsSavingBatchGrades(false);
    }
  };

  // assignment
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aDue, setADue] = useState("2026-04-12");
  const postAsg = (e: FormEvent) => {
    e.preventDefault();
    if (!aTitle || !aDesc) return;
    onCreateAssignment({
      courseId: 1,
      courseName: `Corporate Finance & Valuation (${rollCourse?.code || "FIN601"})`,
      title: aTitle,
      description: aDesc,
      dueDate: aDue,
      maxMarks: 50,
      facultyName: currentUser?.name || "Dr. Tanya Mishra",
    });
    setATitle("");
    setADesc("");
  };

  const presentPct = (() => {
    const recs = attendanceRecords.filter((a) => a.courseId === (rollCourse?.id ?? -1));
    if (recs.length === 0) return 86;
    return Math.round((recs.filter((a) => a.status === "present").length / recs.length) * 100);
  })();

  return (
    <div className="space-y-6">
      <PanelHeader
        tag="Teacher Console"
        title={currentUser?.name?.split(" ").slice(-1)[0] || "Mishra"}
        accent="- Desk"
        sub={`${currentUser?.designation || "Teacher"} - ${currentUser?.department || "Finance"}`}
        right={
          <div className="flex items-center gap-2 border-2 border-paper bg-ink-2 px-3 py-2">
            <Clock className="w-4 h-4 text-blood" />
            <span className="font-mono text-[11px] text-paper">
              Next: <strong className="text-blood">FIN601 · BL-301 · 09:00</strong>
            </span>
          </div>
        }
      />

      {(currentTab === "overview") && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat mark="01" label="Classes / Week" value={timetable.length} unit="slots" foot="This week" Icon={Calendar} />
            <Stat mark="02" label="Attendance Rate" value={`${presentPct}%`} foot="Last 6 classes" dark accent Icon={CheckSquare} />
            <Stat mark="03" label="Grades Entered" value={grades.length} foot="This term" Icon={Award} />
            <Stat mark="04" label="Pending Tasks" value={assignments.length} foot="Awaiting submissions" Icon={FileText} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 border-2 border-ink bg-paper hard p-5">
              <SectionTitle kicker="Quick action" title="Today's" accent="Attendance" sub="Mark attendance for the current class." />
              <div className="mt-4 flex flex-wrap gap-2">
                <BrutalButton tone="blood" onClick={() => { /* jump handled by sidebar; here just seed sheet */ markAll("present"); }}>
                  <CheckSquare className="w-4 h-4" /> Mark All Present
                </BrutalButton>
                <BrutalButton tone="ink" onClick={saveRoll}>
                  <Send className="w-4 h-4" /> Save Attendance
                </BrutalButton>
              </div>
              <div className="mt-4 border-2 border-ink overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={TH}>Scholar</th><th className={TH}>Roll</th><th className={TH + " text-center"}>Status</th></tr></thead>
                  <tbody>
                    {students.slice(0, 4).map((s) => (
                      <tr key={s.id} className="border-b-2 border-ink/10">
                        <td className={TD}><div className="flex items-center gap-2"><SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} /><span className="font-serif font-semibold">{s.name}</span></div></td>
                        <td className={`${TD} font-mono text-[11px] text-blood`}>{s.rollNo}</td>
                        <td className={TD}><StatusToggle value={statusOf(s.id)} onChange={(v) => setStatus(s.id, v)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-2 border-ink bg-ink text-paper hard p-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">This Week · Timetable</span>
              <div className="mt-3 space-y-2">
                {timetable.slice(0, 4).map((t) => (
                  <div key={t.id} className="border border-paper/20 p-2 hover:border-blood">
                    <div className="flex items-center justify-between">
                      <Stamp>{t.courseCode}</Stamp>
                      <span className="font-mono text-[10px] text-paper/60">{t.dayOfWeek}</span>
                    </div>
                    <p className="font-serif text-xs text-paper/90 mt-1">{t.startTime} {t.endTime} · {t.room}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ROLL CALL */}
      {currentTab === "attendance" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="02"
            kicker="Attendance"
            title="Mark"
            accent="Attendance"
            sub="Mark present, absent or late for each student."
            right={
              <>
                <BrutalButton tone="ghost" onClick={() => markAll("present")}>All Present</BrutalButton>
                <BrutalButton tone="blood" onClick={saveRoll}><Send className="w-4 h-4" /> Submit</BrutalButton>
              </>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Course">
              <select className={INPUT} value={rollCourse?.id || 0} onChange={(e) => setCourseId(Number(e.target.value))} disabled={availableCourses.length === 0}>
                {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
              </select>
            </Field>
            <Field label="Session Date"><input type="date" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Period"><select className={INPUT} value={period} onChange={(e) => setPeriod(e.target.value)}><option>Lecture 1 (09:00 - 10:30)</option><option>Lecture 2 (11:00 - 12:30)</option><option>Case Lab (14:00 - 16:00)</option></select></Field>
          </div>
          <div className="overflow-x-auto border-2 border-ink">
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Scholar</th><th className={TH}>Roll</th><th className={TH}>Area</th><th className={TH + " text-center"}>Attendance</th></tr></thead>
              <tbody>
                {rollStudents.map((s) => (
                  <tr key={s.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                    <td className={TD}><div className="flex items-center gap-2.5"><SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} /><span className="font-serif font-semibold group-hover:text-blood">{s.name}</span></div></td>
                    <td className={`${TD} font-mono text-[11px] text-blood`}>{s.rollNo}</td>
                    <td className={`${TD} text-muted`}>{s.department}</td>
                    <td className={TD}><StatusToggle value={statusOf(s.id)} onChange={(v) => setStatus(s.id, v)} /></td>
                  </tr>
                ))}
                {rollStudents.length === 0 && <tr><td colSpan={4}><div className="p-4"><EmptyState label="No students enrolled in this course" hint="Enroll students from Academic Setup first." /></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRADES */}
      {currentTab === "grades" && (
        <div className="space-y-5">
          {/* Mode Header */}
          <div className="border-2 border-ink bg-paper hard p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle kicker="Assessment" title="Class" accent="Gradebook" sub="Record grades for the entire class or single scholar." />
            </div>
            <div className="flex items-center gap-2 border-2 border-ink bg-paper-2 p-1 hard-sm">
              <button
                type="button"
                onClick={() => setGradeMode("batch")}
                className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  gradeMode === "batch" ? "bg-ink text-paper" : "text-ink hover:bg-paper"
                }`}
              >
                Batch Class Sheet ({rollStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setGradeMode("single")}
                className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  gradeMode === "single" ? "bg-ink text-paper" : "text-ink hover:bg-paper"
                }`}
              >
                Single Scholar Form
              </button>
            </div>
          </div>

          {gradeMode === "single" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <form onSubmit={postGrade} className="border-2 border-ink bg-paper hard p-5 space-y-3.5 h-fit">
                <SectionTitle kicker="Single Entry" title="Record" accent="Grade" />
                <Field label="Scholar">
                  <select className={INPUT} value={gStu} onChange={(e) => setGStu(Number(e.target.value))}>
                    {students.map((s) => (<option key={s.id} value={s.id}>{s.name} - {s.rollNo}</option>))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Exam Type">
                    <select className={INPUT} value={gExam} onChange={(e) => setGExam(e.target.value)}>
                      <option>Mid-Term Case Test</option>
                      <option>Final Examination</option>
                      <option>Continuous Assignment</option>
                      <option>Sessional Quiz</option>
                    </select>
                  </Field>
                  <Field label="Score">
                    <input type="number" min={0} max={100} step="0.5" className={INPUT + " font-display text-blood"} value={gMarks} onChange={(e) => setGMarks(e.target.value)} />
                  </Field>
                </div>
                <Field label="Teacher Remark">
                  <input className={INPUT} value={gRemark} onChange={(e) => setGRemark(e.target.value)} />
                </Field>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px] text-muted">Computed letter · <span className="text-blood font-bold">{letter(parseFloat(gMarks) || 0)}</span></span>
                  <BrutalButton type="submit" tone="blood">Record Grade</BrutalButton>
                </div>
              </form>

              {/* Directory of Recorded Grades (Right side in Single Entry Mode) */}
              <div className="lg:col-span-2 border-2 border-ink bg-paper hard">
                <div className="px-4 py-3 border-b-2 border-ink bg-paper-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">Recent Recorded Grades</span>
                    <Tag tone="ink">{grades.length}</Tag>
                  </div>
                  <div className="w-56 max-w-[40vw]">
                    <input
                      type="text"
                      placeholder="Search student or exam..."
                      className={INPUT + " text-xs py-1 px-2.5"}
                      value={gradeSearch}
                      onChange={(e) => setGradeSearch(e.target.value)}
                    />
                  </div>
                </div>
                {grades.length === 0 ? (
                  <div className="p-4"><EmptyState label="No grades recorded yet" hint="Record a grade on the left." /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={TH}>Scholar</th>
                          <th className={TH}>Course</th>
                          <th className={TH}>Component</th>
                          <th className={TH}>Score</th>
                          <th className={TH}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades
                          .filter((g) =>
                            gradeSearch === ""
                              ? true
                              : g.studentName.toLowerCase().includes(gradeSearch.toLowerCase()) ||
                                g.examType.toLowerCase().includes(gradeSearch.toLowerCase()) ||
                                g.courseName.toLowerCase().includes(gradeSearch.toLowerCase())
                          )
                          .map((g) => (
                            <tr key={g.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                              <td className={`${TD} font-serif font-semibold`}>{g.studentName}</td>
                              <td className={`${TD} text-muted`}>{g.courseName}</td>
                              <td className={`${TD} font-mono text-[11px] text-blood`}>{g.examType}</td>
                              <td className={`${TD} font-mono font-bold`}>{g.marksObtained}</td>
                              <td className={TD}>
                                <span className="font-display text-blood border-2 border-ink px-2 py-0.5 bg-paper-3 font-bold">
                                  {g.gradeLetter}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Batch Class Sheet */}
              <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-2 border-ink bg-paper-2 p-3">
                  <Field label="Course / Subject">
                    <select className={INPUT} value={rollCourse?.id || 0} onChange={(e) => setCourseId(Number(e.target.value))} disabled={availableCourses.length === 0}>
                      {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Assessment / Exam Type">
                    <select className={INPUT} value={gExam} onChange={(e) => setGExam(e.target.value)}>
                      <option>Mid-Term Case Test</option>
                      <option>Final Examination</option>
                      <option>Continuous Assignment</option>
                      <option>Sessional Quiz</option>
                      <option>Practical Viva</option>
                    </select>
                  </Field>
                  <div className="flex items-end justify-end">
                    <BrutalButton
                      tone="blood"
                      onClick={saveBatchGrades}
                      disabled={isSavingBatchGrades || Object.keys(batchScores).filter((k) => batchScores[Number(k)]?.trim()).length === 0}
                    >
                      <Send className="w-4 h-4" /> Save All Grades ({Object.keys(batchScores).filter((k) => batchScores[Number(k)]?.trim()).length})
                    </BrutalButton>
                  </div>
                </div>

                <div className="overflow-x-auto border-2 border-ink">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className={TH}>Scholar</th>
                        <th className={TH}>Roll No</th>
                        <th className={TH}>Department</th>
                        <th className={TH + " w-36"}>Score (/100)</th>
                        <th className={TH + " text-center"}>Grade</th>
                        <th className={TH}>Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rollStudents.map((s, idx) => {
                        const val = batchScores[s.id] || "";
                        const num = parseFloat(val);
                        const hasVal = !isNaN(num) && val.trim() !== "";
                        const currentLetter = hasVal ? letter(num) : "-";
                        return (
                          <tr key={s.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                            <td className={TD}>
                              <div className="flex items-center gap-2.5">
                                <SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} />
                                <span className="font-serif font-semibold group-hover:text-blood">{s.name}</span>
                              </div>
                            </td>
                            <td className={`${TD} font-mono text-[11px] text-blood`}>{s.rollNo}</td>
                            <td className={`${TD} text-muted`}>{s.department}</td>
                            <td className={TD}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                tabIndex={idx + 1}
                                placeholder="Marks"
                                className={INPUT + " font-display text-blood font-bold"}
                                value={val}
                                onChange={(e) => setBatchScores((p) => ({ ...p, [s.id]: e.target.value }))}
                              />
                            </td>
                            <td className={TD + " text-center"}>
                              <span className={`font-display border-2 border-ink px-2.5 py-1 text-xs font-bold ${hasVal ? "bg-ink text-paper" : "bg-paper-3 text-muted"}`}>
                                {currentLetter}
                              </span>
                            </td>
                            <td className={TD}>
                              <input
                                placeholder="Optional remark..."
                                className={INPUT + " text-xs"}
                                value={batchRemarks[s.id] || ""}
                                onChange={(e) => setBatchRemarks((p) => ({ ...p, [s.id]: e.target.value }))}
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {rollStudents.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="p-4">
                              <EmptyState label="No scholars enrolled in this course" hint="Select another course or enroll scholars." />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Directory of Recorded Grades (Below batch sheet) */}
              <div className="border-2 border-ink bg-paper hard">
                <div className="px-4 py-3 border-b-2 border-ink bg-paper-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">Recent Recorded Grades</span>
                    <Tag tone="ink">{grades.length}</Tag>
                  </div>
                  <div className="w-64 max-w-[50vw]">
                    <input
                      type="text"
                      placeholder="Search student or exam..."
                      className={INPUT + " text-xs py-1 px-2.5"}
                      value={gradeSearch}
                      onChange={(e) => setGradeSearch(e.target.value)}
                    />
                  </div>
                </div>
                {grades.length === 0 ? (
                  <div className="p-4"><EmptyState label="No grades recorded yet" hint="Record class grades using the batch sheet above." /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={TH}>Scholar</th>
                          <th className={TH}>Course</th>
                          <th className={TH}>Component</th>
                          <th className={TH}>Score</th>
                          <th className={TH}>Grade</th>
                          <th className={TH}>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades
                          .filter((g) =>
                            gradeSearch === ""
                              ? true
                              : g.studentName.toLowerCase().includes(gradeSearch.toLowerCase()) ||
                                g.examType.toLowerCase().includes(gradeSearch.toLowerCase()) ||
                                g.courseName.toLowerCase().includes(gradeSearch.toLowerCase())
                          )
                          .map((g) => (
                            <tr key={g.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                              <td className={`${TD} font-serif font-semibold`}>{g.studentName}</td>
                              <td className={`${TD} text-muted`}>{g.courseName}</td>
                              <td className={`${TD} font-mono text-[11px] text-blood`}>{g.examType}</td>
                              <td className={`${TD} font-mono font-bold`}>{g.marksObtained}</td>
                              <td className={TD}>
                                <span className="font-display text-blood border-2 border-ink px-2 py-0.5 bg-paper-3 font-bold">
                                  {g.gradeLetter}
                                </span>
                              </td>
                              <td className={`${TD} text-xs text-muted max-w-xs truncate`}>{g.remarks || "-"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* EXAM MARKS (faculty) */}
      {currentTab === "marks" && (
        <FacultyMarksEntryTab
          courses={courses}
          enrollments={enrollments}
          marks={internalMarks}
          currentUser={currentUser}
          onSaveMarks={onSaveMarks}
          onChangeMarkStatus={onChangeMarkStatus}
        />
      )}

      {/* MY ATTENDANCE (faculty) */}
      {currentTab === "myattendance" && (
        <FacultyMyAttendanceTab records={facultyAttendance} currentUser={currentUser} />
      )}

      {/* ASSIGNMENTS */}
      {currentTab === "assignments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={postAsg} className="border-2 border-ink bg-paper hard p-5 space-y-3.5 h-fit">
            <SectionTitle kicker="Assignment" title="Create" accent="Task" />
            <Field label="Title"><input className={INPUT} value={aTitle} onChange={(e) => setATitle(e.target.value)} required placeholder="e.g. Group project on finance" /></Field>
            <Field label="Due Date"><input type="date" className={INPUT} value={aDue} onChange={(e) => setADue(e.target.value)} /></Field>
            <Field label="Details"><textarea rows={5} className={INPUT} value={aDesc} onChange={(e) => setADesc(e.target.value)} required placeholder="What students need to do..." /></Field>
            <BrutalButton type="submit" tone="ink" className="w-full"><Send className="w-4 h-4" /> Post Assignment</BrutalButton>
          </form>
          <div className="lg:col-span-2 space-y-4">
            <SectionTitle kicker="Active" title={`Assignments`} accent={`(${assignments.length})`} />
            {assignments.length === 0 && <EmptyState label="No assignments posted" />}
            {assignments.map((a) => (
              <article key={a.id} className="lift border-2 border-ink bg-paper hard p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <Stamp>{a.courseName.split("(")[1]?.replace(")", "") || "CASE"}</Stamp>
                  <span className="font-mono text-[10px] text-muted">Due {a.dueDate} · {a.maxMarks} marks</span>
                </div>
                <h4 className="font-display uppercase text-sm text-ink">{a.title}</h4>
                <p className="font-serif text-sm text-ink/80 mt-1">{a.description}</p>
                <p className="mt-2 font-mono text-[10px] text-blood">Posted by {a.facultyName}</p>
              </article>
            ))}

            {/* submissions to grade */}
            <div className="border-2 border-ink bg-paper hard">
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-paper-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">
                  Submissions to grade
                </span>
                <Tag tone="blood">{submissions.length}</Tag>
              </div>
              {submissions.length === 0 ? (
                <div className="p-4"><EmptyState label="No submissions yet" hint="Submissions will appear here once students upload work." /></div>
              ) : (
                <div className="divide-y-2 divide-ink/10">
                  {submissions.map((s) => (
                    <SubmissionRow
                      key={s.id}
                      sub={s}
                      onGrade={(marks, feedback) => onGradeSubmission(s.id, marks, feedback)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEAVE APPROVALS */}
      {currentTab === "leaves" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="06"
            kicker="Leave Office"
            title="Leave"
            accent="Requests"
            sub="Review scholar leave applications and approve or reject them."
            right={
              <div className="flex items-center gap-2">
                <Tag tone="blood">{reviewLeaves.filter((l) => l.status === "pending").length} pending</Tag>
                <Tag tone="ink">{reviewLeaves.filter((l) => l.status === "approved").length} approved</Tag>
              </div>
            }
          />
          {reviewLeaves.length === 0 ? (
            <EmptyState label="No leave requests" hint="Student applications will appear here." />
          ) : (
            <div className="space-y-3">
              {reviewLeaves.map((l) => (
                <div key={l.id} className="lift border-2 border-ink bg-paper-3 hard p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SquareAvatar src={null} initial={l.studentName.charAt(0)} className="!h-8 !w-8" />
                        <div className="leading-tight">
                          <p className="font-display uppercase text-sm text-ink">{l.studentName}</p>
                          <p className="font-mono text-[10px] text-muted">{l.rollNo} · {l.department}</p>
                        </div>
                        <span className="ml-auto">
                          <Tag tone={l.status === "approved" ? "ink" : l.status === "rejected" ? "paper" : "blood"}>
                            {l.status}
                          </Tag>
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-blood">
                        {l.fromDate} → {l.toDate}
                      </p>
                      <p className="font-serif text-sm text-ink/80 mt-1.5">“{l.reason}”</p>
                      {(l.remarks || l.reviewedBy) && (
                        <p className="mt-2 font-mono text-[10px] text-muted">
                          {l.reviewedBy && <>Reviewed by {l.reviewedBy} · </>}
                          {l.remarks && <span className="text-ink">“{l.remarks}”</span>}
                        </p>
                      )}
                    </div>
                    {l.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <BrutalButton tone="ink" onClick={() => onReviewLeave(l.id, "approved", "Approved")}>
                          <Check className="w-4 h-4" /> Approve
                        </BrutalButton>
                        <BrutalButton tone="blood" onClick={() => onReviewLeave(l.id, "rejected", "Rejected")}>
                          <X className="w-4 h-4" /> Reject
                        </BrutalButton>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIMETABLE */}
      {currentTab === "timetable" && (
        <AdminTimetablePanel
          slots={timetable}
          onAdd={onAddTimetable}
          onDelete={onDeleteTimetable}
        />
      )}

      {/* NOTICES (faculty) */}
      {currentTab === "notices" && (
        <FacultyNoticesTab
          notices={notices}
          currentUser={currentUser}
          permissions={permissions}
          onAddNotice={onAddNotice}
          onDeleteNotice={onDeleteNotice}
        />
      )}

      {/* PERFORMANCE (faculty) */}
      {currentTab === "performance" && (
        <FacultyPerformanceTab
          students={students}
          attendance={attendanceRecords}
          grades={grades}
          courses={courses}
          enrollments={enrollments}
        />
      )}

      {/* MY LEAVE (faculty) */}
      {currentTab === "myleave" && (
        <FacultyLeaveTab leaves={leaves} currentUser={currentUser} onAddLeave={onAddLeave} />
      )}

      {/* FEES (faculty collection) */}
      {currentTab === "fees" && (
        <FacultyFeesTab
          currentUser={currentUser}
          students={students}
          courses={courses}
          enrollments={enrollments}
          feeRecords={feeRecords}
          feePayments={feePayments}
          onPayFee={onPayFee}
        />
      )}
    </div>
  );
}

function SubmissionRow({
  sub,
  onGrade,
}: {
  sub: AssignmentSubmission;
  onGrade: (marks: string, feedback: string) => void;
}) {
  const [marks, setMarks] = useState(sub.marks || "");
  const [feedback, setFeedback] = useState(sub.feedback || "");

  const save = (e: FormEvent) => {
    e.preventDefault();
    onGrade(marks, feedback);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="leading-tight min-w-0">
          <p className="font-display uppercase text-xs text-ink truncate">{sub.studentName}</p>
          <p className="font-mono text-[10px] text-muted truncate">{sub.submissionText || "No notes"}</p>
        </div>
        <span className="shrink-0">
          <Tag tone={sub.status === "graded" ? "ink" : "blood"}>{sub.status}</Tag>
        </span>
      </div>
      {sub.fileUrl && (
        <a
          href={sub.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-blood underline underline-offset-4 hover:text-ink"
        >
          <FileText className="w-3 h-3" /> {sub.fileUrl}
        </a>
      )}
      <form onSubmit={save} className="mt-3 grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 items-end">
        <Field label="Marks">
          <input
            type="number"
            min={0}
            step="0.5"
            className={INPUT}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="out of 100"
          />
        </Field>
        <Field label="Feedback">
          <input
            className={INPUT}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Short note to the scholar..."
          />
        </Field>
        <BrutalButton type="submit" tone={sub.status === "graded" ? "ink" : "blood"}>
          {sub.status === "graded" ? "Re-grade" : "Grade"}
        </BrutalButton>
      </form>
    </div>
  );
}

function StatusToggle({
  value,
  onChange,
}: {
  value: "present" | "absent" | "late";
  onChange: (v: "present" | "absent" | "late") => void;
}) {
  const opts: { k: "present" | "absent" | "late"; label: string; on: string }[] = [
    { k: "present", label: "P", on: "bg-ink text-paper border-ink" },
    { k: "absent", label: "A", on: "bg-blood text-paper border-ink" },
    { k: "late", label: "L", on: "bg-paper-2 text-ink border-ink" },
  ];
  return (
    <div className="flex items-center justify-center gap-1">
      {opts.map((o) => (
        <button
          key={o.k}
          type="button"
          onClick={() => onChange(o.k)}
          className={`h-7 w-7 border-2 font-mono text-[11px] font-bold transition-colors ${
            value === o.k ? o.on + " hard-sm" : "bg-paper text-muted border-ink/30 hover:border-ink"
          }`}
          title={o.k}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TimetableGrid({ slots }: { slots: TimetableSlot[] }) {
  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle index="05" kicker="Weekly" title="Class" accent="Timetable" sub="Rooms, timings and teachers for this term." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {slots.map((t) => (
          <div key={t.id} className="lift border-2 border-ink bg-paper-3 hard p-4">
            <div className="flex items-center justify-between mb-2">
              <Stamp>{t.dayOfWeek}</Stamp>
              <span className="font-mono text-[10px] text-blood border border-blood px-1.5 py-0.5">{t.room}</span>
            </div>
            <h4 className="font-display uppercase text-sm text-ink leading-tight">{t.courseName}</h4>
            <p className="font-mono text-xs text-ink mt-1">{t.startTime} {t.endTime}</p>
            <p className="font-serif italic text-xs text-muted mt-1">{t.facultyName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT PANEL
   ============================================================ */
export function StudentDashboard(props: {
  currentTab: string;
  currentUser: User | null;
  attendanceRecords: AttendanceRecord[];
  grades: GradeRecord[];
  feeRecords: FeeRecord[];
  feePayments: FeePayment[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  timetable: TimetableSlot[];
  notices: Notice[];
  leaves: LeaveRequest[];
  admissions: AdmissionInfo[];
  documents: StudentDocument[];
  exams: ExamSchedule[];
  enrollments: Enrollment[];
  internalMarks: InternalMark[];
  onTabChange: (t: string) => void;
  onPayFee: (id: number, amount?: number, method?: string) => void;
  onSubmitAssignment: (d: { assignmentId: number; text: string; fileUrl: string }) => void;
  onAddLeave: (d: { fromDate: string; toDate: string; reason: string }) => void;
  onUploadDocument: (d: { title: string; category: string; fileName: string; mimeType: string; fileSize: number; data: string }) => void;
  onDeleteDocument: (id: number) => void;
  onUpdateProfile: (d: { phone?: string; avatarUrl?: string }) => void;
  onSaveAdmission: (d: Partial<AdmissionInfo>) => void;
}) {
  const {
    currentTab,
    currentUser,
    attendanceRecords,
    grades,
    feeRecords,
    feePayments,
    assignments,
    submissions,
    timetable,
    notices,
    leaves,
    admissions,
    documents,
    exams,
    enrollments,
    internalMarks,
    onTabChange,
    onPayFee,
    onSubmitAssignment,
    onAddLeave,
    onUploadDocument,
    onDeleteDocument,
    onUpdateProfile,
    onSaveAdmission,
  } = props;

  // leave request form
  const [lFrom, setLFrom] = useState(new Date().toISOString().slice(0, 10));
  const [lTo, setLTo] = useState(new Date().toISOString().slice(0, 10));
  const [lReason, setLReason] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const postLeave = (e: FormEvent) => {
    e.preventDefault();
    if (!lFrom || !lTo || !lReason) return;
    if (lFrom > lTo) {
      setLeaveError("The 'to' date must be on or after the 'from' date");
      return;
    }
    onAddLeave({ fromDate: lFrom, toDate: lTo, reason: lReason });
    setLReason("");
    setLeaveError("");
  };

  const gradedOf = (assignmentId: number) =>
    submissions.find((s) => s.assignmentId === assignmentId);

  const [receipt, setReceipt] = useState<FeeRecord | null>(null);
  const [payRecord, setPayRecord] = useState<FeeRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<FeeRecord | null>(null);
  const [submitAsg, setSubmitAsg] = useState<Assignment | null>(null);
  const [sText, setSText] = useState("");
  const [sUrl, setSUrl] = useState("https://vscms.edu/drive/scholar-memo.pdf");
  const [attMonth, setAttMonth] = useState("all");

  const mine = attendanceRecords.filter(
    (a) => !currentUser || a.studentId === currentUser.id || a.studentName === currentUser.name,
  );
  const total = mine.length || 12;
  const present = mine.length
    ? mine.filter((a) => a.status === "present").length
    : Math.round(total * 0.88);
  const pct = Math.round((present / total) * 100);
  const months = Array.from(new Set(mine.map((a) => a.date.slice(0, 7)))).sort().reverse();
  const filtered = attMonth === "all" ? mine : mine.filter((a) => a.date.slice(0, 7) === attMonth);
  const subjectRows = Array.from(new Set(mine.map((a) => a.courseCode))).map((code) => {
    const rows = mine.filter((a) => a.courseCode === code);
    const pr = rows.filter((a) => a.status === "present").length;
    return { code, total: rows.length, present: pr, pct: rows.length ? Math.round((pr / rows.length) * 100) : 0 };
  });

  const myFees = feeRecords.filter(
    (f) => !currentUser || f.studentName === currentUser.name || f.studentId === currentUser.id,
  );
  const overdueMine = myFees.filter((f) => feeEffectiveStatus(f) === "overdue");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!submitAsg) return;
    onSubmitAssignment({ assignmentId: submitAsg.id, text: sText, fileUrl: sUrl });
    setSubmitAsg(null);
    setSText("");
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        tag="Student View"
        title={currentUser?.name?.split(" ")[0] || "Aarav"}
        accent="- Record"
        sub={`${currentUser?.department || "Finance"} - Sem ${currentUser?.semester || 3} - Student`}
        right={
          <div className="border-2 border-paper bg-ink-2 px-4 py-2 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/60">Cumulative CGPA</p>
            <p className="font-display text-3xl text-blood leading-none mt-1">
              {currentUser?.gpa || "3.81"} <span className="text-paper/50 text-sm">/ 4.0</span>
            </p>
          </div>
        }
      />

      {(currentTab === "overview") && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat mark="01" label="Attendance" value={`${pct}%`} foot={`${present} / ${total} classes`} accent Icon={CheckSquare} />
            <Stat mark="02" label="CGPA" value={currentUser?.gpa || "3.81"} unit="/ 4.0" foot="Current standing" dark Icon={Award} />
            <Stat mark="03" label="Pending Fees" value={myFees.filter((f) => f.status === "pending").length} unit="bills" foot="Pay before due date" Icon={DollarSign} />
            <Stat mark="04" label="Assignments" value={assignments.length} foot="Submit before deadline" Icon={FileText} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 border-2 border-ink bg-paper hard p-5">
              <SectionTitle kicker="Compliance" title="Attendance" accent="Status" sub="The institute requires 75% attendance for exam eligibility." />
              <div className="mt-4 flex items-center justify-between font-mono text-[11px]">
                <span className="uppercase tracking-[0.16em] text-muted">Semester rate</span>
                <span className={`font-bold ${pct >= 75 ? "text-ink" : "text-blood"}`}>{pct}% - {pct >= 75 ? "OK" : "LOW"}</span>
              </div>
              <div className="mt-2"><Meter value={pct} /></div>
              {/* Attendance Composition Breakdown */}
              <div className="mt-3 border-2 border-ink bg-paper-2 hard p-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="font-bold text-ink">Composition</span>
                  <span className="text-muted">Total Marked Classes · <strong className="text-ink font-bold">{total}</strong></span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="border-2 border-ink bg-paper p-2 hard-sm">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Present</p>
                    <p className="font-display text-sm sm:text-base font-bold text-ink leading-tight mt-0.5">
                      {present} <span className="font-mono text-[10px] text-muted font-normal">({total > 0 ? Math.round((present / total) * 100) : 0}%)</span>
                    </p>
                  </div>
                  <div className="border-2 border-ink bg-paper p-2 hard-sm">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Late</p>
                    <p className="font-display text-sm sm:text-base font-bold text-ink leading-tight mt-0.5">
                      {mine.filter((a) => a.status === "late").length} <span className="font-mono text-[10px] text-muted font-normal">({total > 0 ? Math.round((mine.filter((a) => a.status === "late").length / total) * 100) : 0}%)</span>
                    </p>
                  </div>
                  <div className="border-2 border-ink bg-paper p-2 hard-sm">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted">Absent</p>
                    <p className="font-display text-sm sm:text-base font-bold text-ink leading-tight mt-0.5">
                      {mine.filter((a) => a.status === "absent").length} <span className="font-mono text-[10px] text-muted font-normal">({total > 0 ? Math.round((mine.filter((a) => a.status === "absent").length / total) * 100) : 0}%)</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto border-2 border-ink">
                <table className="w-full text-sm">
                  <thead><tr><th className={TH}>Date</th><th className={TH}>Course</th><th className={TH}>Period</th><th className={TH}>Status</th></tr></thead>
                  <tbody>
                    {mine.slice(0, 5).map((a) => (
                      <tr key={a.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                        <td className={`${TD} font-mono text-[11px]`}>{a.date}</td>
                        <td className={`${TD} font-mono text-[11px] text-blood`}>{a.courseCode}</td>
                        <td className={`${TD} text-muted`}>{a.period || "-"}</td>
                        <td className={TD}><Tag tone={a.status === "present" ? "ink" : "blood"}>{a.status}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-2 border-ink bg-ink text-paper hard p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">Notices</span>
                <Bell className="w-4 h-4 text-blood" />
              </div>
              <div className="space-y-2">
                {notices.slice(0, 4).map((n) => (
                  <div key={n.id} className="border border-paper/20 p-2 hover:border-blood">
                    <div className="flex items-center justify-between mb-1">
                      <Tag tone={n.priority === "urgent" ? "blood" : "paper"}>{n.category}</Tag>
                      <span className="font-mono text-[9px] text-paper/50">{n.publishedDate}</span>
                    </div>
                    <p className="font-serif text-[12px] text-paper/90 line-clamp-2">{n.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {currentTab === "attendance" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle
            index="02"
            kicker="My Attendance"
            title="Attendance"
            accent="Record"
            sub="All classes marked by teachers."
            right={
              <Field label="Month">
                <select className={INPUT + " !w-36"} value={attMonth} onChange={(e) => setAttMonth(e.target.value)}>
                  <option value="all">All months</option>
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            }
          />

          {mine.length > 0 && pct < 75 && (
            <div className="border-2 border-blood bg-paper-3 hard p-4 flex flex-wrap items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-blood shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display uppercase text-sm text-blood">Attendance Alert</p>
                <p className="font-serif text-xs text-ink/80 mt-0.5">
                  Your attendance is <strong>{pct}%</strong> below the required 75%. The institute requires 75% attendance for exam eligibility. Please attend all remaining classes.
                </p>
              </div>
              <Tag tone="blood">At Risk</Tag>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Present</p><p className="font-display text-2xl">{present}</p></div>
            <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Absent</p><p className="font-display text-2xl text-blood">{total - present}</p></div>
            <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Total</p><p className="font-display text-2xl">{total}</p></div>
          </div>
          <Meter value={pct} />

          {/* Calendar view month grid with green/red cells */}
          <AttendanceCalendar
            records={mine}
            month={attMonth === "all" ? (months[0] || new Date().toISOString().slice(0, 7)) : attMonth}
            onMonthChange={(m) => setAttMonth(m)}
            scopeNote={attMonth === "all" ? "Showing the latest month with records pick a month above or use the arrows to explore." : undefined}
          />

          {/* Subject-wise attendance */}
          <div className="border-2 border-ink">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Subject-wise Attendance</span>
              <Tag tone="ink">{subjectRows.length} subjects</Tag>
            </div>
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Subject</th><th className={TH}>Classes</th><th className={TH}>Present</th><th className={TH}>Rate</th><th className={TH}>Status</th></tr></thead>
              <tbody>
                {subjectRows.map((r) => (
                  <tr key={r.code} className="border-b-2 border-ink/10">
                    <td className={TD}><span className="font-mono text-[11px] text-blood font-bold">{r.code}</span></td>
                    <td className={TD}><span className="font-mono text-[11px]">{r.total}</span></td>
                    <td className={TD}><span className="font-mono text-[11px]">{r.present}</span></td>
                    <td className={TD}>
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-2 border border-ink"><div className={`h-full ${r.pct >= 75 ? "hazard" : "bg-blood"}`} style={{ width: `${Math.min(100, r.pct)}%` }} /></div>
                        <span className="font-mono text-[11px]">{r.pct}%</span>
                      </div>
                    </td>
                    <td className={TD}><Tag tone={r.pct >= 75 ? "ink" : "blood"}>{r.pct >= 75 ? "OK" : "Low"}</Tag></td>
                  </tr>
                ))}
                {subjectRows.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No attendance records yet" /></div></td></tr>}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto border-2 border-ink">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Daily Record</span>
              <span className="font-mono text-[10px] text-muted">{filtered.length} classes</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Date</th><th className={TH}>Course</th><th className={TH}>Period</th><th className={TH}>Status</th><th className={TH}>Verified</th></tr></thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                    <td className={`${TD} font-mono text-[11px]`}>{a.date}</td>
                    <td className={`${TD} font-mono text-[11px] text-blood`}>{a.courseCode}</td>
                    <td className={`${TD} text-muted`}>{a.period || "-"}</td>
                    <td className={TD}><Tag tone={a.status === "present" ? "ink" : "blood"}>{a.status}</Tag></td>
                    <td className={`${TD} font-serif italic text-xs text-muted`}>{a.markedBy || "-"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No classes in this month" hint="Pick another month from the filter." /></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESULTS (student) internal exam result sheet */}
      {currentTab === "results" && (
        <StudentResultsTab marks={internalMarks} currentUser={currentUser} />
      )}

      {currentTab === "fees" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle index="04" kicker="Bursar" title="Fees &" accent="Receipts" sub="Pay online full or in installments and get a receipt for every transaction." />

          {overdueMine.length > 0 && (
            <div className="border-2 border-blood bg-paper-3 hard p-4 flex flex-wrap items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-blood shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display uppercase text-sm text-blood">Fee Due Action Needed</p>
                <p className="font-serif text-xs text-ink/80 mt-0.5">
                  {overdueMine.length} invoice(s) crossed their due date. Pay soon to keep your admit card unlocked.
                </p>
              </div>
              <Tag tone="blood">Overdue</Tag>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFees.length === 0 && <EmptyState label="No invoices on file" />}
            {myFees.map((f) => {
              const eff = feeEffectiveStatus(f);
              const rem = feeRemaining(f);
              const paidAmt = Number(f.paidAmount || 0);
              const totalAmt = Number(f.amount || 0);
              const pct = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;
              return (
                <div key={f.id} className="lift border-2 border-ink bg-paper-3 hard p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Tag tone={eff === "paid" ? "ink" : eff === "overdue" ? "blood" : "ink"}>{eff}</Tag>
                      <span className="font-mono text-[10px] text-muted">Due {f.dueDate}</span>
                    </div>
                    <p className="font-serif font-semibold text-ink">{f.feeType} {f.courseCode ? <span className="font-mono text-[10px] text-blood">· {f.courseCode}</span> : null}</p>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <p className="font-display text-3xl text-blood">{eff === "paid" ? "₹0.00" : `₹${rem.toFixed(2)}`}</p>
                      <span className="font-mono text-[10px] text-muted">
                        {eff === "paid" ? "paid in full" : paidAmt > 0 ? `remaining of ₹${totalAmt.toFixed(2)}` : "total due · no payments yet"}
                      </span>
                    </div>
                    {paidAmt > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1">
                          <span>Paid ₹{paidAmt.toFixed(2)}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 border border-ink bg-paper">
                          <div className={`h-full ${eff === "paid" ? "hazard" : "bg-blood"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-ink/25 grid grid-cols-2 gap-2">
                    {eff !== "paid" ? (
                      <BrutalButton tone="blood" className="w-full col-span-2" onClick={() => setPayRecord(f)}><DollarSign className="w-4 h-4" /> Pay ₹{rem.toFixed(2)}</BrutalButton>
                    ) : (
                      <BrutalButton tone="ink" className="w-full col-span-2" onClick={() => setReceipt(f)}><Printer className="w-4 h-4" /> Open Receipt</BrutalButton>
                    )}
                    <button
                      onClick={() => setHistoryRecord(f)}
                      className="col-span-2 border-2 border-ink px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-paper press"
                    >
                      Payment History ({feePayments.filter((p) => p.feeRecordId === f.id).length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentTab === "timetable" && <TimetableGrid slots={timetable} />}

      {currentTab === "assignments" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
          <SectionTitle index="06" kicker="Submissions" title="Cases &" accent="Briefs" sub="Upload your memo / model before the deadline stamp." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.length === 0 && <EmptyState label="No open briefs" />}
            {assignments.map((a) => {
              const done = gradedOf(a.id);
              return (
                <div key={a.id} className="lift border-2 border-ink bg-paper-3 hard p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Stamp>{a.courseName.split("(")[1]?.replace(")", "") || "CASE"}</Stamp>
                      <span className="font-mono text-[10px] text-muted">Due {a.dueDate}</span>
                    </div>
                    <h4 className="font-display uppercase text-sm text-ink">{a.title}</h4>
                    <p className="font-serif text-sm text-ink/80 mt-1">{a.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-ink/25 flex items-center justify-between gap-2">
                    {done?.status === "graded" ? (
                      <div className="flex items-center gap-2">
                        <Tag tone="ink">Graded {done.marks || "-"} / {a.maxMarks}</Tag>
                        {done.feedback && (
                          <span className="font-serif italic text-[11px] text-muted truncate" title={done.feedback}>
                            “{done.feedback}”
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] text-muted">{a.maxMarks} marks</span>
                    )}
                    <BrutalButton
                      tone={done ? "ink" : "blood"}
                      onClick={() => setSubmitAsg(a)}
                    >
                      {done ? "Resubmit" : "Submit"}
                    </BrutalButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEAVE REQUEST (student) */}
      {currentTab === "leave" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form onSubmit={postLeave} className="border-2 border-ink bg-paper hard p-5 h-fit space-y-3.5">
            <SectionTitle kicker="Leave Office" title="Apply for" accent="Leave" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="From"><input type="date" className={INPUT} value={lFrom} onChange={(e) => setLFrom(e.target.value)} required /></Field>
              <Field label="To"><input type="date" className={INPUT} value={lTo} onChange={(e) => setLTo(e.target.value)} required /></Field>
            </div>
            <Field label="Reason">
              <textarea rows={4} className={INPUT} value={lReason} onChange={(e) => setLReason(e.target.value)} required placeholder="Medical, family, college event..." />
            </Field>
            {leaveError && <p className="font-mono text-[11px] text-blood">{leaveError}</p>}
            <BrutalButton type="submit" tone="blood" className="w-full">
              <Send className="w-4 h-4" /> Submit Request
            </BrutalButton>
          </form>
          <div className="lg:col-span-2 space-y-3">
            <SectionTitle kicker="My requests" title={`Leave`} accent={`History (${leaves.length})`} />
            {leaves.length === 0 && <EmptyState label="No leave applications yet" hint="Use the form to apply for leave." />}
            {leaves.map((l) => (
              <article key={l.id} className="lift border-2 border-ink bg-paper hard p-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[11px] text-blood">{l.fromDate} → {l.toDate}</span>
                  <Tag tone={l.status === "approved" ? "ink" : l.status === "rejected" ? "paper" : "blood"}>
                    {l.status}
                  </Tag>
                </div>
                <p className="font-serif text-sm text-ink/80 leading-relaxed">“{l.reason}”</p>
                {(l.reviewedBy || l.remarks) && (
                  <p className="mt-2 pt-2 border-t-2 border-dashed border-ink/25 font-mono text-[10px] text-muted">
                    {l.reviewedBy && <>Reviewed by {l.reviewedBy}{l.reviewedAt ? ` on ${l.reviewedAt}` : ""}</>}
                    {l.remarks && <span className="text-ink"> “{l.remarks}”</span>}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {currentTab === "notices" && (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-3">
          <SectionTitle index="07" kicker="Notice Board" title="Campus" accent="Bulletins" />
          {notices.map((n) => (
            <article key={n.id} className="lift border-2 border-ink bg-paper-3 hard p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag tone="ink">{n.category}</Tag>
                {n.priority === "urgent" && <Stamp>Urgent</Stamp>}
                <span className="ml-auto font-mono text-[10px] text-muted">{n.publishedDate}</span>
              </div>
              <h4 className="font-display uppercase text-base text-ink">{n.title}</h4>
              <p className="font-serif text-sm text-ink/80 mt-1.5 leading-relaxed">{n.content}</p>
              <p className="mt-2 font-mono text-[10px] text-blood">- {n.authorName}</p>
            </article>
          ))}
        </div>
      )}

      {/* DOCUMENTS (student) */}
      {currentTab === "documents" && (
        <StudentDocumentsTab
          documents={documents}
          currentUser={currentUser}
          onUpload={onUploadDocument}
          onDelete={onDeleteDocument}
        />
      )}

      {/* ID CARD (student) */}
      {currentTab === "idcard" && (
        <StudentIdCardTab
          currentUser={currentUser}
          admission={admissions.find((a) => a.studentId === currentUser?.id) || null}
        />
      )}

      {/* EXAM SCHEDULE (student) */}
      {currentTab === "exams" && (
        <StudentExamsTab exams={exams} enrollments={enrollments} currentUser={currentUser} />
      )}

      {/* ADMIT CARD (student) fee-gated */}
      {currentTab === "admitcard" && (
        <StudentAdmitCardTab
          currentUser={currentUser}
          feeRecords={feeRecords}
          exams={exams}
          onGoToFees={() => onTabChange("fees")}
        />
      )}

      {/* PROFILE (student) */}
      {currentTab === "profile" && (
        <StudentProfileTab
          currentUser={currentUser}
          admission={admissions.find((a) => a.studentId === currentUser?.id) || null}
          onUpdateProfile={onUpdateProfile}
          onSaveAdmission={onSaveAdmission}
        />
      )}

      {/* ACADEMIC HISTORY (student) */}
      {currentTab === "history" && <StudentHistoryTab grades={grades} currentUser={currentUser} />}

      {/* submission modal */}
      {submitAsg && (
        <div className="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form onSubmit={submit} className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-md">
            <div className="hazard h-2" />
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60">Form · SUB-09</p>
                <h3 className="font-display uppercase text-base text-paper">Submit Brief</h3>
              </div>
              <button type="button" onClick={() => setSubmitAsg(null)} className="border-2 border-paper p-1.5 hover:bg-blood hover:border-blood press"><span className="block w-3 h-3">✕</span></button>
            </div>
            <div className="p-5 space-y-3.5">
              <p className="font-serif italic text-sm text-blood">{submitAsg.title}</p>
              <Field label="Document / Repository URL"><input className={INPUT} value={sUrl} onChange={(e) => setSUrl(e.target.value)} required /></Field>
              <Field label="Submission Notes"><textarea rows={3} className={INPUT} value={sText} onChange={(e) => setSText(e.target.value)} placeholder="Methodology, exhibit list, commit hash…" /></Field>
              <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
                <BrutalButton tone="ghost" onClick={() => setSubmitAsg(null)}>Cancel</BrutalButton>
                <BrutalButton type="submit" tone="blood"><Send className="w-4 h-4" /> Confirm</BrutalButton>
              </div>
            </div>
          </form>
        </div>
      )}

      <FeeReceiptModal isOpen={!!receipt} onClose={() => setReceipt(null)} record={receipt} />
      <FeePayModal
        key={payRecord?.id || "none"}
        record={payRecord}
        onClose={() => setPayRecord(null)}
        onPay={(amount, method) => {
          if (payRecord) onPayFee(payRecord.id, amount, method);
          setPayRecord(null);
        }}
      />
      <FeeHistoryModal
        isOpen={!!historyRecord}
        payments={feePayments.filter((p) => p.feeRecordId === historyRecord?.id)}
        title={historyRecord ? `${historyRecord.feeType} · History` : "Payment History"}
        onClose={() => setHistoryRecord(null)}
      />
    </div>
  );
}






