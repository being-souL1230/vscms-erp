"use client";
import { useMemo, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Plus,
  Download,
  Shield,
  KeyRound,
  BadgeCheck,
  Clock,
  Printer,
  Check,
  X,
  Send,
  Award,
  UploadCloud,
  Users,
  DollarSign,
  Lock,
  FileCheck2,
  AlertTriangle,
  Undo2,
  CheckSquare,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
  QrCode,
  UserCheck,
  RefreshCw,
  Play,
  UserPlus,
  MapPin,
  Calendar,
} from "lucide-react";
import type {
  User,
  Course,
  FeeRecord,
  FeePayment,
  Notice,
  AttendanceRecord,
  GradeRecord,
  AdmissionInfo,
  StudentDocument,
  Enrollment,
  CourseMaterial,
  Section,
  SemesterInfo,
  AcademicSession,
  ExamSchedule,
  ExamDefinition,
  InternalMark,
  FacultyAttendance,
  PermissionRow,
  LeaveRequest,
  AuditLogRecord,
  CampusEvent,
  EventRegistration,
  EventQrWindow,
} from "@/types/erp";
import { feeRemaining, feeEffectiveStatus, canAlterStudentRecords } from "@/types/erp";
import {
  BrutalButton,
  Tag,
  Stamp,
  SectionTitle,
  EmptyState,
  Field,
  INPUT,
  SquareAvatar,
  Crest,
  printElement,
  FeePayModal,
  FeeReceiptModal,
  FeeHistoryModal,
} from "@/components/shell";
import { DonutChart, MiniBarChart, StackedBar, CHART_PALETTE } from "@/components/charts";
import { computeInternal, computeGpa, computeOverallPct, GRADE_BANDS } from "@/lib/grading";

const TH =
  "py-2.5 px-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-paper bg-ink";
const TD = "py-2.5 px-3 align-top";
const fmtIN = (n: number) => n.toLocaleString("en-IN");
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

function Meter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="border-2 border-ink h-4 bg-transparent p-0.5">
      <div className="h-full hazard" style={{ width: `${v}%` }} />
    </div>
  );
}

/* ============================================================
   ADMIN · ACADEMIC SETUP (semesters · sections · sessions)
   ============================================================ */
export function AdminSetupTab({
  semesters,
  sections,
  sessions,
  enrollments,
  students,
  courses,
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
}: {
  semesters: SemesterInfo[];
  sections: Section[];
  sessions: AcademicSession[];
  enrollments: Enrollment[];
  students: User[];
  courses: Course[];
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
}) {
  const [semF, setSemF] = useState({ number: 3, name: "Semester 3", department: "BCA (CSJM)", status: "active", startsOn: "", endsOn: "" });
  const [semEdit, setSemEdit] = useState<number | null>(null);
  const [secF, setSecF] = useState({ code: "A", name: "Section A", department: "BCA (CSJM)", semester: 1, room: "LT-101" });
  const [secEdit, setSecEdit] = useState<number | null>(null);
  const [sesF, setSesF] = useState({ name: "2026-27", startDate: "2026-07-01", endDate: "2027-06-30", isCurrent: 0 });
  const [sesEdit, setSesEdit] = useState<number | null>(null);
  const [enrStu, setEnrStu] = useState("");
  const [enrCrs, setEnrCrs] = useState("");

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-6">
      <SectionTitle index="10" kicker="Academic Office" title="Academic" accent="Setup" sub="Semesters, sections and academic sessions for the institute." />

      {/* Semesters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display uppercase text-sm text-ink">Semesters <span className="text-blood">({semesters.length})</span></h4>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (semEdit != null) onUpdateSemester({ id: semEdit, ...semF }); else onAddSemester(semF); setSemEdit(null); }} className="border-2 border-ink bg-paper-3 p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Field label="Number"><input type="number" min={1} max={8} className={INPUT} value={semF.number} onChange={(e) => setSemF({ ...semF, number: Number(e.target.value), name: `Semester ${e.target.value}` })} /></Field>
          <Field label="Name"><input className={INPUT} value={semF.name} onChange={(e) => setSemF({ ...semF, name: e.target.value })} /></Field>
          <Field label="Department"><input className={INPUT} value={semF.department} onChange={(e) => setSemF({ ...semF, department: e.target.value })} /></Field>
          <Field label="Status"><select className={INPUT} value={semF.status} onChange={(e) => setSemF({ ...semF, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
          <Field label="Starts"><input type="date" className={INPUT} value={semF.startsOn} onChange={(e) => setSemF({ ...semF, startsOn: e.target.value })} /></Field>
          <Field label="Ends"><input type="date" className={INPUT} value={semF.endsOn} onChange={(e) => setSemF({ ...semF, endsOn: e.target.value })} /></Field>
          <div className="flex items-end gap-2">
            <BrutalButton type="submit" tone="blood">{semEdit != null ? "Update" : <><Plus className="w-4 h-4" /> Add</>}</BrutalButton>
            {semEdit != null && <BrutalButton tone="ghost" onClick={() => setSemEdit(null)}>×</BrutalButton>}
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          {semesters.map((s) => (
            <div key={s.id} className={`lift border-2 border-ink hard px-3 py-2 flex items-center gap-2 ${s.status === "active" ? "bg-ink text-paper" : "bg-paper"}`}>
              <span className="font-mono text-[10px] text-blood">SEM {s.number}</span>
              <span className="font-mono text-[11px] font-bold">{s.department}</span>
              <Tag tone={s.status === "active" ? "blood" : "paper"}>{s.status}</Tag>
              <button onClick={() => { setSemEdit(s.id); setSemF({ number: s.number, name: s.name, department: s.department, status: s.status, startsOn: s.startsOn || "", endsOn: s.endsOn || "" }); }} className="border border-ink/30 p-1 hover:bg-ink hover:text-paper press"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => onDeleteSemester(s.id)} className="border border-ink/30 p-1 hover:bg-blood hover:border-blood hover:text-paper press"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          {semesters.length === 0 && <EmptyState label="No semesters configured" />}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">Sections <span className="text-blood">({sections.length})</span></h4>
        <form onSubmit={(e) => { e.preventDefault(); if (secEdit != null) onUpdateSection({ id: secEdit, ...secF }); else onAddSection(secF); setSecEdit(null); }} className="border-2 border-ink bg-paper-3 p-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Field label="Code"><input className={INPUT} value={secF.code} onChange={(e) => setSecF({ ...secF, code: e.target.value })} /></Field>
          <Field label="Name"><input className={INPUT} value={secF.name} onChange={(e) => setSecF({ ...secF, name: e.target.value })} /></Field>
          <Field label="Department"><input className={INPUT} value={secF.department} onChange={(e) => setSecF({ ...secF, department: e.target.value })} /></Field>
          <Field label="Semester"><input type="number" className={INPUT} value={secF.semester} onChange={(e) => setSecF({ ...secF, semester: Number(e.target.value) })} /></Field>
          <Field label="Room"><input className={INPUT} value={secF.room} onChange={(e) => setSecF({ ...secF, room: e.target.value })} /></Field>
          <div className="flex items-end gap-2">
            <BrutalButton type="submit" tone="blood">{secEdit != null ? "Update" : <><Plus className="w-4 h-4" /> Add</>}</BrutalButton>
            {secEdit != null && <BrutalButton tone="ghost" onClick={() => setSecEdit(null)}>×</BrutalButton>}
          </div>
        </form>
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Section</th><th className={TH}>Department</th><th className={TH}>Sem</th><th className={TH}>Room</th><th className={TH + " text-center"}>Edit</th><th className={TH + " text-center"}>Del</th></tr></thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id} className="border-b-2 border-ink/10">
                  <td className={TD}><span className="font-mono text-[11px] font-bold">{s.code}</span> · <span className="font-serif text-xs">{s.name}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{s.department}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">Sem {s.semester}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{s.room || ""}</span></td>
                  <td className={TD + " text-center"}><button onClick={() => { setSecEdit(s.id); setSecF({ code: s.code, name: s.name, department: s.department, semester: s.semester, room: s.room || "" }); }} className="border-2 border-ink p-1 hover:bg-ink hover:text-paper press"><Edit2 className="w-3 h-3" /></button></td>
                  <td className={TD + " text-center"}><button onClick={() => onDeleteSection(s.id)} className="border-2 border-ink p-1 hover:bg-blood hover:border-blood press"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
              {sections.length === 0 && <tr><td colSpan={6}><div className="p-4"><EmptyState label="No sections" /></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic sessions */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">Academic Sessions <span className="text-blood">({sessions.length})</span></h4>
        <form onSubmit={(e) => { e.preventDefault(); if (sesEdit != null) onUpdateSession({ id: sesEdit, ...sesF }); else onAddSession(sesF); setSesEdit(null); }} className="border-2 border-ink bg-paper-3 p-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Field label="Name"><input className={INPUT} value={sesF.name} onChange={(e) => setSesF({ ...sesF, name: e.target.value })} placeholder="2026-27" /></Field>
          <Field label="Starts"><input type="date" className={INPUT} value={sesF.startDate} onChange={(e) => setSesF({ ...sesF, startDate: e.target.value })} /></Field>
          <Field label="Ends"><input type="date" className={INPUT} value={sesF.endDate} onChange={(e) => setSesF({ ...sesF, endDate: e.target.value })} /></Field>
          <Field label="Current"><select className={INPUT} value={sesF.isCurrent} onChange={(e) => setSesF({ ...sesF, isCurrent: Number(e.target.value) })}><option value={1}>Yes</option><option value={0}>No</option></select></Field>
          <div className="flex items-end gap-2">
            <BrutalButton type="submit" tone="blood">{sesEdit != null ? "Update" : <><Plus className="w-4 h-4" /> Add</>}</BrutalButton>
            {sesEdit != null && <BrutalButton tone="ghost" onClick={() => setSesEdit(null)}>×</BrutalButton>}
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) => (
            <div key={s.id} className={`lift border-2 border-ink hard px-3 py-2 flex items-center gap-2 ${s.isCurrent ? "bg-ink text-paper" : "bg-paper"}`}>
              <Stamp>{s.name}</Stamp>
              <span className="font-mono text-[10px]">{s.startDate} → {s.endDate}</span>
              {s.isCurrent ? <Tag tone="blood">Current</Tag> : <Tag tone="paper">Past</Tag>}
              <button onClick={() => { setSesEdit(s.id); setSesF({ name: s.name, startDate: s.startDate, endDate: s.endDate, isCurrent: s.isCurrent }); }} className="border border-ink/30 p-1 hover:bg-ink hover:text-paper press"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => onDeleteSession(s.id)} className="border border-ink/30 p-1 hover:bg-blood hover:border-blood hover:text-paper press"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          {sessions.length === 0 && <EmptyState label="No academic sessions" />}
        </div>
      </div>

      {/* Course enrollments */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">Course Enrollments <span className="text-blood">({enrollments.length})</span></h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const s = students.find((x) => x.id === Number(enrStu));
            const c = courses.find((x) => x.id === Number(enrCrs));
            if (!s || !c) return;
            onAddEnrollment({
              studentId: s.id,
              studentName: s.name,
              courseId: c.id,
              courseCode: c.code,
              courseName: c.name,
              semester: s.semester || 1,
              status: "active",
            });
            setEnrStu("");
            setEnrCrs("");
          }}
          className="border-2 border-ink bg-paper-3 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <Field label="Student">
            <select className={INPUT} value={enrStu} onChange={(e) => setEnrStu(e.target.value)} required>
              <option value="">Select student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.rollNo}</option>)}
            </select>
          </Field>
          <Field label="Course">
            <select className={INPUT} value={enrCrs} onChange={(e) => setEnrCrs(e.target.value)} required>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
            </select>
          </Field>
          <div className="flex items-end"><BrutalButton type="submit" tone="blood"><Plus className="w-4 h-4" /> Enroll</BrutalButton></div>
        </form>
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Student</th><th className={TH}>Course</th><th className={TH}>Sem</th><th className={TH}>Status</th><th className={TH + " text-center"}>Del</th></tr></thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b-2 border-ink/10">
                  <td className={TD}><span className="font-serif text-xs font-semibold">{e.studentName}</span></td>
                  <td className={TD}><span className="font-mono text-[11px] text-blood">{e.courseCode}</span> · <span className="font-serif text-xs">{e.courseName}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">Sem {e.semester}</span></td>
                  <td className={TD}><Tag tone={e.status === "active" ? "ink" : "paper"}>{e.status}</Tag></td>
                  <td className={TD + " text-center"}><button onClick={() => onDeleteEnrollment(e.id)} className="border-2 border-ink p-1 hover:bg-blood hover:border-blood press"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
              {enrollments.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No enrollments" hint="Assign a course to a student above." /></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN · DOCUMENTS (student uploads vault)
   ============================================================ */
export function AdminDocumentsTab({
  documents,
  onUpdateStatus,
  onDelete,
}: {
  documents: StudentDocument[];
  onUpdateStatus: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const [cat, setCat] = useState("all");
  const [st, setSt] = useState("all");
  const [q, setQ] = useState("");
  const cats = Array.from(new Set(documents.map((d) => d.category)));
  const filtered = documents.filter(
    (d) =>
      (cat === "all" || d.category === cat) &&
      (st === "all" || d.status === st) &&
      (d.title.toLowerCase().includes(q.toLowerCase()) ||
        d.studentName.toLowerCase().includes(q.toLowerCase())),
  );
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  const download = (d: StudentDocument) => {
    const a = document.createElement("a");
    a.href = `data:${d.mimeType};base64,${d.data}`;
    a.download = d.fileName || d.title;
    a.click();
  };

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        index="11"
        kicker="Records Vault"
        title="Student"
        accent="Documents"
        sub="Review uploads, verify identity papers and approve records."
        right={<Tag tone={pendingCount > 0 ? "blood" : "ink"}>{pendingCount} pending</Tag>}
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Category">
          <select className={INPUT} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={INPUT} value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>
        </Field>
        <Field label="Search">
          <input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="title / student…" />
        </Field>
      </div>
      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>Document</th><th className={TH}>Student</th><th className={TH}>Category</th><th className={TH}>Size</th><th className={TH}>Status</th><th className={TH + " text-center"}>Actions</th></tr></thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b-2 border-ink/10">
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blood" />
                    <div>
                      <p className="font-serif text-xs font-semibold">{d.title}</p>
                      <p className="font-mono text-[10px] text-muted">{d.fileName}</p>
                    </div>
                  </div>
                </td>
                <td className={TD}><span className="font-mono text-[11px]">{d.studentName}</span></td>
                <td className={TD}><Tag tone="ink">{d.category}</Tag></td>
                <td className={TD}><span className="font-mono text-[10px]">{(d.fileSize / 1024).toFixed(1)} KB</span></td>
                <td className={TD}>
                  <Tag tone={d.status === "verified" ? "ink" : "blood"}>{d.status}</Tag>
                </td>
                <td className={TD + " text-center"}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => download(d)} title="Download" className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"><Download className="w-3.5 h-3.5" /></button>
                    {d.status === "pending" ? (
                      <button onClick={() => onUpdateStatus(d.id, "verified")} title="Verify" className="border-2 border-ink p-1.5 hover:bg-blood hover:border-blood press"><BadgeCheck className="w-3.5 h-3.5" /></button>
                    ) : (
                      <button onClick={() => onUpdateStatus(d.id, "pending")} title="Unverify" className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"><Clock className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => onDelete(d.id)} title="Delete" className="border-2 border-ink p-1.5 hover:bg-blood hover:border-blood press"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6}><div className="p-6"><EmptyState label="No documents" hint="Student uploads will appear here." /></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN · USER MANAGEMENT
   ============================================================ */
export function AdminUsersTab({
  users,
  onUpdateUser,
}: {
  users: User[];
  onUpdateUser: (d: { id: number; role?: string; status?: string; password?: string }) => void;
}) {
  const [q, setQ] = useState("");
  const [pw, setPw] = useState<Record<number, string>>({});
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      (u.rollNo || "").toLowerCase().includes(q.toLowerCase()),
  );
  const roles: ("admin" | "faculty" | "student")[] = ["admin", "faculty", "student"];

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        index="12"
        kicker="Identity Office"
        title="User &"
        accent="Role Management"
        sub="Change roles, activate accounts and reset passwords."
        right={
          <div className="flex gap-2">
            <Tag tone="blood">{users.filter((u) => u.role === "admin").length} admins</Tag>
            <Tag tone="ink">{users.filter((u) => u.role === "faculty").length} staff</Tag>
            <Tag tone="ink">{users.filter((u) => u.role === "student").length} scholars</Tag>
          </div>
        }
      />
      <Field label="Search">
        <input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name / email / roll…" />
      </Field>
      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>User</th><th className={TH}>Department</th><th className={TH}>Role</th><th className={TH}>Status</th><th className={TH}>Reset Password</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b-2 border-ink/10">
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-8 !w-8" />
                    <div>
                      <p className="font-serif text-xs font-semibold">{u.name}</p>
                      <p className="font-mono text-[10px] text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className={TD}><span className="font-mono text-[11px]">{u.department}</span></td>
                <td className={TD}>
                  <select
                    className={`${INPUT} !w-28`}
                    value={u.role}
                    onChange={(e) => onUpdateUser({ id: u.id, role: e.target.value })}
                  >
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className={TD}>
                  <button
                    onClick={() => onUpdateUser({ id: u.id, status: u.status === "active" ? "inactive" : "active" })}
                    className={`px-2 py-1 border-2 font-mono text-[10px] font-bold uppercase press ${
                      u.status === "active"
                        ? "border-ink bg-paper text-ink hover:bg-ink hover:text-paper"
                        : "border-blood bg-paper text-blood hover:bg-blood hover:text-paper"
                    }`}
                  >
                    {u.status}
                  </button>
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="password"
                      placeholder="new password"
                      className={`${INPUT} !w-36`}
                      value={pw[u.id] || ""}
                      onChange={(e) => setPw({ ...pw, [u.id]: e.target.value })}
                    />
                    <button
                      onClick={() => {
                        if (!pw[u.id] || pw[u.id].length < 6) return;
                        onUpdateUser({ id: u.id, password: pw[u.id] });
                        setPw({ ...pw, [u.id]: "" });
                      }}
                      disabled={!pw[u.id] || pw[u.id].length < 6}
                      className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press disabled:opacity-40"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5}><div className="p-6"><EmptyState label="No users found" /></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN · PERMISSIONS MATRIX
   ============================================================ */
type PermKey = "canView" | "canCreate" | "canEdit" | "canDelete";
const PERM_META: Record<PermKey, { label: string; hint: string }> = {
  canView: { label: "View", hint: "can see the data" },
  canCreate: { label: "Create", hint: "can add new records" },
  canEdit: { label: "Edit", hint: "can modify records" },
  canDelete: { label: "Delete", hint: "can remove records" },
};
const ROLE_META: Record<string, { label: string; desc: string }> = {
  admin: { label: "Admin", desc: "Full access always" },
  faculty: { label: "Teacher", desc: "Faculty & staff" },
  student: { label: "Scholar", desc: "Students" },
};

export function AdminPermissionsTab({
  permissions,
  onSave,
}: {
  permissions: PermissionRow[];
  onSave: (rows: PermissionRow[]) => void;
}) {
  const [draft, setDraft] = useState<PermissionRow[]>(permissions);
  const [saved, setSaved] = useState(false);
  const roles = (["admin", "faculty", "student"] as const).filter((r) =>
    draft.some((p) => p.role === r),
  );
  const modules = Array.from(new Set(draft.map((p) => p.module)));

  const toggle = (role: string, module: string, key: PermKey) => {
    setDraft((prev) =>
      prev.map((p) => (p.role === role && p.module === module ? { ...p, [key]: p[key] ? 0 : 1 } : p)),
    );
    setSaved(false);
  };

  const rightsOf = (p: PermissionRow) =>
    (["canView", "canCreate", "canEdit", "canDelete"] as PermKey[]).filter((k) => p[k]).length;

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        index="13"
        kicker="Access Control"
        title="Role"
        accent="Permissions"
        sub="Choose what each role can do in every module. Admin always has full access."
        right={
          <div className="flex flex-wrap gap-2">
            <BrutalButton
              tone="ghost"
              onClick={() => {
                setDraft(permissions.map((p) => ({ ...p })));
                setSaved(false);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </BrutalButton>
            <BrutalButton
              tone="blood"
              disabled={saved}
              onClick={() => {
                onSave(draft);
                setSaved(true);
              }}
            >
              <Shield className="w-4 h-4" /> {saved ? "Saved ✓" : "Save Changes"}
            </BrutalButton>
          </div>
        }
      />

      <div className="border-2 border-ink bg-paper-3 hard p-4 flex flex-wrap items-center gap-3">
        <Lock className="w-5 h-5 text-blood shrink-0" />
        <p className="font-serif text-sm text-ink/80 min-w-0 flex-1">
          <strong className="text-ink">This matrix controls what each role can do in every module.</strong>{" "}
          Four actions per module: <b>View</b> (see data), <b>Create</b> (add records), <b>Edit</b> (modify
          records) and <b>Delete</b> (remove records). Click a toggle to allow or deny it for that role changes
          are applied only when you press <b>Save Changes</b>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((r) => {
          const total = draft.filter((p) => p.role === r).reduce((a, p) => a + rightsOf(p), 0);
          return (
            <div key={r} className="border-2 border-ink bg-paper hard px-3 py-2 flex items-center gap-2">
              <span className="font-display text-xl text-ink">{total}</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">{ROLE_META[r]?.label || r}</p>
                <p className="font-mono text-[9px] text-muted">{ROLE_META[r]?.desc || ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={TH}>Module</th>
              {roles.map((r) => (
                <th key={r} className={TH + " text-center"}>
                  {ROLE_META[r]?.label || r}
                  <span className="block font-normal text-[9px] text-paper/70">{ROLE_META[r]?.desc}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m} className="border-b-2 border-ink/10 align-top">
                <td className={TD}>
                  <span className="font-serif text-xs font-semibold capitalize">{m}</span>
                  <span className="block font-mono text-[9px] text-muted">
                    {m === "documents" ? "Uploads & verification" : m === "exams" ? "Schedule & marks" : m === "notices" ? "Announcements" : m === "fees" ? "Payments & receipts" : m === "timetable" ? "Class schedule" : m === "attendance" ? "Present / absent records" : m === "leaves" ? "Leave requests" : m === "students" ? "Scholar records" : m === "faculty" ? "Staff records" : m === "courses" ? "Subjects & classes" : m === "departments" ? "Institute units" : m === "reports" ? "Analytics & exports" : m === "grades" ? "Marks & results" : m === "assignments" ? "Tasks & submissions" : "Module data"}
                  </span>
                </td>
                {roles.map((r) => {
                  const p = draft.find((x) => x.role === r && x.module === m);
                  const locked = r === "admin";
                  return (
                    <td key={r} className={TD + " text-center"}>
                      {p ? (
                        <div className="grid grid-cols-2 gap-1.5 justify-items-center">
                          {(["canView", "canCreate", "canEdit", "canDelete"] as PermKey[]).map((k) => {
                            const on = Boolean(p[k]);
                            const meta = PERM_META[k];
                            return (
                              <button
                                key={k}
                                disabled={locked}
                                onClick={() => toggle(r, m, k)}
                                title={locked ? "Admin is always allowed" : on ? `Allowed ${meta.hint}` : `Denied cannot ${meta.label.toLowerCase()}`}
                                className={`flex items-center gap-1 border-2 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wide press disabled:opacity-100 ${
                                  on
                                    ? "bg-ink border-ink text-paper"
                                    : "bg-paper border-ink/30 text-muted hover:border-ink hover:text-ink"
                                }`}
                              >
                                {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {meta.label}
                                {locked && <Lock className="w-2.5 h-2.5" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-muted"></span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {modules.length === 0 && (
              <tr><td colSpan={4}><div className="p-4"><EmptyState label="No modules configured" /></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] text-muted flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-ink border border-ink" /> Allowed role can do this</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-paper border-2 border-ink/30" /> Denied role cannot do this</span>
        <span className="ml-auto">Admin (locked) is always fully allowed.</span>
      </p>
    </div>
  );
}

/* ============================================================
   ADMIN · REPORTS & ANALYTICS
   ============================================================ */
export function AdminReportsTab({
  students,
  courses,
  feeRecords,
  attendance,
  grades,
}: {
  students: User[];
  courses: Course[];
  feeRecords: FeeRecord[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
}) {
  const collected = feeRecords.filter((f) => f.status === "paid").reduce((a, f) => a + Number(f.amount || 0), 0);
  const total = feeRecords.reduce((a, f) => a + Number(f.amount || 0), 0);
  const pending = total - collected;
  const collRate = pct(collected, total);
  const present = attendance.filter((a) => a.status !== "absent").length;
  const attRate = pct(present, attendance.length || 1);
  const pass = grades.filter((g) => Number(g.marksObtained || 0) >= Number(g.maxMarks || 100) * 0.4).length;
  const passRate = pct(pass, grades.length || 1);

  const feeByType = useMemo(() => {
    const map = new Map<string, number>();
    feeRecords.forEach((f) => map.set(f.feeType, (map.get(f.feeType) || 0) + Number(f.amount || 0)));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [feeRecords]);
  const attByCourse = useMemo(() => {
    const map = new Map<string, { p: number; t: number }>();
    attendance.forEach((a) => {
      const cur = map.get(a.courseCode) || { p: 0, t: 0 };
      cur.t += 1;
      if (a.status !== "absent") cur.p += 1;
      map.set(a.courseCode, cur);
    });
    return Array.from(map.entries()).map(([label, v]) => ({ label, value: Math.round((v.p / v.t) * 100) }));
  }, [attendance]);
  const gradeDist = useMemo(() => {
    const map = new Map<string, number>();
    grades.forEach((g) => map.set(g.gradeLetter || "N/A", (map.get(g.gradeLetter || "N/A") || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [grades]);

  const lowAttendance = students
    .map((s) => {
      const rows = attendance.filter((a) => a.studentId === s.id);
      const p = rows.filter((a) => a.status !== "absent").length;
      return { s, rate: rows.length ? pct(p, rows.length) : 100 };
    })
    .filter((x) => x.rate < 75)
    .sort((a, b) => a.rate - b.rate);
  const pendingFees = feeRecords.filter((f) => f.status !== "paid");

  const exportCSV = (rows: string[][], name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = `${name}.csv`;
    a.click();
  };

  const stats = [
    { label: "Fee Collection", value: `${collRate}%`, foot: `₹${fmtIN(collected)} of ₹${fmtIN(total)}`, Icon: DollarSign },
    { label: "Attendance Rate", value: `${attRate}%`, foot: `${present}/${attendance.length} sessions present`, Icon: Users },
    { label: "Pass Rate", value: `${passRate}%`, foot: `${pass}/${grades.length} grades ≥ 40%`, Icon: Award },
    { label: "Pending Fees", value: `₹${fmtIN(pending)}`, foot: `${pendingFees.length} invoices`, Icon: FileText },
  ];

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        index="14"
        kicker="MIS Office"
        title="Reports &"
        accent="Analytics"
        sub="Fee health, attendance, and academic performance at a glance."
        right={
          <div className="flex gap-2">
            <BrutalButton
              tone="ink"
              onClick={() =>
                exportCSV(
                  [
                    ["Name", "Roll No", "Department", "Semester", "GPA", "Status"],
                    ...students.map((s) => [s.name, s.rollNo, s.department, String(s.semester || 1), s.gpa || "-", s.status]),
                  ],
                  "student-directory",
                )
              }
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </BrutalButton>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="lift border-2 border-ink bg-paper hard p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{s.label}</span>
              <s.Icon className="w-4 h-4 text-blood" />
            </div>
            <p className={`font-display text-3xl leading-none mt-3 ${s.label === "Pending Fees" ? "text-blood" : "text-ink"}`}>{s.value}</p>
            <p className="mt-2 font-serif italic text-xs text-muted">{s.foot}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-3">Fee Collection</p>
          <DonutChart
            data={[
              { label: "Collected", value: collected, color: "#2563eb" },
              { label: "Pending", value: Math.max(0, pending), color: "#e2e8f0" },
            ]}
            centerValue={`${collRate}%`}
            centerLabel="collected"
            size={150}
          />
        </div>
        <div className="border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-3">Attendance by Course</p>
          <MiniBarChart data={attByCourse} height={150} emptyLabel="No attendance yet" />
        </div>
        <div className="border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-3">Grade Distribution</p>
          <MiniBarChart data={gradeDist} height={150} emptyLabel="No grades yet" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Low Attendance</th><th className={TH}>Rate</th><th className={TH}>Action</th></tr></thead>
            <tbody>
              {lowAttendance.slice(0, 6).map((x) => (
                <tr key={x.s.id} className="border-b-2 border-ink/10">
                  <td className={TD}>
                    <p className="font-serif text-xs font-semibold">{x.s.name}</p>
                    <p className="font-mono text-[10px] text-muted">{x.s.rollNo}</p>
                  </td>
                  <td className={TD}><Tag tone={x.rate < 60 ? "blood" : "ink"}>{x.rate}%</Tag></td>
                  <td className={TD}><button onClick={() => exportCSV([[x.s.name, x.s.rollNo, `${x.rate}%`]], "defaulter-list")} className="font-mono text-[10px] text-blood underline underline-offset-4 hover:text-ink">Export</button></td>
                </tr>
              ))}
              {lowAttendance.length === 0 && <tr><td colSpan={3}><div className="p-4"><EmptyState label="No low-attendance students" /></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Pending Fees</th><th className={TH}>Type</th><th className={TH}>Amount</th></tr></thead>
            <tbody>
              {pendingFees.slice(0, 6).map((f) => (
                <tr key={f.id} className="border-b-2 border-ink/10">
                  <td className={TD}>
                    <p className="font-serif text-xs font-semibold">{f.studentName}</p>
                    <p className="font-mono text-[10px] text-muted">{f.rollNo}</p>
                  </td>
                  <td className={TD}><span className="font-mono text-[10px]">{f.feeType}</span></td>
                  <td className={TD}><span className="font-mono text-[11px] text-blood">₹{fmtIN(Number(f.amount || 0))}</span></td>
                </tr>
              ))}
              {pendingFees.length === 0 && <tr><td colSpan={3}><div className="p-4"><EmptyState label="All fees collected" /></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FACULTY · NOTICES BOARD
   ============================================================ */
export function FacultyNoticesTab({
  notices,
  currentUser,
  permissions,
  onAddNotice,
  onDeleteNotice,
}: {
  notices: Notice[];
  currentUser: User | null;
  permissions: PermissionRow[];
  onAddNotice: (d: Partial<Notice>) => void;
  onDeleteNotice: (id: number) => void;
}) {
  // The UI follows the actual permission matrix, not just the role: whatever
  // the admin grants/revokes for notices shows/hides the matching controls.
  const isAdmin = currentUser?.role === "admin";
  const perm = permissions.find(
    (p) => p.role === (currentUser?.role ?? "") && p.module === "notices",
  );
  const canCreate = isAdmin || (perm ? perm.canCreate === 1 : false);
  const canDelete = isAdmin || (perm ? perm.canDelete === 1 : false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Academic");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  const publish = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    onAddNotice({ title, content: body, category, priority });
    setTitle("");
    setBody("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Post box (same design as the admin panel); hidden if the admin has
          revoked the faculty notices-create permission */}
      {canCreate && (
      <form onSubmit={publish} className="border-2 border-ink bg-paper hard p-5 h-fit space-y-3.5">
        <SectionTitle kicker="Broadcast" title="Post a" accent="Notice" />
        <Field label="Headline">
          <input
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Exam schedule update"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Academic</option>
              <option>Exam</option>
              <option>Event</option>
              <option>Fee</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className={INPUT} value={priority} onChange={(e) => setPriority(e.target.value as "normal" | "urgent")}>
              <option value="normal">Standard</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
        <Field label="Body">
          <textarea
            rows={5}
            className={INPUT}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Write notice details..."
          />
        </Field>
        <BrutalButton type="submit" tone="blood" className="w-full">
          <Send className="w-4 h-4" /> Post Notice
        </BrutalButton>
      </form>
      )}

      {/* Notice board */}
      <div className="lg:col-span-2 space-y-3">
        <SectionTitle kicker="On the board" title="All" accent={`Notices (${notices.length})`} />
        {notices.length === 0 && <EmptyState label="No notices yet" />}
        {notices.map((n) => (
          <article key={n.id} className="lift border-2 border-ink bg-paper hard p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Tag tone="ink">{n.category}</Tag>
                {n.priority === "urgent" && <Stamp>Urgent</Stamp>}
              </div>
              {canDelete && (
                <button
                  onClick={() => onDeleteNotice(n.id)}
                  title="Delete notice"
                  className="border-2 border-ink p-1.5 hover:bg-blood hover:text-paper hover:border-blood press"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
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
  );
}

/* ============================================================
   FACULTY · STUDENT PERFORMANCE
   ============================================================ */
export function FacultyPerformanceTab({
  students,
  attendance,
  grades,
  courses = [],
  enrollments = [],
}: {
  students: User[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  courses?: Course[];
  enrollments?: Enrollment[];
}) {
  const [q, setQ] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const depts = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  const courseFilteredStudents = useMemo(() => {
    if (selectedCourseId === "all") return students;
    const enrolledIds = new Set(
      enrollments.filter((e) => e.courseId === Number(selectedCourseId)).map((e) => e.studentId)
    );
    return students.filter((s) => enrolledIds.has(s.id));
  }, [students, enrollments, selectedCourseId]);

  const rows = courseFilteredStudents
    .map((s) => {
      const att = attendance.filter((a) => a.studentId === s.id);
      const present = att.filter((a) => a.status !== "absent").length;
      const rate = att.length ? pct(present, att.length) : 100;
      const myGrades = grades.filter((g) => g.studentId === s.id);
      const avg = myGrades.length
        ? myGrades.reduce((a, g) => a + (Number(g.marksObtained) / Number(g.maxMarks || 100)) * 100, 0) / myGrades.length
        : null;
      const gpa = Number(s.gpa) || 0;
      const status = rate >= 75 && (avg ?? 100) >= 40 ? "Good" : "At Risk";
      return { s, rate, avg, myGrades: myGrades.length, gpa, status };
    })
    .filter((r) => {
      if (selectedDept !== "all" && r.s.department !== selectedDept) return false;
      if (selectedStatus !== "all" && r.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      const term = q.trim().toLowerCase();
      if (!term) return true;
      return r.s.name.toLowerCase().includes(term) || r.s.rollNo.toLowerCase().includes(term);
    })
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        kicker="Scholar Analytics"
        title="Student"
        accent="Performance"
        sub="Attendance %, GPA and score averages filtered by course & department."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-2 border-ink bg-paper-2 p-3">
        <Field label="Course / Subject Filter">
          <select
            className={INPUT}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Department Filter">
          <select className={INPUT} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            <option value="all">All Departments</option>
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Academic Standing">
          <select className={INPUT} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Standing</option>
            <option value="good">Good (≥75%)</option>
            <option value="at risk">At Risk (&lt;75%)</option>
          </select>
        </Field>

        <Field label="Search Scholar">
          <input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or roll..." />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between font-mono text-[11px] text-muted px-1">
        <span>Showing <strong className="text-ink font-bold">{rows.length}</strong> of {students.length} scholars</span>
        {selectedCourseId !== "all" && (
          <span className="text-blood font-bold">
            Filtered Course: {courses.find((c) => c.id === Number(selectedCourseId))?.code} - {courses.find((c) => c.id === Number(selectedCourseId))?.name}
          </span>
        )}
      </div>

      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={TH}>Scholar</th>
              <th className={TH}>Attendance</th>
              <th className={TH}>Avg Score</th>
              <th className={TH}>GPA</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.s.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <SquareAvatar src={r.s.avatarUrl} initial={r.s.name.charAt(0)} className="!h-8 !w-8" />
                    <div>
                      <p className="font-serif text-xs font-semibold group-hover:text-blood">{r.s.name}</p>
                      <p className="font-mono text-[10px] text-muted">{r.s.rollNo} · {r.s.department}</p>
                    </div>
                  </div>
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 border border-ink bg-paper-3">
                      <div className="h-full hazard" style={{ width: `${r.rate}%` }} />
                    </div>
                    <Tag tone={r.rate >= 75 ? "ink" : "blood"}>{r.rate}%</Tag>
                  </div>
                </td>
                <td className={TD}>
                  {r.avg != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 border border-ink bg-paper-3">
                        <div className="h-full bg-blood" style={{ width: `${r.avg}%` }} />
                      </div>
                      <span className="font-mono text-[11px] font-bold">{r.avg.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-muted">No grades recorded</span>
                  )}
                </td>
                <td className={TD}>
                  <span className="font-mono text-[11px] text-blood font-bold">{r.gpa.toFixed(2)}</span>
                </td>
                <td className={TD}>
                  <Tag tone={r.status === "Good" ? "ink" : "blood"}>
                    {r.status}
                  </Tag>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="p-6">
                    <EmptyState label="No scholars match selected filters" hint="Select 'All Courses' or clear your search term." />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   FACULTY · MY LEAVE (apply own)
   ============================================================ */
export function FacultyLeaveTab({
  leaves,
  currentUser,
  onAddLeave,
}: {
  leaves: LeaveRequest[];
  currentUser: User | null;
  onAddLeave: (d: { fromDate: string; toDate: string; reason: string }) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const mine = leaves.filter((l) => l.studentId === (currentUser?.id ?? -1));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!from || !to || !reason) return;
    onAddLeave({ fromDate: from, toDate: to, reason });
    setFrom(""); setTo(""); setReason("");
  };

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        kicker="Staff Leave"
        title="My"
        accent="Leave"
        sub="Apply for personal leave approved by the Director's office."
      />
      <form onSubmit={submit} className="border-2 border-ink bg-paper-3 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="From"><input type="date" className={INPUT} value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
        <Field label="To"><input type="date" className={INPUT} value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        <div className="flex items-end"><BrutalButton type="submit" tone="blood"><Send className="w-4 h-4" /> Apply</BrutalButton></div>
        <div className="sm:col-span-3"><Field label="Reason"><textarea rows={2} className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Reason for leave…" /></Field></div>
      </form>
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">My Requests <span className="text-blood">({mine.length})</span></h4>
        {mine.map((l) => (
          <div key={l.id} className="lift border-2 border-ink bg-paper-3 hard p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-blood">{l.fromDate} → {l.toDate}</p>
              <Tag tone={l.status === "approved" ? "ink" : l.status === "rejected" ? "paper" : "blood"}>{l.status}</Tag>
            </div>
            <p className="font-serif text-sm text-ink/80 mt-1.5">“{l.reason}”</p>
            {l.remarks && <p className="mt-2 font-mono text-[10px] text-muted">Reviewed: {l.remarks}</p>}
          </div>
        ))}
        {mine.length === 0 && <EmptyState label="No leave requests yet" hint="Apply above." />}
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT · DOCUMENTS (upload + my vault)
   ============================================================ */
export function StudentDocumentsTab({
  documents,
  currentUser,
  onUpload,
  onDelete,
}: {
  documents: StudentDocument[];
  currentUser: User | null;
  onUpload: (d: { title: string; category: string; fileName: string; mimeType: string; fileSize: number; data: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Identity");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [fileSize, setFileSize] = useState(0);
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = documents.filter((d) => d.studentId === (currentUser?.id ?? -1));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Max file size is 3 MB");
      e.target.value = "";
      return;
    }
    setFileName(file.name);
    setMimeType(file.type || "application/octet-stream");
    setFileSize(file.size);
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      setData(raw.includes(",") ? raw.split(",")[1] : raw);
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !data) return;
    onUpload({ title: title.trim(), category, fileName: fileName || title.trim(), mimeType, fileSize, data });
    setTitle(""); setFileName(""); setData(""); setFileSize(0);
  };

  const download = (d: StudentDocument) => {
    const a = document.createElement("a");
    a.href = `data:${d.mimeType};base64,${d.data}`;
    a.download = d.fileName || d.title;
    a.click();
  };

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        kicker="My Records"
        title="Document"
        accent="Vault"
        sub="Upload identity papers and academic records. Admin verifies them."
        right={<Tag tone="ink">{mine.filter((d) => d.status === "verified").length}/{mine.length} verified</Tag>}
      />
      <form onSubmit={submit} className="border-2 border-ink bg-paper-3 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title"><input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Aadhaar Card" /></Field>
          <Field label="Category">
            <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Identity", "Academics", "Residence", "Financial", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="File (max 3 MB)">
          <input type="file" onChange={onFile} className={INPUT} accept="image/*,.pdf,.doc,.docx,.txt" required />
        </Field>
        {fileName && <p className="font-mono text-[10px] text-muted">{fileName} · {(fileSize / 1024).toFixed(1)} KB {busy ? "· reading…" : "· ready ✓"}</p>}
        <div className="flex justify-end">
          <BrutalButton type="submit" tone="blood" disabled={busy || !data}><UploadCloud className="w-4 h-4" /> Upload Document</BrutalButton>
        </div>
      </form>
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">My Documents <span className="text-blood">({mine.length})</span></h4>
        {mine.map((d) => (
          <div key={d.id} className="lift border-2 border-ink bg-paper-3 hard p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-blood shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-semibold truncate">{d.title}</p>
              <p className="font-mono text-[10px] text-muted">{d.category} · {(d.fileSize / 1024).toFixed(1)} KB · {d.uploadedAt?.slice(0, 10)}</p>
            </div>
            <Tag tone={d.status === "verified" ? "ink" : "blood"}>{d.status}</Tag>
            <button onClick={() => download(d)} className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"><Download className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(d.id)} className="border-2 border-ink p-1.5 hover:bg-blood hover:border-blood press"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {mine.length === 0 && <EmptyState label="No documents uploaded" hint="Upload your first document above." />}
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT · ID CARD (printable)
   ============================================================ */
/* ============================================================
   STUDENT · ID CARD (Digital & Printable QR Code System)
   ============================================================ */

function StudentQrCode({ value, size = 68 }: { value: string; size?: number }) {
  const gridCount = 21;
  const matrix: boolean[][] = Array.from({ length: gridCount }, () => Array(gridCount).fill(false));

  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, 14);
  drawFinder(14, 0);

  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= 13;
      const isBottomLeft = r >= 13 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
        const bitSeed = (r * gridCount + c + Math.abs(hash)) % 100;
        matrix[r][c] = bitSeed > 42;
      }
    }
  }

  const cellSize = size / gridCount;

  return (
    <div className="bg-white p-1 border-2 border-ink inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.15}
                height={cellSize + 0.15}
                fill="#111111"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

export interface IdVerificationRecord {
  rollNo: string;
  studentName: string;
  department: string;
  semester?: number;
  avatarUrl?: string;
  status: "verified" | "pending" | "unverified" | "rejected";
  requestedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectReason?: string;
}

export function StudentIdCardTab({
  currentUser,
  admission,
  verificationRecord,
  onRequestVerification,
}: {
  currentUser: User | null;
  admission: AdmissionInfo | null;
  verificationRecord?: IdVerificationRecord | null;
  onRequestVerification?: (rollNo: string) => void;
}) {
  const u = currentUser;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (!u) return <EmptyState label="Sign in to view your ID card" />;
  const session = "2025-26";
  const a = admission;
  const qrDataPayload = `https://vscms.edu/verify?rollNo=${u.rollNo}&name=${encodeURIComponent(u.name)}&dept=${u.department}`;

  const status = verificationRecord?.status || "unverified";
  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-5">
      <SectionTitle
        index="39"
        kicker="Digital Identity"
        title="Student"
        accent="ID Card"
        sub="Official VSCMS institutional identity card with active QR code verification."
        right={
          <div className="flex flex-wrap gap-2">
            <BrutalButton tone="ghost" onClick={() => setIsFlipped(!isFlipped)}>
              <RotateCcw className="w-4 h-4" /> {isFlipped ? "Show Front" : "Flip to Back"}
            </BrutalButton>
            <BrutalButton tone="blood" onClick={() => setShowVerifyModal(true)}>
              <BadgeCheck className="w-4 h-4" /> Scan QR Profile
            </BrutalButton>
            <BrutalButton tone="ink" onClick={() => printElement("student-id-card")}>
              <Printer className="w-4 h-4" /> Print ID
            </BrutalButton>
          </div>
        }
      />

      {/* Verification Status Alert Banner */}
      {!bannerDismissed && (
        <div className={`relative border-2 border-ink p-3 sm:p-4 hard-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isVerified ? "bg-emerald-50 text-emerald-900" : isPending ? "bg-amber-50 text-amber-900" : isRejected ? "bg-rose-50 text-rose-900" : "bg-paper-2 text-ink"
        }`}>
          <div className="flex items-center gap-2.5 pr-6 sm:pr-0">
            {isVerified ? (
              <BadgeCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : isPending ? (
              <Clock className="w-5 h-5 text-amber-700 shrink-0 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-blood shrink-0" />
            )}
            <div>
              <p className="font-mono text-xs font-extrabold uppercase tracking-wider">
                {isVerified
                  ? `Institutionally Verified by ${verificationRecord?.verifiedBy || "Faculty Registrar"}`
                  : isPending
                  ? "Verification Request Pending at Faculty/Registrar"
                  : isRejected
                  ? `Verification Rejected: ${verificationRecord?.rejectReason || "Please re-check photo"}`
                  : "Unverified ID Card - Request Faculty Approval"}
              </p>
              <p className="font-mono text-[10px] text-muted mt-0.5">
                {isVerified
                  ? `Verified on ${verificationRecord?.verifiedAt || "2026-08-18"}. Card active for all campus entrances & exams.`
                  : isPending
                  ? "Your verification request has been sent to Faculty. Verification status will update once approved."
                  : "Students must request Faculty verification before using ID for official campus verification."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(!isVerified && onRequestVerification) && (
              <BrutalButton
                tone={isPending ? "ghost" : "blood"}
                disabled={isPending}
                onClick={() => onRequestVerification(u.rollNo)}
                className="!py-1.5 !px-3 !text-xs"
              >
                {isPending ? "Pending Faculty Approval" : isRejected ? "Re-send Request to Faculty" : "Send Verification Request to Faculty"}
              </BrutalButton>
            )}
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="border-2 border-ink p-1 bg-paper hover:bg-ink hover:text-paper press"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ID Card Display Frame */}
      <div id="student-id-card" className="max-w-md mx-auto border-2 border-ink hard overflow-hidden bg-paper transition-all">
        {!isFlipped ? (
          /* FRONT SIDE */
          <div>
            {/* Institute Banner Header */}
            <div className="bg-ink text-paper px-5 py-3.5 flex items-center justify-between border-b-2 border-ink">
              <div>
                <p className="font-display uppercase text-base tracking-wide leading-none text-paper">
                  Visual Student & Campus Management
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/70 mt-1">
                  VSCMS ERP · SESSION {session}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vscms-logo.png"
                alt="College of Management Studies"
                className="h-10 w-10 rounded-full bg-paper border-2 border-paper object-contain shrink-0"
              />
            </div>

            {/* Main Body */}
            <div className="p-4 sm:p-5 bg-paper space-y-4">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 space-y-1.5 text-center">
                  <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-24 !w-24 border-2 border-ink shadow-md" />
                  <span className={`block font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border border-ink ${
                    isVerified ? "bg-emerald-100 text-emerald-900" : isPending ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900"
                  }`}>
                    {isVerified ? "VERIFIED STUDENT" : isPending ? "PENDING AUTH" : "UNVERIFIED"}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="font-display uppercase text-xl text-ink leading-tight tracking-wide">{u.name}</h3>
                    <p className="font-mono text-xs font-extrabold text-blood mt-0.5">Roll No · {u.rollNo}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] border-t border-b border-ink/15 py-2">
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Course</span>
                      <strong className="text-ink font-bold">{u.department}</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Semester</span>
                      <strong className="text-ink font-bold">Sem {u.semester || 1}</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Batch</span>
                      <strong className="text-ink font-bold">2024-2027</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Blood Grp</span>
                      <strong className="text-ink font-bold">{a?.bloodGroup || "O+"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code & Barcode Row */}
              <div className="pt-2 border-t-2 border-ink flex items-center justify-between bg-paper-2 p-3">
                <div className="flex items-center gap-3">
                  <div className="cursor-pointer" onClick={() => setShowVerifyModal(true)} title="Click to verify QR Profile">
                    <StudentQrCode value={qrDataPayload} size={64} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-mono text-[9px] uppercase font-bold text-ink flex items-center gap-1">
                      <BadgeCheck className={`w-3 h-3 ${isVerified ? "text-emerald-700" : "text-blood"}`} /> {isVerified ? "Faculty Verified QR" : "Unverified QR"}
                    </p>
                    <p className="font-mono text-[9px] text-muted">Scan to verify credentials</p>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(true)}
                      className="font-mono text-[9px] font-bold text-blood underline hover:text-ink"
                    >
                      Click to Scan Profile
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono text-[9px] text-muted">Adm No: {a?.admissionNumber || "ADM-2024-88"}</p>
                  <p className="font-mono text-[9px] text-muted">Cat: {a?.category || "General"}</p>
                </div>
              </div>

              {/* Simulated Barcode Strip */}
              <div className="pt-1 text-center">
                <div className="h-6 w-full bg-ink/10 flex items-center justify-center font-mono text-[9px] tracking-[0.3em] font-bold border border-ink text-ink">
                  ||||| | |||||| || | |||| |||||| ||| {u.rollNo}
                </div>
              </div>
            </div>

            <div className="hazard h-2" />
          </div>
        ) : (
          /* BACK SIDE */
          <div>
            <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between border-b-2 border-ink">
              <p className="font-mono text-xs uppercase font-bold tracking-wider text-paper">
                Institutional Terms & Emergency Contact
              </p>
              <span className="font-mono text-[9px] text-paper/70">BACK SIDE</span>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs text-ink bg-paper">
              <div className="space-y-1.5 border-b border-ink/15 pb-3">
                <p className="text-[10px] text-muted uppercase font-bold">Residential Address:</p>
                <p className="text-xs font-serif leading-relaxed">
                  {a?.fatherName ? `C/O ${a.fatherName}, ` : ""}{a?.category ? `Room 402, Block B, Campus Hostel` : "Main Campus, University Hostel"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-ink/15 pb-3 text-[11px]">
                <div>
                  <span className="text-muted text-[10px] uppercase block">Emergency Phone:</span>
                  <strong>{a?.guardianPhone || "+91 98765 43210"}</strong>
                </div>
                <div>
                  <span className="text-muted text-[10px] uppercase block">Library Card ID:</span>
                  <strong>LIB-{u.rollNo}</strong>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-muted">
                <p className="font-bold text-ink">CARD INSTRUCTIONS:</p>
                <ul className="list-disc pl-4 space-y-0.5 leading-tight">
                  <li>This card is non-transferable and remains property of VSCMS ERP.</li>
                  <li>Mandatory for campus entry, library issuing, labs & examination halls.</li>
                  <li>Must be verified by Faculty/Registrar for institutional validity.</li>
                </ul>
              </div>

              <div className="pt-3 border-t-2 border-ink flex items-end justify-between">
                <div className="text-center">
                  <div className="w-20 h-6 border-b border-ink flex items-center justify-center italic font-serif text-xs text-muted">
                    VSCMS Seal
                  </div>
                  <span className="font-mono text-[9px] text-muted uppercase">Student Sign</span>
                </div>

                <div className="text-center">
                  <div className="w-24 h-6 border-b border-ink flex items-center justify-center font-serif font-bold text-xs text-blood">
                    {verificationRecord?.verifiedBy ? verificationRecord.verifiedBy : "Registrar VSCMS"}
                  </div>
                  <span className="font-mono text-[9px] text-muted uppercase">Authorized Faculty</span>
                </div>
              </div>
            </div>

            <div className="hazard h-2" />
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-muted text-center max-w-md mx-auto">
        Print this official student ID card or scan the QR Code for instant institutional authentication.
      </p>

      {/* QR SCAN & VERIFIED PROFILE MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-2 border-ink bg-paper hard p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <span className={`font-mono text-xs uppercase font-bold flex items-center gap-1.5 ${
                isVerified ? "text-emerald-800" : isPending ? "text-amber-800" : "text-rose-800"
              }`}>
                {isVerified ? (
                  <><BadgeCheck className="w-4 h-4 text-emerald-600" /> INSTITUTIONAL QR VERIFIED</>
                ) : isPending ? (
                  <><Clock className="w-4 h-4 text-amber-600" /> PENDING FACULTY APPROVAL</>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-rose-600" /> UNVERIFIED ID CARD</>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="p-1 text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`border-2 p-4 space-y-3 hard-sm ${
              isVerified ? "border-emerald-800 bg-emerald-50" : isPending ? "border-amber-800 bg-amber-50" : "border-rose-800 bg-rose-50"
            }`}>
              <div className={`flex items-center gap-2 font-mono text-xs font-extrabold uppercase ${
                isVerified ? "text-emerald-900" : isPending ? "text-amber-900" : "text-rose-900"
              }`}>
                {isVerified ? (
                  <><Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> OFFICIAL VERIFIED STUDENT PROFILE</>
                ) : isPending ? (
                  <><Clock className="w-4 h-4 text-amber-700 stroke-[3]" /> AWAITING FACULTY VERIFICATION</>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-rose-700 stroke-[3]" /> UNVERIFIED STUDENT CARD</>
                )}
              </div>

              <div className="flex gap-3 items-center pt-2 border-t border-ink/10">
                <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-16 !w-16 border-2 border-ink" />
                <div className="space-y-0.5 font-mono text-xs">
                  <h4 className="font-serif font-bold text-base text-ink">{u.name}</h4>
                  <p className="text-blood font-bold">Roll No: {u.rollNo}</p>
                  <p className="text-muted text-[11px]">{u.department} · Semester {u.semester || 1}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-2 border-t border-ink/10">
                <div>
                  <span className="text-muted text-[10px] block uppercase">Verification Status</span>
                  <span className={`font-extrabold ${isVerified ? "text-emerald-800" : isPending ? "text-amber-800" : "text-rose-800"}`}>
                    {isVerified ? "OFFICIALLY VERIFIED" : isPending ? "PENDING SIGN-OFF" : "NOT VERIFIED"}
                  </span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block uppercase">Verified By</span>
                  <span className="text-ink font-bold">{verificationRecord?.verifiedBy || "None"}</span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block uppercase">Admission No</span>
                  <span className="text-ink font-bold">{a?.admissionNumber || "ADM-2024-88"}</span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block uppercase">Token Hash</span>
                  <span className="text-blood font-bold">VSCMS-SEC-8849</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span>Scanned at: {new Date().toLocaleTimeString()}</span>
              <span>Campus Security Verification</span>
            </div>

            <div className="flex justify-end pt-1">
              <BrutalButton tone="ink" onClick={() => setShowVerifyModal(false)}>
                Close Verification
              </BrutalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FACULTY / ADMIN · STUDENT ID VERIFICATIONS CONSOLE
   ============================================================ */
export function FacultyIdVerificationsTab({
  students,
  verifications,
  currentUser,
  onApproveVerification,
  onRejectVerification,
}: {
  students: User[];
  verifications: Record<string, IdVerificationRecord>;
  currentUser: User | null;
  onApproveVerification: (rollNo: string, facultyName: string) => void;
  onRejectVerification: (rollNo: string, reason: string) => void;
}) {
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const facultyName = currentUser?.name || "Dr. Aris Thorne (Faculty)";

  const studentList = useMemo(() => {
    return students.map((s) => {
      const v = verifications[s.rollNo] || {
        rollNo: s.rollNo,
        studentName: s.name,
        department: s.department,
        status: "unverified",
      };
      return { ...s, verification: v };
    });
  }, [students, verifications]);

  const filtered = useMemo(() => {
    return studentList.filter((item) => {
      if (statusFilter !== "all" && item.verification.status !== statusFilter) return false;
      if (searchQ.trim()) {
        const q = searchQ.trim().toLowerCase();
        return item.name.toLowerCase().includes(q) || item.rollNo.toLowerCase().includes(q) || item.department.toLowerCase().includes(q);
      }
      return true;
    });
  }, [studentList, statusFilter, searchQ]);

  const pendingCount = studentList.filter((s) => s.verification.status === "pending").length;
  const verifiedCount = studentList.filter((s) => s.verification.status === "verified").length;

  const canAlter = canAlterStudentRecords(currentUser);

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        index="39"
        kicker="Campus Security & Registrar"
        title="Student ID"
        accent="Verifications Console"
        sub="Review and approve student ID card verification requests."
        right={
          <div className="flex items-center gap-2">
            <Tag tone="blood">{pendingCount} Pending Approval</Tag>
            <Tag tone="ink">{verifiedCount} Verified</Tag>
          </div>
        }
      />

      {!canAlter && (
        <div className="border-2 border-amber-800 bg-amber-50 p-3 font-mono text-xs text-amber-950 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Teacher Read-Only View:</strong> Approving or revoking student ID card verifications is restricted to <strong>Dean</strong>, <strong>HOD</strong>, or <strong>Class Coordinator</strong> authorization.
          </span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="border-2 border-ink bg-paper hard p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Search Student">
          <input
            className={INPUT}
            placeholder="Search by student name or roll number..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </Field>
        <Field label="Filter Verification Status">
          <select className={INPUT} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Students ({studentList.length})</option>
            <option value="pending">Pending Approval ({pendingCount})</option>
            <option value="verified">Verified ({verifiedCount})</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected / Flagged</option>
          </select>
        </Field>
      </div>

      {/* Table */}
      <div className="border-2 border-ink bg-paper hard overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink text-paper font-mono text-xs uppercase tracking-wider">
              <th className="p-3 border-r border-paper/20">Student Name</th>
              <th className="p-3 border-r border-paper/20">Roll No</th>
              <th className="p-3 border-r border-paper/20">Course</th>
              <th className="p-3 border-r border-paper/20">Status</th>
              <th className="p-3 border-r border-paper/20">Verified By / Timestamp</th>
              <th className="p-3 text-right">Faculty Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10 font-mono text-xs">
            {filtered.map((s) => {
              const v = s.verification;
              const isVerified = v.status === "verified";
              const isPending = v.status === "pending";
              const isRejected = v.status === "rejected";

              return (
                <tr key={s.id} className="hover:bg-paper-2 transition-colors">
                  <td className="p-3 font-serif font-bold text-ink flex items-center gap-2">
                    <SquareAvatar src={s.avatarUrl} initial={s.name.charAt(0)} className="!h-8 !w-8 border border-ink" />
                    <span>{s.name}</span>
                  </td>
                  <td className="p-3 text-blood font-bold">{s.rollNo}</td>
                  <td className="p-3 text-muted">{s.department}</td>
                  <td className="p-3">
                    {isVerified ? (
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 border border-ink text-[10px] uppercase flex items-center gap-1 w-fit">
                        <BadgeCheck className="w-3 h-3 text-emerald-700" /> Verified
                      </span>
                    ) : isPending ? (
                      <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 border border-ink text-[10px] uppercase flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3 text-amber-800 animate-spin" /> Pending Sign-off
                      </span>
                    ) : isRejected ? (
                      <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 border border-ink text-[10px] uppercase flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-700" /> Flagged
                      </span>
                    ) : (
                      <span className="bg-paper-3 text-muted font-bold px-2 py-0.5 border border-ink text-[10px] uppercase">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted text-[11px]">
                    {isVerified ? (
                      <div>
                        <span className="text-ink font-bold">{v.verifiedBy || facultyName}</span>
                        <span className="block text-[9px] text-muted">{v.verifiedAt || "2026-08-18"}</span>
                      </div>
                    ) : isPending ? (
                      <span className="text-amber-800 font-bold">Requested: {v.requestedAt || "Just now"}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {canAlter ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {!isVerified && (
                          <BrutalButton
                            tone="blood"
                            className="!py-1 !px-2.5 !text-[10px]"
                            onClick={() => onApproveVerification(s.rollNo, facultyName)}
                          >
                            <BadgeCheck className="w-3 h-3" /> Approve & Verify
                          </BrutalButton>
                        )}
                        {isVerified && (
                          <BrutalButton
                            tone="ghost"
                            className="!py-1 !px-2 !text-[10px]"
                            onClick={() => onRejectVerification(s.rollNo, "Faculty re-verification requested")}
                          >
                            Revoke
                          </BrutalButton>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] text-muted italic">Read-Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT · EXAM SCHEDULE
   ============================================================ */
export function StudentExamsTab({
  exams,
  enrollments,
  currentUser,
}: {
  exams: ExamSchedule[];
  enrollments: Enrollment[];
  currentUser: User | null;
}) {
  const today = new Date().toISOString().split("T")[0];
  const myCourses = enrollments.filter((e) => e.studentId === (currentUser?.id ?? -1));
  const upcoming = exams
    .filter((x) => x.examDate >= today)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  const past = exams
    .filter((x) => x.examDate < today)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
  const types = Array.from(new Set(upcoming.map((x) => x.examType)));

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        kicker="Examination Cell"
        title="Exam"
        accent="Schedule"
        sub="Dates, rooms and timings for your upcoming examinations."
        right={
          <div className="flex gap-2">
            {types.map((t) => <Tag key={t} tone="ink">{t}</Tag>)}
          </div>
        }
      />
      {myCourses.length > 0 && (
        <div className="border-2 border-ink bg-paper-3 hard p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-2">My Enrolled Courses ({myCourses.length})</p>
          <div className="flex flex-wrap gap-2">
            {myCourses.map((c) => (
              <span key={c.id} className="border-2 border-ink px-2.5 py-1 font-mono text-[11px] font-bold">
                {c.courseCode} <span className="text-muted font-normal">· Sem {c.semester}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {upcoming.length === 0 && <EmptyState label="No upcoming exams" hint="The exam cell will post dates here." />}
      <div className="space-y-3">
        {upcoming.map((x) => (
          <div key={x.id} className="lift border-2 border-ink bg-paper-3 hard p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="border-2 border-ink bg-paper px-3 py-1.5 text-center shrink-0">
                <p className="font-display text-xl text-blood leading-none">{x.examDate.slice(8)}</p>
                <p className="font-mono text-[9px] text-muted">{x.examDate.slice(0, 7)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] text-blood">{x.courseCode} · Sem {x.semester}</p>
                <p className="font-serif text-sm font-semibold">{x.courseName}</p>
              </div>
              <div className="text-right">
                <Tag tone="ink">{x.examType}</Tag>
                <p className="font-mono text-[10px] text-muted mt-1">{x.startTime} {x.endTime}</p>
                <p className="font-mono text-[10px] text-muted">{x.room}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {past.length > 0 && (
        <div>
          <h4 className="font-display uppercase text-sm text-ink mb-2">Completed <span className="text-muted">({past.length})</span></h4>
          <div className="flex flex-wrap gap-2">
            {past.slice(0, 8).map((x) => (
              <span key={x.id} className="border-2 border-ink/30 px-2 py-1 font-mono text-[10px] text-muted">
                {x.courseCode} · {x.examDate}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STUDENT · PROFILE + ADMISSION DETAILS (self-edit)
   ============================================================ */
export function StudentProfileTab({
  currentUser,
  admission,
  onUpdateProfile,
  onSaveAdmission,
}: {
  currentUser: User | null;
  admission: AdmissionInfo | null;
  onUpdateProfile: (d: { phone?: string; avatarUrl?: string }) => void;
  onSaveAdmission: (d: Partial<AdmissionInfo>) => void;
}) {
  const u = currentUser;
  const [phone, setPhone] = useState(u?.phone || "");
  const [avatar, setAvatar] = useState(u?.avatarUrl || "");
  const [a, setA] = useState<Partial<AdmissionInfo>>(
    admission || { category: "General", isHosteler: 0 },
  );
  if (!u) return <EmptyState label="Sign in to view your profile" />;

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ phone, avatarUrl: avatar });
  };
  const submitAdmission = (e: FormEvent) => {
    e.preventDefault();
    onSaveAdmission(a);
  };

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-5">
      <SectionTitle kicker="Identity" title="My" accent="Profile" sub="Personal details, admission record and contact information." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="border-2 border-ink bg-paper-3 hard p-4 flex items-center gap-4">
            <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-16 !w-16" />
            <div>
              <p className="font-display uppercase text-lg text-ink">{u.name}</p>
              <p className="font-mono text-[10px] text-muted">{u.email}</p>
              <p className="font-mono text-[10px] text-blood mt-1">{u.rollNo} · {u.department} · Sem {u.semester || 1}</p>
            </div>
          </div>
          <form onSubmit={submitProfile} className="border-2 border-ink bg-paper-3 p-4 space-y-3">
            <h4 className="font-display uppercase text-sm text-ink">Edit Contact</h4>
            <Field label="Phone"><input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Photo URL"><input className={INPUT} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></Field>
            <div className="flex justify-end"><BrutalButton type="submit" tone="blood"><BadgeCheck className="w-4 h-4" /> Save Profile</BrutalButton></div>
          </form>
        </div>
        <form onSubmit={submitAdmission} className="border-2 border-ink bg-paper-3 hard p-4 space-y-3">
          <h4 className="font-display uppercase text-sm text-ink">Admission Details <span className="font-mono text-[10px] text-muted">({a.admissionNumber || "not issued"})</span></h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={INPUT} value={a.category || "General"} onChange={(e) => setA({ ...a, category: e.target.value })}>
                {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Blood Group">
              <select className={INPUT} value={a.bloodGroup || ""} onChange={(e) => setA({ ...a, bloodGroup: e.target.value })}>
                <option value=""></option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Father's Name"><input className={INPUT} value={a.fatherName || ""} onChange={(e) => setA({ ...a, fatherName: e.target.value })} /></Field>
            <Field label="Mother's Name"><input className={INPUT} value={a.motherName || ""} onChange={(e) => setA({ ...a, motherName: e.target.value })} /></Field>
            <Field label="Guardian Phone"><input className={INPUT} value={a.guardianPhone || ""} onChange={(e) => setA({ ...a, guardianPhone: e.target.value })} /></Field>
            <Field label="Previous Institution"><input className={INPUT} value={a.previousInstitution || ""} onChange={(e) => setA({ ...a, previousInstitution: e.target.value })} /></Field>
          </div>
          <Field label="Address"><textarea rows={2} className={INPUT} value={a.address || ""} onChange={(e) => setA({ ...a, address: e.target.value })} /></Field>
          <label className="flex items-center gap-2 font-mono text-[11px] text-ink cursor-pointer">
            <input type="checkbox" checked={!!a.isHosteler} onChange={(e) => setA({ ...a, isHosteler: e.target.checked ? 1 : 0 })} />
            Hosteller (campus accommodation)
          </label>
          <div className="flex justify-end"><BrutalButton type="submit" tone="blood"><Check className="w-4 h-4" /> Save Admission</BrutalButton></div>
        </form>
      </div>

      {/* 🏆 COMPETITION ACHIEVEMENTS & HISTORY PORTFOLIO */}
      <div className="border-2 border-ink bg-paper-3 hard p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-blood tracking-widest block">Placement & Verified Honors</span>
            <h4 className="font-display uppercase text-lg text-ink flex items-center gap-2">
              🏆 Competition Achievements & History
            </h4>
          </div>
          <Tag tone="ink">Career Portfolio Verified</Tag>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border-2 border-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3.5 hard-sm space-y-2">
            <div className="flex justify-between items-start text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase font-mono text-[10px]">🥇 1st Place Winner</span>
              <span className="font-mono text-[10px] text-amber-700">CodeBlitz Algorithmic Challenge 2026</span>
            </div>
            <p className="font-serif text-xs text-ink font-semibold">Individual Algorithmic & DS Battle</p>
            <div className="text-[10px] font-mono text-muted border-t border-amber-600/30 pt-1.5 flex justify-between">
              <span>Code: VSCMS-CERT-2026-CODEBLITZ-101</span>
              <span className="font-bold text-emerald-600">✓ QR Verified</span>
            </div>
          </div>

          <div className="border-2 border-slate-600 bg-slate-100 dark:bg-slate-800/40 p-3.5 hard-sm space-y-2">
            <div className="flex justify-between items-start text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 uppercase font-mono text-[10px]">🥈 2nd Place Runner-Up</span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">National Business Case 2026</span>
            </div>
            <p className="font-serif text-xs text-ink font-semibold">Team Strategy Squad</p>
            <div className="text-[10px] font-mono text-muted border-t border-slate-600/30 pt-1.5 flex justify-between">
              <span>Code: VSCMS-CERT-2026-CASE-101</span>
              <span className="font-bold text-emerald-600">✓ QR Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT · ACADEMIC HISTORY (CGPA trend + transcript)
   ============================================================ */
export function StudentHistoryTab({
  grades,
  currentUser,
}: {
  grades: GradeRecord[];
  currentUser: User | null;
}) {
  const mine = grades.filter((g) => g.studentId === (currentUser?.id ?? -1));
  const bySem = useMemo(() => {
    const map = new Map<number, GradeRecord[]>();
    mine.forEach((g) => {
      const arr = map.get(g.semester) || [];
      arr.push(g);
      map.set(g.semester, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [mine]);
  const trend = bySem.map(([sem, list]) => ({
    label: `Sem ${sem}`,
    value: Math.round(
      list.reduce((s, g) => s + (Number(g.marksObtained) / Number(g.maxMarks || 100)) * 100, 0) / list.length,
    ),
  }));
  const overall = mine.length
    ? mine.reduce((s, g) => s + (Number(g.marksObtained) / Number(g.maxMarks || 100)) * 100, 0) / mine.length
    : 0;
  const gpa = Number(currentUser?.gpa) || (overall / 25).toFixed(2) || "3.8";

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        kicker="Transcript"
        title="Academic"
        accent="History"
        sub="Semester-wise performance, CGPA trend and full transcript."
        right={<Tag tone="ink">CGPA {typeof gpa === "string" ? gpa : gpa.toFixed(2)}</Tag>}
      />
      {mine.length === 0 ? (
        <EmptyState label="No grades recorded yet" hint="Results will appear here once published." />
      ) : (
        <>
          <div className="border-2 border-ink bg-paper-3 hard p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-3">Score Trend by Semester</p>
            <MiniBarChart data={trend} height={140} />
          </div>
          <div className="space-y-4">
            {bySem.map(([sem, list]) => {
              const avg = list.reduce((s, g) => s + (Number(g.marksObtained) / Number(g.maxMarks || 100)) * 100, 0) / list.length;
              return (
                <div key={sem} className="border-2 border-ink">
                  <div className="bg-ink text-paper px-4 py-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Semester {sem}</span>
                    <span className="font-mono text-[11px] text-paper/70">Avg {avg.toFixed(1)}%</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr><th className={TH}>Course</th><th className={TH}>Exam</th><th className={TH}>Marks</th><th className={TH}>Grade</th><th className={TH}>Remarks</th></tr></thead>
                    <tbody>
                      {list.map((g) => (
                        <tr key={g.id} className="border-b-2 border-ink/10">
                          <td className={TD}><p className="font-serif text-xs font-semibold">{g.courseName}</p></td>
                          <td className={TD}><span className="font-mono text-[10px]">{g.examType}</span></td>
                          <td className={TD}><span className="font-mono text-[11px]">{g.marksObtained} / {g.maxMarks}</span></td>
                          <td className={TD}><Tag tone={g.gradeLetter.startsWith("A") ? "ink" : "blood"}>{g.gradeLetter}</Tag></td>
                          <td className={TD}><span className="font-serif italic text-xs text-muted">{g.remarks || ""}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          <div className="border-2 border-ink bg-ink text-paper p-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/70">Cumulative Score</span>
            <span className="font-display text-2xl">{overall.toFixed(1)}%</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   ADMIN · EXAMINATION CELL (exam creation · timetable · results)
   ============================================================ */
export function AdminExamCellTab({
  exams,
  examDefs,
  marks,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onAddExamDef,
  onUpdateExamDef,
  onDeleteExamDef,
  onDeleteMark,
  onChangeMarkStatus,
}: {
  exams: ExamSchedule[];
  examDefs: ExamDefinition[];
  marks: InternalMark[];
  onAddExam: (d: Partial<ExamSchedule>) => void;
  onUpdateExam: (d: Partial<ExamSchedule>) => void;
  onDeleteExam: (id: number) => void;
  onAddExamDef: (d: Partial<ExamDefinition>) => void;
  onUpdateExamDef: (d: Partial<ExamDefinition>) => void;
  onDeleteExamDef: (id: number) => void;
  onDeleteMark: (id: number) => void;
  onChangeMarkStatus: (courseId: number, examType: string, status: string) => void;
}) {
  const [defF, setDefF] = useState({
    name: "",
    examType: "Mid-Term",
    department: "BCA (CSJM)",
    semester: 3,
    session: "2025-26",
    startDate: "",
    endDate: "",
    status: "scheduled",
    passingPercent: 40,
  });
  const [defEdit, setDefEdit] = useState<number | null>(null);
  const empty = {
    examType: "Mid-Term",
    courseCode: "",
    courseName: "",
    department: "BCA (CSJM)",
    semester: 3,
    examDate: "",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    room: "",
  };
  const [f, setF] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  const passCount = marks.filter((m) => m.result === "pass").length;
  const passRate = pct(passCount, marks.length || 1);
  const backlogs = marks.filter((m) => m.result === "fail");

  const submitDef = (e: FormEvent) => {
    e.preventDefault();
    if (defEdit != null) onUpdateExamDef({ id: defEdit, ...defF });
    else onAddExamDef(defF);
    setDefF((p) => ({ ...p, name: "", startDate: "", endDate: "" }));
    setDefEdit(null);
  };
  const cycleStatus = (d: ExamDefinition) => {
    const next = d.status === "scheduled" ? "running" : d.status === "running" ? "completed" : "scheduled";
    onUpdateExamDef({ id: d.id, status: next });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editId != null) onUpdateExam({ id: editId, ...f });
    else onAddExam(f);
    setF(empty);
    setEditId(null);
  };
  const filtered = exams.filter(
    (x) =>
      x.courseCode.toLowerCase().includes(q.toLowerCase()) ||
      x.courseName.toLowerCase().includes(q.toLowerCase()) ||
      x.department.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-6">
      <SectionTitle
        index="09"
        kicker="Examination Cell"
        title="Internal"
        accent="Exams"
        sub="Create offline internal exams, plan the timetable and publish results."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="lift border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Exams Created</p>
          <p className="font-display text-3xl leading-none mt-3 text-ink">{examDefs.length}</p>
        </div>
        <div className="lift border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Marks Entered</p>
          <p className="font-display text-3xl leading-none mt-3 text-ink">{marks.length}</p>
        </div>
        <div className="lift border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Pass Rate</p>
          <p className="font-display text-3xl leading-none mt-3 text-ink">{passRate}%</p>
        </div>
        <div className="lift border-2 border-ink bg-paper hard p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Backlogs</p>
          <p className="font-display text-3xl leading-none mt-3 text-blood">{backlogs.length}</p>
        </div>
      </div>

      {/* 1 · CREATE EXAM */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">1 · Create <span className="text-blood">Exam</span></h4>
        <form onSubmit={submitDef} className="border-2 border-ink bg-paper-3 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Field label="Exam Name"><input className={INPUT} value={defF.name} onChange={(e) => setDefF({ ...defF, name: e.target.value })} required placeholder="Mid-Term Examination 2026" /></Field>
          <Field label="Type">
            <select className={INPUT} value={defF.examType} onChange={(e) => setDefF({ ...defF, examType: e.target.value })}>
              {["Mid-Term", "Sessional", "Unit Test", "Practical"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Department"><input className={INPUT} value={defF.department} onChange={(e) => setDefF({ ...defF, department: e.target.value })} required /></Field>
          <Field label="Semester"><input type="number" min={1} max={8} className={INPUT} value={defF.semester} onChange={(e) => setDefF({ ...defF, semester: Number(e.target.value) })} /></Field>
          <Field label="Session"><input className={INPUT} value={defF.session} onChange={(e) => setDefF({ ...defF, session: e.target.value })} /></Field>
          <Field label="Starts"><input type="date" className={INPUT} value={defF.startDate} onChange={(e) => setDefF({ ...defF, startDate: e.target.value })} required /></Field>
          <Field label="Ends"><input type="date" className={INPUT} value={defF.endDate} onChange={(e) => setDefF({ ...defF, endDate: e.target.value })} required /></Field>
          <Field label="Status">
            <select className={INPUT} value={defF.status} onChange={(e) => setDefF({ ...defF, status: e.target.value })}>
              {["scheduled", "running", "completed"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Passing %"><input type="number" min={1} max={99} className={INPUT} value={defF.passingPercent} onChange={(e) => setDefF({ ...defF, passingPercent: Number(e.target.value) })} /></Field>
          <div className="flex items-end gap-2">
            <BrutalButton type="submit" tone="blood">{defEdit != null ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Create</>}</BrutalButton>
            {defEdit != null && (
              <BrutalButton tone="ghost" onClick={() => { setDefEdit(null); setDefF({ name: "", examType: "Mid-Term", department: "BCA (CSJM)", semester: 3, session: "2025-26", startDate: "", endDate: "", status: "scheduled", passingPercent: 40 }); }}>×</BrutalButton>
            )}
          </div>
        </form>
        <div className="flex flex-wrap gap-2.5">
          {examDefs.map((d) => (
            <div key={d.id} className="lift border-2 border-ink bg-paper hard px-3 py-2.5 flex items-center gap-2.5">
              <div className="min-w-0">
                <p className="font-serif text-xs font-semibold text-ink">{d.name}</p>
                <p className="font-mono text-[9px] text-muted">{d.examType} · Sem {d.semester} · {d.session}</p>
                <p className="font-mono text-[9px] text-muted">{d.startDate} → {d.endDate} · pass {d.passingPercent}%</p>
              </div>
              <button onClick={() => cycleStatus(d)} title="Cycle status" className={`border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase press ${d.status === "completed" ? "border-ink bg-paper text-ink" : d.status === "running" ? "border-blood bg-blood text-paper" : "border-ink bg-paper-3 text-ink"}`}>{d.status}</button>
              <button onClick={() => { setDefEdit(d.id); setDefF({ name: d.name, examType: d.examType, department: d.department, semester: d.semester, session: d.session, startDate: d.startDate, endDate: d.endDate, status: d.status, passingPercent: d.passingPercent }); }} className="border-2 border-ink p-1 hover:bg-ink hover:text-paper press"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => onDeleteExamDef(d.id)} className="border-2 border-ink p-1 hover:bg-blood hover:border-blood press"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          {examDefs.length === 0 && <EmptyState label="No exams created" hint="Create the first internal exam above." />}
        </div>
      </div>

      {/* 2 · TIMETABLE */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">2 · Exam <span className="text-blood">Timetable</span></h4>
        <form onSubmit={submit} className="border-2 border-ink bg-paper-3 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Exam Type">
            <select className={INPUT} value={f.examType} onChange={(e) => setF({ ...f, examType: e.target.value })}>
              {["Mid-Term", "Internal", "Final", "Practical"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Course Code"><input className={INPUT} value={f.courseCode} onChange={(e) => setF({ ...f, courseCode: e.target.value })} required placeholder="BCA301" /></Field>
          <Field label="Course Name"><input className={INPUT} value={f.courseName} onChange={(e) => setF({ ...f, courseName: e.target.value })} required placeholder="Database Management" /></Field>
          <Field label="Department"><input className={INPUT} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} required /></Field>
          <Field label="Semester"><input type="number" min={1} max={8} className={INPUT} value={f.semester} onChange={(e) => setF({ ...f, semester: Number(e.target.value) })} /></Field>
          <Field label="Date"><input type="date" className={INPUT} value={f.examDate} onChange={(e) => setF({ ...f, examDate: e.target.value })} required /></Field>
          <Field label="Start"><input className={INPUT} value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} required /></Field>
          <Field label="End"><input className={INPUT} value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} required /></Field>
          <Field label="Room"><input className={INPUT} value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} required /></Field>
          <div className="flex items-end gap-2">
            <BrutalButton type="submit" tone="blood">{editId != null ? <><Edit2 className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Add Slot</>}</BrutalButton>
            {editId != null && <BrutalButton tone="ghost" onClick={() => { setF(empty); setEditId(null); }}>Cancel</BrutalButton>}
          </div>
          <Field label="Search"><input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter…" /></Field>
        </form>
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Exam</th><th className={TH}>Course</th><th className={TH}>Dept · Sem</th><th className={TH}>Date</th><th className={TH}>Time</th><th className={TH}>Room</th><th className={TH + " text-center"}>Edit</th><th className={TH + " text-center"}>Del</th></tr></thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id} className="border-b-2 border-ink/10">
                  <td className={TD}><Tag tone="ink">{x.examType}</Tag></td>
                  <td className={TD}><p className="font-mono text-[11px] text-blood">{x.courseCode}</p><p className="font-serif text-xs">{x.courseName}</p></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.department} · Sem {x.semester}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.examDate}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.startTime} {x.endTime}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.room}</span></td>
                  <td className={TD + " text-center"}><button onClick={() => { setEditId(x.id); setF({ examType: x.examType, courseCode: x.courseCode, courseName: x.courseName, department: x.department, semester: x.semester, examDate: x.examDate, startTime: x.startTime, endTime: x.endTime, room: x.room }); }} className="border-2 border-ink p-1.5 hover:bg-ink hover:text-paper press"><Edit2 className="w-3.5 h-3.5" /></button></td>
                  <td className={TD + " text-center"}><button onClick={() => onDeleteExam(x.id)} className="border-2 border-ink p-1.5 hover:bg-blood hover:border-blood press"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8}><div className="p-6"><EmptyState label="No exams scheduled" hint="Add a slot above." /></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 · RESULTS & BACKLOGS */}
      <div className="space-y-3">
        <h4 className="font-display uppercase text-sm text-ink">3 · Results & <span className="text-blood">Backlogs</span></h4>
        <div className="space-y-5">
          <div className="border-2 border-ink overflow-x-auto">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Result Register</span>
              <div className="flex items-center gap-1.5">
                <Tag tone="blood">{marks.filter((m) => m.status === "submitted").length} pending</Tag>
                <Tag tone="ink">{marks.filter((m) => m.status === "approved").length} published</Tag>
              </div>
              </div>
              <div className="max-h-[260px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10"><tr><th className={TH}>Scholar</th><th className={TH}>Course</th><th className={TH}>Exam</th><th className={TH}>Score</th><th className={TH}>Grade</th><th className={TH}>Status</th><th className={TH + " text-center"}>Actions</th></tr></thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m.id} className="border-b-2 border-ink/10">
                    <td className={TD}><span className="font-serif text-xs font-semibold">{m.studentName}</span></td>
                    <td className={TD}><span className="font-mono text-[10px] text-blood">{m.courseCode}</span><span className="block font-serif text-[11px] text-muted">{m.courseName}</span></td>
                    <td className={TD}><Tag tone="ink">{m.examType}</Tag></td>
                    <td className={TD}><span className="font-mono text-[10px]">{m.theoryMarks}/{m.maxTheory} + {m.practicalMarks}/{m.maxPractical} = <b>{m.totalMarks}/{m.maxTotal}</b></span></td>
                    <td className={TD}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-blood border-2 border-ink px-1.5 py-0.5 bg-paper-3">{m.gradeLetter}</span>
                        <Tag tone={m.result === "pass" ? "ink" : "blood"}>{m.result}</Tag>
                      </div>
                    </td>
                    <td className={TD}>
                      <Tag tone={m.status === "approved" ? "ink" : m.status === "submitted" ? "blood" : "paper"}>{m.status}</Tag>
                    </td>
                    <td className={TD + " text-center"}>
                      <div className="flex items-center justify-center gap-1.5">
                        {m.status === "submitted" && (
                          <>
                            <button onClick={() => onChangeMarkStatus(m.courseId, m.examType, "approved")} title="Approve & publish" className="border-2 border-ink p-1 hover:bg-ink hover:text-paper press"><BadgeCheck className="w-3 h-3" /></button>
                            <button onClick={() => onChangeMarkStatus(m.courseId, m.examType, "draft")} title="Reject back to faculty" className="border-2 border-ink p-1 hover:bg-blood hover:border-blood press"><X className="w-3 h-3" /></button>
                          </>
                        )}
                        {m.status === "approved" && (
                          <button onClick={() => onChangeMarkStatus(m.courseId, m.examType, "draft")} title="Unpublish" className="border-2 border-ink p-1 hover:bg-ink hover:text-paper press"><Undo2 className="w-3 h-3" /></button>
                        )}
                        <button onClick={() => onDeleteMark(m.id)} title="Delete" className="border-2 border-ink p-1 hover:bg-blood hover:border-blood press"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {marks.length === 0 && <tr><td colSpan={7}><div className="p-4"><EmptyState label="No marks entered" hint="Teachers enter marks from the Exam Marks desk." /></div></td></tr>}
                  </tbody>
                </table>
              </div>
          </div>
          <div className="border-2 border-ink overflow-x-auto">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Backlog Tracking</span>
              <Stamp>Failed</Stamp>
            </div>
            <div className="max-h-[260px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10"><tr><th className={TH}>Scholar</th><th className={TH}>Subject</th><th className={TH}>Exam</th><th className={TH}>Score</th><th className={TH}>Status</th></tr></thead>
              <tbody>
                {backlogs.map((m) => (
                  <tr key={m.id} className="border-b-2 border-ink/10">
                    <td className={TD}><span className="font-serif text-xs font-semibold">{m.studentName}</span></td>
                    <td className={TD}><span className="font-mono text-[10px]">{m.courseCode}</span></td>
                    <td className={TD}><span className="font-mono text-[10px]">{m.examType}</span></td>
                    <td className={TD}><span className="font-mono text-[10px] text-blood font-bold">{m.totalMarks}/{m.maxTotal} · needs {m.passMarks}</span></td>
                    <td className={TD}><Stamp>Backlog</Stamp></td>
                  </tr>
                ))}
                {backlogs.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No backlogs" hint="Every scholar cleared every subject." /></div></td></tr>}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FACULTY · EXAM MARKS ENTRY (theory + practical per student)
   ============================================================ */
const STATUS_BADGE: Record<string, { label: string; tone: "ink" | "blood" | "paper" }> = {
  draft: { label: "Draft", tone: "paper" },
  submitted: { label: "Awaiting Approval", tone: "blood" },
  approved: { label: "Approved", tone: "ink" },
};

function MarksSheet({
  course,
  examType,
  maxT,
  maxP,
  passP,
  enrolled,
  existing,
  onSave,
  onChangeStatus,
}: {
  course: Course;
  examType: string;
  maxT: number;
  maxP: number;
  passP: number;
  enrolled: Enrollment[];
  existing: InternalMark[];
  onSave: (rows: Partial<InternalMark>[], status?: string) => void;
  onChangeStatus: (courseId: number, examType: string, status: string) => void;
}) {
  const [draft, setDraft] = useState<Record<number, { theory: string; practical: string }>>(() => {
    const map: Record<number, { theory: string; practical: string }> = {};
    enrolled.forEach((e) => {
      const prev = existing.find((m) => m.studentId === e.studentId);
      map[e.studentId] = { theory: prev?.theoryMarks || "", practical: prev?.practicalMarks || "" };
    });
    return map;
  });
  // Sheet badge reflects the most advanced state across its rows, so a
  // partially submitted sheet still shows as awaiting approval.
  const sheetStatus =
    existing.some((m) => m.status === "approved")
      ? "approved"
      : existing.some((m) => m.status === "submitted")
        ? "submitted"
        : "draft";
  const locked = sheetStatus !== "draft";
  const badge = STATUS_BADGE[sheetStatus] || STATUS_BADGE.draft;

  const set = (studentId: number, key: "theory" | "practical", v: string) => {
    setDraft((p) => ({ ...p, [studentId]: { ...(p[studentId] || { theory: "", practical: "" }), [key]: v } }));
  };

  const collectRows = (): Partial<InternalMark>[] =>
    enrolled
      .filter((en) => {
        const d = draft[en.studentId];
        return d && (d.theory !== "" || d.practical !== "");
      })
      .map((en) => {
        const d = draft[en.studentId] || { theory: "", practical: "" };
        const prev = existing.find((m) => m.studentId === en.studentId);
        return {
          id: prev?.id,
          studentId: en.studentId,
          studentName: en.studentName,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          examType,
          semester: en.semester,
          theoryMarks: d.theory || "0",
          practicalMarks: d.practical || "0",
          maxTheory: String(maxT),
          maxPractical: String(maxP),
          passingPercent: passP,
        };
      });

  const submitDraft = (e: FormEvent) => {
    e.preventDefault();
    const rows = collectRows();
    if (rows.length === 0) {
      alert("Enter marks for at least one student before saving.");
      return;
    }
    onSave(rows);
  };

  const submitForApproval = () => {
    const rows = collectRows();
    if (rows.length === 0) {
      alert("Enter marks for at least one student before submitting for approval.");
      return;
    }
    onSave(rows, "submitted");
  };

  const swallow = (e: FormEvent) => e.preventDefault();

  return (
    <form onSubmit={locked ? swallow : submitDraft} className="border-2 border-ink bg-paper hard">
      <div className="px-4 py-3 border-b-2 border-ink bg-paper-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold">{course.code} · {course.name}</span>
        <div className="flex items-center gap-2">
          <Tag tone="ink">{examType}</Tag>
          <Tag tone={badge.tone}>{badge.label}</Tag>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>Scholar</th><th className={TH}>Theory / {maxT}</th><th className={TH}>Practical / {maxP}</th><th className={TH}>Total</th><th className={TH}>Grade</th><th className={TH}>Result</th></tr></thead>
          <tbody>
            {enrolled.map((en) => {
              const d = draft[en.studentId] || { theory: "", practical: "" };
              const r = computeInternal(d.theory || 0, d.practical || 0, maxT, maxP, passP);
              const empty = d.theory === "" && d.practical === "";
              return (
                <tr key={en.studentId} className="border-b-2 border-ink/10">
                  <td className={TD}>
                    <p className="font-serif text-xs font-semibold">{en.studentName}</p>
                    <p className="font-mono text-[10px] text-muted">ID {en.studentId}</p>
                  </td>
                  <td className={TD}><input type="number" min={0} max={maxT} disabled={locked} className={`${INPUT} !w-20 disabled:opacity-50 disabled:bg-paper-2`} value={d.theory} onChange={(e) => set(en.studentId, "theory", e.target.value)} placeholder="0" /></td>
                  <td className={TD}><input type="number" min={0} max={maxP} disabled={locked} className={`${INPUT} !w-20 disabled:opacity-50 disabled:bg-paper-2`} value={d.practical} onChange={(e) => set(en.studentId, "practical", e.target.value)} placeholder="0" /></td>
                  <td className={TD}><span className="font-mono text-[11px] font-bold">{r.total}/{r.maxTotal}</span></td>
                  <td className={TD}><span className="font-display text-blood border-2 border-ink px-1.5 py-0.5 bg-paper-3">{empty ? "" : r.gradeLetter}</span></td>
                  <td className={TD}>{empty ? <span className="font-mono text-[10px] text-muted"></span> : <Tag tone={r.result === "pass" ? "ink" : "blood"}>{r.result}</Tag>}</td>
                </tr>
              );
            })}
            {enrolled.length === 0 && <tr><td colSpan={6}><div className="p-4"><EmptyState label="No students enrolled" hint="Enroll students from Academic Setup first." /></div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t-2 border-ink flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-muted">
          Passing at {passP}% · minimum {Math.ceil(((maxT + maxP) * passP) / 100)} marks
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {locked ? (
            sheetStatus === "submitted" ? (
              <>
                <Stamp>Locked</Stamp>
                <BrutalButton tone="ghost" onClick={() => onChangeStatus(course.id, examType, "draft")}>
                  <X className="w-4 h-4" /> Withdraw
                </BrutalButton>
              </>
            ) : (
              <>
                <Stamp>Published</Stamp>
                <span className="font-mono text-[10px] text-muted">Contact the Examination Cell to modify.</span>
              </>
            )
          ) : (
            <>
              <BrutalButton type="submit" tone="ghost" disabled={enrolled.length === 0}>
                <Check className="w-4 h-4" /> Save Draft
              </BrutalButton>
              <BrutalButton type="button" tone="blood" disabled={enrolled.length === 0} onClick={submitForApproval}>
                <Send className="w-4 h-4" /> Submit for Approval
              </BrutalButton>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

export function FacultyMarksEntryTab({
  courses,
  enrollments,
  marks,
  currentUser,
  onSaveMarks,
  onChangeMarkStatus,
}: {
  courses: Course[];
  enrollments: Enrollment[];
  marks: InternalMark[];
  currentUser: User | null;
  onSaveMarks: (rows: Partial<InternalMark>[], status?: string) => void;
  onChangeMarkStatus: (courseId: number, examType: string, status: string) => void;
}) {
  const [examType, setExamType] = useState("Mid-Term");
  // Faculty can see and edit the courses assigned to them, with fallback to all courses catalog.
  const ownedCourses = courses.filter(
    (c) => c.facultyId === currentUser?.id || c.facultyName === currentUser?.name,
  );
  const availableCourses = ownedCourses.length > 0 ? ownedCourses : courses;
  const [courseId, setCourseId] = useState<number>(availableCourses[0]?.id || 0);
  const [maxT, setMaxT] = useState(30);
  const [maxP, setMaxP] = useState(20);
  const [passP, setPassP] = useState(40);
  const course = availableCourses.find((c) => c.id === courseId) || availableCourses[0];
  const enrolled = enrollments.filter((e) => e.courseId === (course?.id ?? -1));
  const existing = marks.filter((m) => m.courseId === (course?.id ?? -1) && m.examType === examType);

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        kicker="Examination Cell"
        title="Exam"
        accent="Marks Entry"
        sub="Enter internal theory + practical marks per subject grades compute automatically."
      />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-2 border-ink bg-paper-3 p-3">
        <Field label="Exam Type">
          <select className={INPUT} value={examType} onChange={(e) => setExamType(e.target.value)}>
            {["Mid-Term", "Sessional", "Unit Test", "Practical"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Course">
          <select className={INPUT} value={courseId} onChange={(e) => setCourseId(Number(e.target.value))} disabled={availableCourses.length === 0}>
            {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select>
        </Field>
        <Field label="Max Theory"><input type="number" min={1} max={100} className={INPUT} value={maxT} onChange={(e) => setMaxT(Number(e.target.value))} /></Field>
        <Field label="Max Practical"><input type="number" min={1} max={100} className={INPUT} value={maxP} onChange={(e) => setMaxP(Number(e.target.value))} /></Field>
        <Field label="Passing %"><input type="number" min={1} max={99} className={INPUT} value={passP} onChange={(e) => setPassP(Number(e.target.value))} /></Field>
      </div>
      {availableCourses.length === 0 && (
        <EmptyState
          label="No courses available"
          hint="Create courses in Academic Setup first."
        />
      )}
      {course && (
        <MarksSheet
          key={`${course.id}-${examType}-${maxT}-${maxP}-${passP}`}
          course={course}
          examType={examType}
          maxT={maxT}
          maxP={maxP}
          passP={passP}
          enrolled={enrolled}
          existing={existing}
          onSave={onSaveMarks}
          onChangeStatus={onChangeMarkStatus}
        />
      )}
      {ownedCourses.length > 0 && (
      <div className="flex flex-wrap items-center gap-2 border-2 border-dashed border-ink/40 p-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-muted">Approval Workflow</span>
        <Tag tone="paper">Draft</Tag>
        <span className="font-mono text-[10px] text-muted">→</span>
        <Tag tone="blood">Awaiting Approval</Tag>
        <span className="font-mono text-[10px] text-muted">→</span>
        <Tag tone="ink">Approved · Published</Tag>
        <span className="ml-auto font-mono text-[10px] text-muted">Sheets lock once submitted the Examination Cell must approve them before students see results. Only your assigned courses appear here.</span>
      </div>
      )}
    </div>
  );
}

/* ============================================================
   STUDENT · RESULTS (subject-wise sheet · GPA · backlogs)
   ============================================================ */
export function StudentResultsTab({
  marks,
  currentUser,
}: {
  marks: InternalMark[];
  currentUser: User | null;
}) {
  const filteredMarks = marks.filter(
    (m) =>
      m.status === "approved" &&
      (m.studentId === currentUser?.id || m.studentName === currentUser?.name || String(m.studentId) === currentUser?.rollNo),
  );
  const mine = filteredMarks.length > 0 ? filteredMarks : marks.filter((m) => m.status === "approved");
  const order = ["Mid-Term", "Sessional", "Unit Test", "Practical"];
  const types = Array.from(new Set(mine.map((m) => m.examType))).sort(
    (a, b) => (order.indexOf(a) - order.indexOf(b)) || a.localeCompare(b),
  );
  const overall = computeOverallPct(
    mine.map((m) => ({ total: Number(m.totalMarks || 0), maxTotal: Number(m.maxTotal || 1) })),
  );
  const gpa = computeGpa(
    mine.map((m) => ({
      gradePoint: GRADE_BANDS.find(([, l]) => l === m.gradeLetter)?.[2] || 0,
      maxTotal: Number(m.maxTotal || 1),
    })),
  );
  const backlogs = mine.filter((m) => m.result === "fail");
  const passed = mine.length - backlogs.length;
  const clear = backlogs.length === 0;

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        index="03"
        kicker="Examination Cell"
        title="Results &"
        accent="Backlogs"
        sub="Subject-wise internal scores, GPA and pending backlogs."
        right={<BrutalButton tone="ink" onClick={() => printElement("student-result-sheet")}><Printer className="w-4 h-4" /> Print</BrutalButton>}
      />

      {mine.length === 0 && <EmptyState label="No results published yet" hint="Your teacher will publish marks after each internal exam." />}

      {mine.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="lift border-2 border-ink bg-paper hard p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Overall</p>
              <p className="font-display text-3xl leading-none mt-3 text-ink">{overall.toFixed(1)}%</p>
              <p className="mt-2 font-serif italic text-xs text-muted">{passed} cleared · {backlogs.length} backlog</p>
            </div>
            <div className="lift border-2 border-ink bg-paper hard p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">GPA</p>
              <p className="font-display text-3xl leading-none mt-3 text-blood">{gpa.toFixed(2)}</p>
              <p className="mt-2 font-serif italic text-xs text-muted">weighted · 10 scale</p>
            </div>
            <div className="lift border-2 border-ink bg-paper hard p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Subjects</p>
              <p className="font-display text-3xl leading-none mt-3 text-ink">{mine.length}</p>
              <p className="mt-2 font-serif italic text-xs text-muted">{types.length} exam types</p>
            </div>
            <div className={`lift border-2 border-ink hard p-4 ${clear ? "bg-ink text-paper" : "bg-blood text-paper"}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70">Backlogs</p>
              <p className="font-display text-3xl leading-none mt-3">{backlogs.length}</p>
              <p className="mt-2 font-serif italic text-xs text-paper/80">{clear ? "All clear 🎉" : "clear in next attempt"}</p>
            </div>
          </div>
          <div id="student-result-sheet" className="space-y-4">
            {types.map((t) => {
              const rows = mine.filter((m) => m.examType === t);
              if (rows.length === 0) return null;
              const passCount = rows.filter((m) => m.result === "pass").length;
              return (
                <div key={t} className="border-2 border-ink overflow-x-auto">
                  <div className="px-3 py-2 border-b-2 border-ink bg-ink text-paper flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">{t}</span>
                    <span className="font-mono text-[10px] text-paper/70">{passCount}/{rows.length} cleared</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr><th className={TH}>Subject</th><th className={TH}>Theory</th><th className={TH}>Practical</th><th className={TH}>Total</th><th className={TH}>%</th><th className={TH}>Grade</th><th className={TH}>Result</th></tr></thead>
                    <tbody>
                      {rows.map((m) => {
                        const pctV = (Number(m.maxTotal || 1) > 0 ? (Number(m.totalMarks || 0) / Number(m.maxTotal || 1)) * 100 : 0).toFixed(1);
                        return (
                          <tr key={m.id} className="border-b-2 border-ink/10">
                            <td className={TD}><span className="font-mono text-[11px] text-blood">{m.courseCode}</span><span className="block font-serif text-xs">{m.courseName}</span></td>
                            <td className={TD}><span className="font-mono text-[11px]">{m.theoryMarks}/{m.maxTheory}</span></td>
                            <td className={TD}><span className="font-mono text-[11px]">{m.practicalMarks}/{m.maxPractical}</span></td>
                            <td className={TD}><span className="font-mono text-[11px] font-bold">{m.totalMarks}/{m.maxTotal}</span></td>
                            <td className={TD}><span className="font-mono text-[11px]">{pctV}%</span></td>
                            <td className={TD}><span className="font-display text-blood border-2 border-ink px-1.5 py-0.5 bg-paper-3">{m.gradeLetter}</span></td>
                            <td className={TD}><Tag tone={m.result === "pass" ? "ink" : "blood"}>{m.result}</Tag></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          {backlogs.length > 0 && (
            <div className="border-2 border-ink bg-paper-3 hard p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-blood" />
                <p className="font-display uppercase text-sm text-ink">Backlog <span className="text-blood">Tracking</span></p>
              </div>
              <div className="space-y-2">
                {backlogs.map((m) => (
                  <div key={m.id} className="border-2 border-ink bg-paper px-3 py-2 flex flex-wrap items-center gap-3">
                    <Tag tone="blood">{m.examType}</Tag>
                    <span className="font-serif text-xs font-semibold">{m.courseName}</span>
                    <span className="font-mono text-[10px] text-muted">{m.courseCode}</span>
                    <span className="ml-auto font-mono text-[10px] text-blood font-bold">{m.totalMarks}/{m.maxTotal} · needed {m.passMarks}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-serif italic text-xs text-muted">
                Backlogs must be cleared in the next internal attempt to pass the subject.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   STUDENT · ADMIT CARD (fee-gated download)
   ============================================================ */
export function StudentAdmitCardTab({
  currentUser,
  feeRecords,
  exams,
  onGoToFees,
}: {
  currentUser: User | null;
  feeRecords: FeeRecord[];
  exams: ExamSchedule[];
  onGoToFees: () => void;
}) {
  const u = currentUser;
  const myFees = feeRecords.filter(
    (f) => f.studentId === u?.id || f.studentName === u?.name,
  );
  const pending = myFees.filter((f) => feeEffectiveStatus(f) !== "paid");
  const eligible = myFees.length > 0 && pending.length === 0;
  const totalDue = pending.reduce((a, f) => a + feeRemaining(f), 0);
  const session = "2025-26";
  const myExams = exams
    .filter((x) => x.semester === (u?.semester || 1))
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  const myCourses = Array.from(new Set(myExams.map((x) => x.courseCode)));
  const types = Array.from(new Set(myExams.map((x) => x.examType)));

  if (!u) return <EmptyState label="Sign in to view your admit card" />;

  /* ---- NOT ELIGIBLE: fees pending ---- */
  if (!eligible) {
    return (
      <div className="border-2 border-ink bg-paper hard p-4 sm:p-6">
        <SectionTitle
          kicker="Examination Cell"
          title="Admit"
          accent="Card"
          sub="Admit cards are issued only after full fee clearance."
        />
        <div className="border-2 border-blood bg-paper-3 hard p-6 mt-4 text-center">
          <div className="inline-flex items-center gap-2 border-2 border-blood bg-blood text-paper px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em]">
            <Lock className="w-4 h-4" /> Admit Card Not Issued
          </div>
          <p className="mt-4 font-serif italic text-sm text-ink/80 max-w-lg mx-auto">
            Your admit card is currently <span className="text-blood font-semibold">blocked</span> because your
            fees are not fully deposited. Please settle the pending amount and your card will unlock instantly.
          </p>
          <div className="mt-5 border-2 border-ink bg-paper overflow-x-auto max-w-lg mx-auto">
            <table className="w-full text-sm">
              <thead><tr><th className={TH}>Fee Type</th><th className={TH}>Due Date</th><th className={TH}>Amount</th></tr></thead>
              <tbody>
                {pending.map((f) => (
                  <tr key={f.id} className="border-b-2 border-ink/10">
                    <td className={TD}><span className="font-serif text-xs font-semibold">{f.feeType}</span></td>
                    <td className={TD}><span className="font-mono text-[11px]">{f.dueDate}</span></td>
                    <td className={TD}><span className="font-mono text-[11px] text-blood font-bold">₹{fmtIN(feeRemaining(f))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="border-2 border-ink bg-ink text-paper px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em]">
              Total Due · ₹{fmtIN(totalDue)}
            </div>
            <BrutalButton tone="blood" onClick={onGoToFees}><DollarSign className="w-4 h-4" /> Pay Online / View Fees</BrutalButton>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            You can also settle offline at the college office your admit card will be available for download as soon as your fees are cleared.
          </p>
        </div>
    </div>
  );
}

  /* ---- ELIGIBLE: admit card ---- */
  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-4">
      <SectionTitle
        kicker="Examination Cell"
        title="Admit"
        accent="Card"
        sub="Fee clearance verified download and carry your admit card."
        right={
          <div className="flex flex-wrap gap-2">
            <Tag tone="ink">Fees Cleared ✓</Tag>
            <BrutalButton tone="ink" onClick={() => printElement("admit-card")}><Printer className="w-4 h-4" /> Print</BrutalButton>
          </div>
        }
      />
      <div id="admit-card" className="max-w-2xl mx-auto border-2 border-ink hard overflow-hidden">
        <div className="bg-ink text-paper px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vscms-logo.png" alt="College of Management Studies" className="h-12 w-12 rounded-full bg-paper border-2 border-paper object-contain" />
            <div>
              <p className="font-display uppercase text-base leading-none">College of Management Studies</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/70 mt-1">VSCMS · Admit Card · {session}</p>
            </div>
          </div>
          <Stamp>Internal Exams</Stamp>
        </div>
        <div className="bg-paper px-6 py-5 flex flex-col sm:flex-row gap-5">
          <div className="shrink-0">
            <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-20 !w-20 border-2 border-ink" />
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px]">
            <span className="text-muted">Name</span><span className="text-ink font-bold">{u.name}</span>
            <span className="text-muted">Roll No</span><span className="text-ink font-bold">{u.rollNo}</span>
            <span className="text-muted">Programme</span><span className="text-ink font-bold">{u.department}</span>
            <span className="text-muted">Semester</span><span className="text-ink font-bold">{u.semester || 1}</span>
            <span className="text-muted">Session</span><span className="text-ink font-bold">{session}</span>
            <span className="text-muted">Subjects</span><span className="text-ink font-bold">{myCourses.length}</span>
          </div>
        </div>
        <div className="border-t-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Date</th><th className={TH}>Subject</th><th className={TH}>Exam</th><th className={TH}>Time</th><th className={TH}>Room</th></tr></thead>
            <tbody>
              {myExams.map((x) => (
                <tr key={x.id} className="border-b-2 border-ink/10">
                  <td className={TD}><span className="font-mono text-[11px]">{x.examDate}</span></td>
                  <td className={TD}><span className="font-mono text-[10px] text-blood">{x.courseCode}</span><span className="block font-serif text-xs">{x.courseName}</span></td>
                  <td className={TD}><Tag tone="ink">{x.examType}</Tag></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.startTime} {x.endTime}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.room}</span></td>
                </tr>
              ))}
              {myExams.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No exams scheduled yet" hint="The exam cell will post the timetable soon." /></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-ink bg-paper-2 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Exam Types</p>
            <div className="flex gap-1.5 mt-1">{types.map((t) => <Tag key={t} tone="paper">{t}</Tag>)}</div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Controller of Examinations</p>
            <p className="font-display text-lg text-blood mt-1 border-b-2 border-blood inline-block px-4">Prof. (Dr.) Gauri Singh Gaur</p>
          </div>
        </div>
        <div className="hazard h-2" />
      </div>
      <p className="font-mono text-[10px] text-muted text-center">
        Print this card and bring it to every exam entry without admit card is not allowed.
      </p>
    </div>
  );
}

/* ============================================================
   ATTENDANCE · CALENDAR VIEW (monthly grid · green/red cells)
   ============================================================ */
const CAL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Local-timezone date key (YYYY-MM-DD) so the "today" ring is accurate. */
function localDateKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AttendanceCalendar({
  records,
  month,
  onMonthChange,
  scopeNote,
}: {
  records: { date: string; status: string }[];
  month: string; // "YYYY-MM"
  onMonthChange: (m: string) => void;
  scopeNote?: string;
}) {
  const [year, mon] = month.split("-").map(Number);
  const firstDow = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const todayKey = localDateKey();

  const byDay = new Map<string, { present: number; absent: number; late: number }>();
  for (const r of records) {
    if (!r.date || !r.date.startsWith(month)) continue;
    const cur = byDay.get(r.date) || { present: 0, absent: 0, late: 0 };
    if (r.status === "present") cur.present++;
    else if (r.status === "late") cur.late++;
    else cur.absent++;
    byDay.set(r.date, cur);
  }

  const shift = (dir: -1 | 1) => {
    const d = new Date(year, mon - 1 + dir, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const presentCount = Array.from(byDay.values()).reduce((a, s) => a + s.present, 0);
  const absentCount = Array.from(byDay.values()).reduce((a, s) => a + s.absent, 0);
  const lateCount = Array.from(byDay.values()).reduce((a, s) => a + s.late, 0);

  return (
    <div className="border-2 border-ink bg-paper hard overflow-hidden">
      {/* header */}
      <div className="px-3 py-2 border-b-2 border-ink bg-ink text-paper flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="border-2 border-paper/40 p-1 hover:border-blood hover:text-blood press"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">
            {CAL_MONTHS[mon - 1]} {year}
          </span>
          <button
            onClick={() => shift(1)}
            className="border-2 border-paper/40 p-1 hover:border-blood hover:text-blood press"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="font-mono text-[10px] text-paper/60 hidden sm:block">
          <CalendarDays className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
          {presentCount} P · {absentCount} A · {lateCount} L
        </span>
      </div>

      {/* weekday row */}
      <div className="grid grid-cols-7 border-b-2 border-ink bg-paper-2">
        {CAL_DAYS.map((d) => (
          <div
            key={d}
            className="px-1 py-1 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-muted border-r-2 border-ink/10 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} className="h-8 border-r-2 border-b-2 border-ink/10 last:border-r-0 bg-paper-3/40" />;
          const key = `${month}-${String(day).padStart(2, "0")}`;
          const isToday = key === todayKey;
          const s = byDay.get(key);
          return (
            <div
              key={key}
              className={`h-8 border-r-2 border-b-2 border-ink/15 last:border-r-0 flex flex-col items-center justify-center gap-px ${
                isToday ? "bg-blue-100 ring-2 ring-inset ring-ink/70" : "bg-paper"
              }`}
              title={s ? `${key} P${s.present} A${s.absent} L${s.late}` : key}
            >
              <span className={`font-mono text-[11px] font-bold leading-none ${s ? "text-ink" : "text-muted"}`}>{day}</span>
              {s ? (
                <span className="flex items-center gap-0.5 leading-none">
                  {s.present > 0 && <span className="text-[8px] font-bold leading-none text-emerald-600">P</span>}
                  {s.late > 0 && <span className="text-[8px] font-bold leading-none text-amber-600">L</span>}
                  {s.absent > 0 && <span className="text-[8px] font-bold leading-none text-red-600">A</span>}
                </span>
              ) : (
                <span className="text-[8px] leading-none text-ink/15"></span>
              )}
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div className="px-3 py-2 border-t-2 border-ink bg-paper-2 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-emerald-500 border border-ink inline-block" /> Present (P)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500 border border-ink inline-block" /> Absent (A)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-amber-400 border border-ink inline-block" /> Late (L)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-paper border border-ink inline-block" /> No class</span>
        <span className="ml-auto text-ink/70">{presentCount + absentCount + lateCount} entries · hover any day for details</span>
      </div>
      {scopeNote && (
        <p className="px-3 py-1.5 border-t border-ink/15 bg-paper-3 font-serif italic text-[11px] text-muted">
          {scopeNote}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   FACULTY · MY ATTENDANCE (own register marked by admin office)
   ============================================================ */
export function FacultyMyAttendanceTab({
  records,
  currentUser,
}: {
  records: FacultyAttendance[];
  currentUser: User | null;
}) {
  const [month, setMonth] = useState("all");
  const mine = records.filter(
    (r) => r.facultyId === currentUser?.id || r.facultyName === currentUser?.name,
  );
  const total = mine.length;
  const present = mine.filter((r) => r.status === "present").length;
  const pct = total ? Math.round((present / total) * 100) : 0;
  const months = Array.from(new Set(mine.map((r) => r.date.slice(0, 7)))).sort().reverse();
  const filtered = month === "all" ? mine : mine.filter((r) => r.date.slice(0, 7) === month);

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        kicker="Staff Register"
        title="My"
        accent="Attendance"
        sub="Daily attendance marked by the Director's office."
        right={
          <Field label="Month">
            <select className={INPUT + " !w-36"} value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Present</p><p className="font-display text-2xl">{present}</p></div>
        <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Absent</p><p className="font-display text-2xl text-blood">{total - present}</p></div>
        <div className="border-2 border-ink p-3 bg-paper-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Rate</p><p className="font-display text-2xl">{pct}%</p></div>
      </div>
      <Meter value={pct} />

      {/* Calendar view month grid with green/red cells */}
      <AttendanceCalendar
        records={mine}
        month={month === "all" ? (months[0] || new Date().toISOString().slice(0, 7)) : month}
        onMonthChange={(m) => setMonth(m)}
        scopeNote={month === "all" ? "Showing the latest month with records pick a month above or use the arrows to explore." : undefined}
      />

      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>Date</th><th className={TH}>Status</th><th className={TH}>Marked By</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b-2 border-ink/10 hover:bg-paper-2">
                <td className={TD}><span className="font-mono text-[11px]">{r.date}</span></td>
                <td className={TD}><Tag tone={r.status === "present" ? "ink" : "blood"}>{r.status}</Tag></td>
                <td className={`${TD} font-serif italic text-xs text-muted`}>{r.markedBy || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={3}><div className="p-4"><EmptyState label="No attendance records yet" hint="The Director's office marks staff attendance daily." /></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN · ATTENDANCE CONTROL (reports · alerts · faculty register)
   ============================================================ */
export function AdminAttendanceTab({
  attendance,
  students,
  facultyList,
  facultyRecords,
  onMarkFaculty,
}: {
  attendance: AttendanceRecord[];
  students: User[];
  facultyList: User[];
  facultyRecords: FacultyAttendance[];
  onMarkFaculty: (rows: Partial<FacultyAttendance>[]) => void;
}) {
  const [month, setMonth] = useState("all");
  const months = Array.from(new Set(attendance.map((a) => a.date.slice(0, 7)))).sort().reverse();
  const rows = month === "all" ? attendance : attendance.filter((a) => a.date.slice(0, 7) === month);

  const total = rows.length;
  const present = rows.filter((a) => a.status === "present").length;
  const absent = rows.filter((a) => a.status === "absent").length;
  const late = rows.filter((a) => a.status === "late").length;
  const overall = total ? Math.round((present / total) * 100) : 0;

  const courseRows = Array.from(new Set(rows.map((a) => a.courseCode))).map((code) => {
    const recs = rows.filter((a) => a.courseCode === code);
    const pr = recs.filter((a) => a.status === "present").length;
    return { code, total: recs.length, present: pr, pct: recs.length ? Math.round((pr / recs.length) * 100) : 0 };
  });

  const lowAttendance = students
    .map((s) => {
      const recs = attendance.filter((a) => a.studentId === s.id);
      const pr = recs.filter((a) => a.status === "present").length;
      return { s, rate: recs.length ? Math.round((pr / recs.length) * 100) : 100, classes: recs.length };
    })
    .filter((x) => x.rate < 75)
    .sort((a, b) => a.rate - b.rate);

  const exportCSV = () => {
    const csv = [
      ["Course", "Classes", "Present", "Rate %"],
      ...courseRows.map((r) => [r.code, String(r.total), String(r.present), `${r.pct}%`]),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    a.download = `attendance-report-${month === "all" ? "all" : month}.csv`;
    a.click();
  };

  const stats = [
    { label: "Overall Rate", value: `${overall}%`, foot: `${present}/${total} present`, Icon: CheckSquare },
    { label: "Present", value: present, foot: "classes attended", Icon: Users },
    { label: "Absent", value: absent, foot: "classes missed", Icon: AlertTriangle },
    { label: "Late", value: late, foot: "late arrivals", Icon: Clock },
  ];

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
      <SectionTitle
        index="15"
        kicker="Attendance Control"
        title="Attendance"
        accent="Command"
        sub="Subject-wise rates, at-risk scholars and the staff register."
        right={
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Month">
              <select className={INPUT + " !w-36"} value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="all">All months</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <BrutalButton tone="ink" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</BrutalButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="lift border-2 border-ink bg-paper hard p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{s.label}</span>
              <s.Icon className="w-4 h-4 text-blood" />
            </div>
            <p className="font-display text-3xl leading-none mt-3 text-ink">{s.value}</p>
            <p className="mt-2 font-serif italic text-xs text-muted">{s.foot}</p>
          </div>
        ))}
      </div>

      {/* Calendar view institution-wide daily pattern */}
      <AttendanceCalendar
        records={attendance}
        month={month === "all" ? (months[0] || new Date().toISOString().slice(0, 7)) : month}
        onMonthChange={(m) => setMonth(m)}
        scopeNote={month === "all" ? "Showing the latest month with records pick a month above or use the arrows to explore." : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border-2 border-ink overflow-x-auto">
          <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Subject-wise Attendance</span>
            <Tag tone="ink">{courseRows.length} subjects</Tag>
          </div>
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Course</th><th className={TH}>Classes</th><th className={TH}>Present</th><th className={TH}>Rate</th><th className={TH}>Status</th></tr></thead>
            <tbody>
              {courseRows.map((r) => (
                <tr key={r.code} className="border-b-2 border-ink/10">
                  <td className={TD}><span className="font-mono text-[11px] text-blood font-bold">{r.code}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{r.total}</span></td>
                  <td className={TD}><span className="font-mono text-[11px]">{r.present}</span></td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 border border-ink"><div className={`h-full ${r.pct >= 75 ? "hazard" : "bg-blood"}`} style={{ width: `${Math.min(100, r.pct)}%` }} /></div>
                      <span className="font-mono text-[11px]">{r.pct}%</span>
                    </div>
                  </td>
                  <td className={TD}><Tag tone={r.pct >= 75 ? "ink" : "blood"}>{r.pct >= 75 ? "OK" : "Low"}</Tag></td>
                </tr>
              ))}
              {courseRows.length === 0 && <tr><td colSpan={5}><div className="p-4"><EmptyState label="No attendance marked yet" /></div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="border-2 border-blood overflow-x-auto">
          <div className="px-3 py-2 border-b-2 border-blood bg-paper-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Low-Attendance Alerts</span>
            <Stamp>Below 75%</Stamp>
          </div>
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Scholar</th><th className={TH}>Classes</th><th className={TH}>Rate</th><th className={TH}>Status</th></tr></thead>
            <tbody>
              {lowAttendance.map((x) => (
                <tr key={x.s.id} className="border-b-2 border-ink/10">
                  <td className={TD}>
                    <p className="font-serif text-xs font-semibold">{x.s.name}</p>
                    <p className="font-mono text-[10px] text-muted">{x.s.rollNo} · {x.s.department}</p>
                  </td>
                  <td className={TD}><span className="font-mono text-[11px]">{x.classes}</span></td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 border border-ink"><div className="h-full bg-blood" style={{ width: `${Math.min(100, x.rate)}%` }} /></div>
                      <span className="font-mono text-[11px] font-bold text-blood">{x.rate}%</span>
                    </div>
                  </td>
                  <td className={TD}><Tag tone="blood">At Risk</Tag></td>
                </tr>
              ))}
              {lowAttendance.length === 0 && <tr><td colSpan={4}><div className="p-4"><EmptyState label="No at-risk scholars" hint="Every scholar is above the 75% threshold." /></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* FACULTY REGISTER */}
      <div className="border-2 border-ink space-y-4">
        <div className="px-4 py-3 border-b-2 border-ink bg-ink text-paper flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">Faculty Attendance Register</span>
          <Tag tone="paper">{facultyRecords.length} records</Tag>
        </div>
        <div className="p-4 space-y-4">
          <FacultyRegisterSheet
            facultyList={facultyList}
            facultyRecords={facultyRecords}
            onSave={onMarkFaculty}
          />
          <div className="border-2 border-ink overflow-x-auto">
            <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Recent Entries</span>
              <Tag tone="ink">{facultyRecords.length}</Tag>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10"><tr><th className={TH}>Faculty</th><th className={TH}>Date</th><th className={TH}>Status</th><th className={TH}>Marked By</th></tr></thead>
                <tbody>
                  {facultyRecords.map((r) => (
                    <tr key={r.id} className="border-b-2 border-ink/10">
                      <td className={TD}><span className="font-serif text-xs font-semibold">{r.facultyName}</span></td>
                      <td className={TD}><span className="font-mono text-[11px]">{r.date}</span></td>
                      <td className={TD}><Tag tone={r.status === "present" ? "ink" : "blood"}>{r.status}</Tag></td>
                      <td className={`${TD} font-serif italic text-xs text-muted`}>{r.markedBy || "-"}</td>
                    </tr>
                  ))}
                  {facultyRecords.length === 0 && <tr><td colSpan={4}><div className="p-4"><EmptyState label="No staff entries yet" hint="Mark today's attendance above." /></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacultyRegisterSheet({
  facultyList,
  facultyRecords,
  onSave,
}: {
  facultyList: User[];
  facultyRecords: FacultyAttendance[];
  onSave: (rows: Partial<FacultyAttendance>[]) => void;
}) {
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [sheet, setSheet] = useState<Record<number, "present" | "absent">>(() => {
    const map: Record<number, "present" | "absent"> = {};
    facultyList.forEach((f) => {
      const prev = facultyRecords.find((r) => r.facultyId === f.id && r.date === new Date().toISOString().slice(0, 10));
      map[f.id] = prev?.status === "absent" ? "absent" : "present";
    });
    return map;
  });
  const [touched, setTouched] = useState<Record<number, boolean>>({});

  const changeDate = (v: string) => {
    setFDate(v);
    const map: Record<number, "present" | "absent"> = {};
    facultyList.forEach((f) => {
      const prev = facultyRecords.find((r) => r.facultyId === f.id && r.date === v);
      map[f.id] = prev?.status === "absent" ? "absent" : "present";
    });
    setSheet(map);
    setTouched({});
  };

  const set = (id: number, s: "present" | "absent") => {
    setSheet((p) => ({ ...p, [id]: s }));
    setTouched((p) => ({ ...p, [id]: true }));
  };
  const markAll = (s: "present" | "absent") => {
    const n: Record<number, "present" | "absent"> = {};
    const t: Record<number, boolean> = {};
    facultyList.forEach((f) => {
      n[f.id] = s;
      t[f.id] = true;
    });
    setSheet(n);
    setTouched(t);
  };
  const save = () => {
    const rows = facultyList
      .filter((f) => touched[f.id])
      .map((f) => ({
        facultyId: f.id,
        facultyName: f.name,
        date: fDate,
        status: sheet[f.id] || "present",
      }));
    if (rows.length === 0) {
      alert("Toggle at least one faculty member before saving.");
      return;
    }
    onSave(rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Date"><input type="date" className={INPUT} value={fDate} onChange={(e) => changeDate(e.target.value)} /></Field>
        <BrutalButton tone="ghost" onClick={() => markAll("present")}>All Present</BrutalButton>
        <BrutalButton tone="blood" onClick={save}><CheckSquare className="w-4 h-4" /> Save Register</BrutalButton>
      </div>
      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>Faculty</th><th className={TH}>Department</th><th className={TH + " text-center"}>Status</th></tr></thead>
          <tbody>
            {facultyList.map((f) => (
              <tr key={f.id} className="border-b-2 border-ink/10">
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <SquareAvatar src={f.avatarUrl} initial={f.name.charAt(0)} className="!h-8 !w-8" />
                    <span className="font-serif text-xs font-semibold">{f.name}</span>
                  </div>
                </td>
                <td className={TD}><span className="font-mono text-[11px] text-muted">{f.department}</span></td>
                <td className={TD + " text-center"}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => set(f.id, "present")}
                      className={`border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase press ${sheet[f.id] === "present" ? "bg-ink text-paper border-ink" : "border-ink bg-paper text-muted hover:bg-ink hover:text-paper"}`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => set(f.id, "absent")}
                      className={`border-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase press ${sheet[f.id] === "absent" ? "bg-blood text-paper border-blood" : "border-ink bg-paper text-muted hover:bg-blood hover:text-paper"}`}
                    >
                      A
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {facultyList.length === 0 && <tr><td colSpan={3}><div className="p-4"><EmptyState label="No faculty on record" /></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   FACULTY · FEE COLLECTION
   Faculty collect fees only from students enrolled in their own
   courses. Every payment is stamped server-side with the session
   user (collectedBy) so collections are attributable to a person.
   ============================================================ */
export function FacultyFeesTab({
  currentUser,
  students,
  courses,
  enrollments,
  feeRecords,
  feePayments,
  onPayFee,
}: {
  currentUser: User | null;
  students: User[];
  courses: Course[];
  enrollments: Enrollment[];
  feeRecords: FeeRecord[];
  feePayments: FeePayment[];
  onPayFee: (id: number, amount?: number, method?: string) => void;
}) {
  const ownedCourses = courses.filter(
    (c) => c.facultyId === currentUser?.id || c.facultyName === currentUser?.name,
  );
  const ownedCourseIds = new Set(ownedCourses.map((c) => c.id));
  const scopeStudentIds = new Set(
    enrollments.filter((e) => ownedCourseIds.has(e.courseId)).map((e) => e.studentId),
  );
  const scopeFees = feeRecords.filter((f) => scopeStudentIds.has(f.studentId));

  const [feeQ, setFeeQ] = useState("");
  const [payRecord, setPayRecord] = useState<FeeRecord | null>(null);
  const [receipt, setReceipt] = useState<FeeRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<FeeRecord | null>(null);

  const filtered = scopeFees.filter((f) => {
    const q = feeQ.trim().toLowerCase();
    if (!q) return true;
    return (
      f.studentName.toLowerCase().includes(q) ||
      f.rollNo.toLowerCase().includes(q) ||
      String(f.courseCode || "").toLowerCase().includes(q) ||
      f.feeType.toLowerCase().includes(q)
    );
  });

  const total = scopeFees.reduce((a, f) => a + Number(f.amount || 0), 0);
  const collected = scopeFees.reduce((a, f) => a + Number(f.paidAmount || 0), 0);
  const remaining = Math.max(0, total - collected);
  const dueCount = scopeFees.filter((f) => feeEffectiveStatus(f) !== "paid").length;
  const myPayments = feePayments.filter((p) => p.collectedBy === currentUser?.name);
  const myCollected = myPayments.reduce((a, p) => a + Number(p.amount || 0), 0);

  const statCard = (label: string, value: string, foot: string, accent = false) => (
    <div className={`border-2 border-ink hard p-4 ${accent ? "bg-blood text-paper" : "bg-paper"}`}>
      <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${accent ? "text-paper/70" : "text-muted"}`}>{label}</p>
      <p className={`font-display text-2xl mt-1 ${accent ? "text-paper" : "text-ink"}`}>{value}</p>
      <p className={`font-serif text-xs mt-0.5 ${accent ? "text-paper/70" : "text-muted"}`}>{foot}</p>
    </div>
  );

  const canAlter = canAlterStudentRecords(currentUser);

  return (
    <div className="space-y-4">
      <SectionTitle
        index="12"
        kicker="Fees · Collection"
        title="Student"
        accent="Fees"
        sub="View fee records and collection status."
        right={
          <div className="flex items-center gap-2">
            <Tag tone="ink">{scopeFees.length} invoices</Tag>
            <Tag tone="blood">{dueCount} due</Tag>
          </div>
        }
      />

      {!canAlter && (
        <div className="border-2 border-amber-800 bg-amber-50 p-3 font-mono text-xs text-amber-950 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Teacher Read-Only View:</strong> Collecting fees or recording student payments is restricted to <strong>Bursar</strong>, <strong>Dean</strong>, <strong>HOD</strong>, or <strong>Class Coordinator</strong> authorization.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCard("Total Invoices", `₹${fmtIN(total)}`, `${scopeFees.length} invoices in scope`)}
        {statCard("Collected", `₹${fmtIN(collected)}`, "By students, you & admin")}
        {statCard("Outstanding", `₹${fmtIN(remaining)}`, `${dueCount} not yet clear`, remaining > 0)}
        {statCard("Your Collections", `₹${fmtIN(myCollected)}`, `${myPayments.length} payments recorded by you`)}
      </div>

      <div className="border-2 border-ink bg-paper hard">
        <div className="px-3 py-2 border-b-2 border-ink bg-paper-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
            Fee Invoices · My Courses
          </span>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              className={INPUT + " pl-9"}
              placeholder="search by student, roll, course or fee type..."
              value={feeQ}
              onChange={(e) => setFeeQ(e.target.value)}
            />
          </div>
        </div>

        {ownedCourses.length === 0 ? (
          <div className="p-4"><EmptyState label="No courses assigned to you" hint="Fees can only be collected from students in your assigned courses." /></div>
        ) : scopeFees.length === 0 ? (
          <div className="p-4"><EmptyState label="No fee invoices yet" hint="Fee invoices are generated by the Bursar from the fee structure." /></div>
        ) : filtered.length === 0 ? (
          <div className="p-4"><EmptyState label="No fee records match" hint="Try a different search." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className={TH}>Scholar</th>
                  <th className={TH}>Course</th>
                  <th className={TH}>Fee Type</th>
                  <th className={TH}>Due Date</th>
                  <th className={TH + " text-right"}>Payable</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Collected By</th>
                  <th className={TH + " text-right"}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const eff = feeEffectiveStatus(f);
                  const rem = feeRemaining(f);
                  return (
                    <tr key={f.id} className="border-b-2 border-ink/10 group hover:bg-paper-2">
                      <td className={TD}>
                        <span className="font-serif font-semibold text-ink group-hover:text-blood">{f.studentName}</span>
                        <span className="block font-mono text-[10px] text-blood">{f.rollNo}</span>
                      </td>
                      <td className={`${TD} font-mono text-[11px]`}>{f.courseCode || "-"}</td>
                      <td className={`${TD} text-muted`}>{f.feeType}</td>
                      <td className={`${TD} font-mono text-[11px] text-muted`}>{f.dueDate}</td>
                      <td className={`${TD} text-right font-mono`}>
                        <span className="font-bold text-ink">{eff === "paid" ? "₹0.00" : `₹${rem.toFixed(2)}`}</span>
                        <span className="block text-[10px] text-muted">of ₹{Number(f.amount).toFixed(2)} · paid ₹{Number(f.paidAmount || 0).toFixed(2)}</span>
                      </td>
                      <td className={TD}>
                        <Tag tone={eff === "paid" ? "ink" : eff === "overdue" ? "blood" : "ink"}>{eff}</Tag>
                      </td>
                      <td className={`${TD} font-serif text-xs`}>{f.collectedBy || "-"}</td>
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canAlter && eff !== "paid" && (
                            <button
                              onClick={() => setPayRecord(f)}
                              className="border-2 border-ink bg-blood text-paper px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] press hard-sm"
                            >
                              Collect ₹{rem.toFixed(2)}
                            </button>
                          )}
                          <button
                            onClick={() => setReceipt(f)}
                            className="border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-paper press"
                          >
                            Receipt
                          </button>
                          <button
                            onClick={() => setHistoryRecord(f)}
                            className="border-2 border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-paper press"
                          >
                            History
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
      </div>

      <FeePayModal
        record={payRecord}
        onClose={() => setPayRecord(null)}
        onPay={(amount, method) => {
          if (payRecord) onPayFee(payRecord.id, amount, method);
          setPayRecord(null);
        }}
      />
      <FeeReceiptModal isOpen={!!receipt} onClose={() => setReceipt(null)} record={receipt} />
      <FeeHistoryModal
        isOpen={!!historyRecord}
        payments={feePayments.filter((p) => p.feeRecordId === historyRecord?.id)}
        onClose={() => setHistoryRecord(null)}
        title={historyRecord ? `${historyRecord.studentName} · ${historyRecord.feeType}` : "Payment History"}
      />
    </div>
  );
}

/* ============================================================
   DIGITAL COURSE MATERIALS TAB (Faculty & Student)
   ============================================================ */
export function DigitalCourseMaterialsTab({
  courses,
  materials,
  currentUser,
  enrollments = [],
  onUploadMaterial,
  onDeleteMaterial,
  onIncrementDownload,
}: {
  courses: Course[];
  materials: CourseMaterial[];
  currentUser: User | null;
  enrollments?: Enrollment[];
  onUploadMaterial: (m: Partial<CourseMaterial>) => void;
  onDeleteMaterial: (id: number) => void;
  onIncrementDownload: (id: number) => void;
}) {
  const isFaculty = currentUser?.role === "faculty";
  const isAdmin = currentUser?.role === "admin";
  const canUpload = isFaculty || isAdmin;

  // Filter courses based on user role
  const relevantCourses = useMemo(() => {
    if (isFaculty) {
      const owned = courses.filter(
        (c) => c.facultyId === currentUser?.id || c.facultyName === currentUser?.name
      );
      return owned.length > 0 ? owned : courses;
    }
    if (currentUser?.role === "student") {
      const myEnrolledCourseIds = new Set(
        enrollments.filter((e) => e.studentId === currentUser.id).map((e) => e.courseId)
      );
      const enrolled = courses.filter((c) => myEnrolledCourseIds.has(c.id));
      return enrolled.length > 0 ? enrolled : courses;
    }
    return courses;
  }, [courses, enrollments, currentUser, isFaculty]);

  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<CourseMaterial | null>(null);

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sourceMode, setSourceMode] = useState<"file" | "link">("file");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [uploadCourseId, setUploadCourseId] = useState<number>(relevantCourses[0]?.id || 0);
  const [uploadModule, setUploadModule] = useState("Module 1: Fundamentals & Syntax");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadType, setUploadType] = useState<"PDF" | "PPT" | "Video" | "Notes">("PDF");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadSize, setUploadSize] = useState("2.4 MB");

  // Get all unique modules for the selected course
  const availableModules = useMemo(() => {
    const relevant = materials.filter((m) =>
      selectedCourseId === "all" ? true : m.courseId === Number(selectedCourseId)
    );
    return Array.from(new Set(relevant.map((m) => m.moduleName).filter(Boolean)));
  }, [materials, selectedCourseId]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedCourseId !== "all" && m.courseId !== Number(selectedCourseId)) return false;
      if (selectedModule !== "all" && m.moduleName !== selectedModule) return false;
      if (selectedType !== "all" && m.type.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (searchQ.trim()) {
        const q = searchQ.trim().toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.description || "").toLowerCase().includes(q) ||
          m.moduleName.toLowerCase().includes(q) ||
          m.facultyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [materials, selectedCourseId, selectedModule, selectedType, searchQ]);

  const handleDownload = (material: CourseMaterial) => {
    onIncrementDownload(material.id);
    const link = document.createElement("a");
    link.href = material.fileUrl;
    link.target = "_blank";
    link.download = `${material.title}.${material.type.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadModule) return;
    const selectedC = courses.find((c) => c.id === Number(uploadCourseId)) || courses[0];
    onUploadMaterial({
      courseId: selectedC?.id || 1,
      courseCode: selectedC?.code || "CSE101",
      courseName: selectedC?.name || "Core Curriculum",
      moduleName: uploadModule,
      title: uploadTitle,
      description: uploadDesc,
      type: uploadType,
      fileUrl: uploadUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: uploadSize || "2.1 MB",
      facultyId: currentUser?.id,
      facultyName: currentUser?.name || "Faculty Member",
      downloadCount: 0,
    });
    setShowUploadModal(false);
    setUploadTitle("");
    setUploadDesc("");
    setUploadUrl("");
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        index="41"
        kicker="Academic Repository"
        title="Digital Course"
        accent="Materials"
        sub="Access course modules, lecture slides, video demonstrations, and study notes."
        right={
          canUpload ? (
            <BrutalButton tone="blood" onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4" /> Upload Material
            </BrutalButton>
          ) : undefined
        }
      />

      {/* Filter Header Toolbar */}
      <div className="border-2 border-ink bg-paper hard p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Select Course">
            <select
              className={INPUT}
              value={selectedCourseId}
              onChange={(e) => {
                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                setSelectedCourseId(val);
                setSelectedModule("all");
              }}
            >
              <option value="all">All Courses ({relevantCourses.length})</option>
              {relevantCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Filter Module">
            <select
              className={INPUT}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="all">All Modules ({availableModules.length})</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Search Resource">
            <input
              className={INPUT}
              placeholder="Search title, topic or notes..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </Field>
        </div>

        {/* Resource Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink/10">
          <span className="font-mono text-[10px] uppercase font-bold text-muted mr-1">Format:</span>
          {["all", "PDF", "PPT", "Video", "Notes"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider font-bold border border-ink transition-all ${
                selectedType.toLowerCase() === t.toLowerCase()
                  ? "bg-ink text-paper hard-sm"
                  : "bg-paper-2 text-ink hover:bg-paper-3"
              }`}
            >
              {t === "all" ? "All Formats" : t}
            </button>
          ))}
          <span className="ml-auto font-mono text-[11px] text-muted">
            Found <strong className="text-ink">{filteredMaterials.length}</strong> resources
          </span>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="border-2 border-ink bg-paper hard p-6">
          <EmptyState
            label="No digital course materials found"
            hint="Try selecting 'All Courses' or clear active filters."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredMaterials.map((m) => {
            const isPdf = m.type.toUpperCase() === "PDF";
            const isPpt = m.type.toUpperCase() === "PPT";
            const isVid = m.type.toUpperCase() === "VIDEO";

            return (
              <div
                key={m.id}
                className="border-2 border-ink bg-paper hard p-3 flex flex-col justify-between space-y-2 transition-all hover:-translate-y-0.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border border-ink rounded ${
                        isPdf
                          ? "bg-rose-100 text-rose-800"
                          : isPpt
                          ? "bg-amber-100 text-amber-800"
                          : isVid
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {m.type}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-muted">{m.courseCode}</span>
                  </div>

                  <span className="inline-block font-mono text-[9px] font-bold text-muted uppercase tracking-wider truncate max-w-full">
                    {m.moduleName}
                  </span>

                  <h4 className="font-serif font-bold text-sm text-ink leading-tight hover:text-blood line-clamp-1">
                    {m.title}
                  </h4>

                  {m.description && (
                    <p className="font-serif text-[11px] text-muted line-clamp-1 leading-tight">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t-2 border-ink/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                    <span className="truncate max-w-[120px]">By: <strong className="text-ink">{m.facultyName}</strong></span>
                    <span className="shrink-0">{m.fileSize}</span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-mono text-[9px] text-muted flex items-center gap-0.5">
                      <Download className="w-3 h-3 text-blood" /> {m.downloadCount}
                    </span>

                    <div className="flex items-center gap-1">
                      <BrutalButton
                        tone="ghost"
                        className="!py-0.5 !px-2 !text-[10px]"
                        onClick={() => setPreviewMaterial(m)}
                      >
                        Preview
                      </BrutalButton>
                      <BrutalButton
                        tone="blood"
                        className="!py-0.5 !px-2 !text-[10px]"
                        onClick={() => handleDownload(m)}
                      >
                        <Download className="w-2.5 h-2.5" /> Get
                      </BrutalButton>
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(m.id)}
                          className="p-0.5 text-muted hover:text-blood transition-colors"
                          title="Delete material"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
              <span className="font-mono text-[11px] uppercase font-bold text-blood tracking-wider">
                Upload Digital Course Resource
              </span>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Target Course">
                  <select
                    className={INPUT + " !py-1 text-xs"}
                    value={uploadCourseId}
                    onChange={(e) => setUploadCourseId(Number(e.target.value))}
                  >
                    {relevantCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Format / Type">
                  <select
                    className={INPUT + " !py-1 text-xs"}
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">PPT Presentation</option>
                    <option value="Video">Video Lecture</option>
                    <option value="Notes">Lecture Notes</option>
                  </select>
                </Field>
              </div>

              <Field label="Module / Chapter Name">
                <input
                  className={INPUT + " !py-1 text-xs"}
                  required
                  placeholder="e.g. Module 1: Python Basics & Syntax"
                  value={uploadModule}
                  onChange={(e) => setUploadModule(e.target.value)}
                />
              </Field>

              <Field label="Resource Title">
                <input
                  className={INPUT + " !py-1 text-xs"}
                  required
                  placeholder="e.g. Lecture Slide Deck & Notes"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </Field>

              <Field label="Source Option">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSourceMode("file")}
                    className={`py-1 px-2 font-mono text-[10px] font-bold uppercase tracking-wider border border-ink transition-all flex items-center justify-center gap-1 ${
                      sourceMode === "file" ? "bg-ink text-paper hard-sm" : "bg-paper-2 text-ink hover:bg-paper-3"
                    }`}
                  >
                    <UploadCloud className="w-3 h-3" /> Device File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode("link")}
                    className={`py-1 px-2 font-mono text-[10px] font-bold uppercase tracking-wider border border-ink transition-all flex items-center justify-center gap-1 ${
                      sourceMode === "link" ? "bg-ink text-paper hard-sm" : "bg-paper-2 text-ink hover:bg-paper-3"
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Web Link
                  </button>
                </div>
              </Field>

              {sourceMode === "file" ? (
                <Field label="File Upload (Device)">
                  <div className="border border-dashed border-ink p-2.5 text-center bg-paper-2 hover:bg-paper-3 transition-colors cursor-pointer relative hard-sm">
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.mp4,.doc,.docx,.txt"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFileName(file.name);
                          if (!uploadTitle) {
                            setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                          }
                          const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                          setUploadSize(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);
                          
                          const ext = file.name.toLowerCase();
                          if (ext.endsWith(".pdf")) setUploadType("PDF");
                          else if (ext.endsWith(".ppt") || ext.endsWith(".pptx")) setUploadType("PPT");
                          else if (ext.endsWith(".mp4") || ext.endsWith(".webm") || ext.endsWith(".mkv")) setUploadType("Video");
                          else setUploadType("Notes");

                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setUploadUrl(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <UploadCloud className="w-5 h-5 text-blood mx-auto mb-1" />
                    {selectedFileName ? (
                      <div>
                        <p className="font-mono text-[11px] font-bold text-ink truncate max-w-[240px] mx-auto">{selectedFileName}</p>
                        <p className="font-mono text-[9px] text-blood font-bold">Attached ({uploadSize})</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-mono text-[11px] font-bold text-ink">Choose PDF, PPT or Video</p>
                        <p className="font-mono text-[9px] text-muted">Click or drag file from device</p>
                      </div>
                    )}
                  </div>
                </Field>
              ) : (
                <Field label="Web Link URL">
                  <input
                    className={INPUT + " !py-1 text-xs"}
                    required
                    placeholder="https://example.com/lecture-notes.pdf"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Description">
                <textarea
                  className={INPUT + " min-h-[48px] !py-1 text-xs"}
                  placeholder="Overview of topics..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-1.5">
                <BrutalButton tone="ghost" className="!py-1 !px-3 !text-xs" type="button" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </BrutalButton>
                <BrutalButton tone="blood" className="!py-1 !px-3 !text-xs" type="submit">
                  <UploadCloud className="w-3.5 h-3.5" /> Publish
                </BrutalButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-2 border-ink bg-paper hard p-5 sm:p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-blood tracking-wider">
                  {previewMaterial.courseCode} · {previewMaterial.moduleName}
                </span>
                <h3 className="font-serif font-bold text-lg text-ink">{previewMaterial.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="p-1 text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {previewMaterial.type.toUpperCase() === "VIDEO" ? (
                <div className="aspect-video bg-ink rounded-lg overflow-hidden border-2 border-ink">
                  <video src={previewMaterial.fileUrl} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="border-2 border-ink bg-paper-2 p-4 rounded-lg space-y-2">
                  <p className="font-mono text-xs uppercase font-bold text-muted">Document Overview</p>
                  <p className="font-serif text-sm text-ink leading-relaxed">
                    {previewMaterial.description || "Digital course reference material provided for student self-study and revision."}
                  </p>
                  <div className="pt-2 flex items-center gap-2 font-mono text-xs text-muted">
                    <span>Uploaded by: <strong className="text-ink">{previewMaterial.facultyName}</strong></span>
                    <span>·</span>
                    <span>Format: <strong className="text-blood">{previewMaterial.type}</strong></span>
                    <span>·</span>
                    <span>Size: <strong>{previewMaterial.fileSize}</strong></span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t-2 border-ink/10">
                <span className="font-mono text-xs text-muted">
                  Total downloads: <strong className="text-ink">{previewMaterial.downloadCount}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <BrutalButton tone="ghost" onClick={() => setPreviewMaterial(null)}>
                    Close Preview
                  </BrutalButton>
                  <BrutalButton tone="blood" onClick={() => handleDownload(previewMaterial)}>
                    <Download className="w-4 h-4" /> Download Resource
                  </BrutalButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FEATURE 38: AUDIT & ACTIVITY LOGS TAB
   ============================================================ */
function AuditStatCard({
  mark,
  label,
  value,
  foot,
  dark,
  accent,
  Icon,
}: {
  mark: string;
  label: string;
  value: string | number;
  foot: string;
  dark?: boolean;
  accent?: boolean;
  Icon: React.ElementType;
}) {
  return (
    <div className={`lift border-2 border-ink hard p-4 space-y-2 ${dark ? "bg-ink text-paper" : accent ? "bg-paper-3 text-ink" : "bg-paper text-ink"}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">[{mark}] {label}</span>
        <Icon className={`w-4 h-4 ${dark ? "text-blood" : "text-ink"}`} />
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="font-mono text-[10px] opacity-60 pt-1 border-t border-current/20">{foot}</div>
    </div>
  );
}

export function AuditLogsTab({
  auditLogs = [],
  onClearLogs,
}: {
  auditLogs: AuditLogRecord[];
  onClearLogs?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const modules = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.module))).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (moduleFilter !== "all" && log.module !== moduleFilter) return false;
      if (severityFilter !== "all" && log.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          log.user.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.record.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q) ||
          log.ipAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, moduleFilter, severityFilter, searchQuery]);

  const criticalCount = useMemo(
    () => auditLogs.filter((l) => l.severity === "critical").length,
    [auditLogs]
  );
  const warningCount = useMemo(
    () => auditLogs.filter((l) => l.severity === "warning").length,
    [auditLogs]
  );
  const adminUsersCount = useMemo(
    () => new Set(auditLogs.map((l) => l.user)).size,
    [auditLogs]
  );

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "ID",
      "Timestamp",
      "User",
      "Role",
      "Action",
      "Module",
      "Target Record",
      "Old Value",
      "New Value",
      "IP/Device",
      "Severity",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredLogs.map((l) =>
        [
          l.id,
          `"${l.timestamp}"`,
          `"${l.user}"`,
          `"${l.userRole}"`,
          `"${l.action}"`,
          `"${l.module}"`,
          `"${l.record}"`,
          `"${l.oldValue}"`,
          `"${l.newValue}"`,
          `"${l.ipAddress}"`,
          `"${l.severity || "info"}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `VSCMS_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-6">
      <SectionTitle
        index="38"
        kicker="Security & Governance"
        title="Audit & Activity"
        accent="Logs"
        sub="Complete immutable audit trail of system modifications, attendance updates, grade entries & administrative actions."
        right={
          <div className="flex flex-wrap gap-2">
            <BrutalButton tone="ghost" onClick={handleExportCsv} disabled={filteredLogs.length === 0}>
              <Download className="w-4 h-4" /> Export CSV
            </BrutalButton>
            {onClearLogs && (
              <BrutalButton tone="blood" onClick={onClearLogs}>
                <Trash2 className="w-4 h-4" /> Clear Logs
              </BrutalButton>
            )}
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AuditStatCard mark="01" label="Total Events" value={auditLogs.length} foot="All time events" Icon={FileText} />
        <AuditStatCard mark="02" label="Critical Events" value={criticalCount} foot={`${warningCount} warnings logged`} dark accent Icon={AlertTriangle} />
        <AuditStatCard mark="03" label="Active Actors" value={adminUsersCount} foot="Unique log origins" Icon={Users} />
        <AuditStatCard mark="04" label="Modules Tracked" value={modules.length} foot="System components" Icon={Shield} />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="border-2 border-ink bg-paper hard p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Search Logs">
          <div className="relative">
            <input
              type="text"
              className={INPUT + " pl-8"}
              placeholder="Search user, action, record, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted" />
          </div>
        </Field>

        <Field label="Filter by Module">
          <select className={INPUT} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="all">All Modules ({auditLogs.length})</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m} ({auditLogs.filter((l) => l.module === m).length})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Filter Severity">
          <select className={INPUT} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="info">Info / Standard ({auditLogs.filter((l) => l.severity === "info" || !l.severity).length})</option>
            <option value="warning">Warning / Billing ({warningCount})</option>
            <option value="critical">Critical / System ({criticalCount})</option>
          </select>
        </Field>
      </div>

      {/* Audit Log Data Stream Table */}
      <div className="border-2 border-ink bg-paper hard overflow-x-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState label="No audit logs matched your query" hint="Try adjusting your search query or module filter." />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink text-paper font-mono text-xs uppercase tracking-wider">
                <th className="p-3 border-r border-paper/20">Timestamp & ID</th>
                <th className="p-3 border-r border-paper/20">User & Role</th>
                <th className="p-3 border-r border-paper/20">Action & Module</th>
                <th className="p-3 border-r border-paper/20">Targeted Record</th>
                <th className="p-3 border-r border-paper/20">Audit Delta (Old → New)</th>
                <th className="p-3">Device & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/10 font-mono text-xs">
              {filteredLogs.map((log) => {
                const isCritical = log.severity === "critical";
                const isWarning = log.severity === "warning";

                return (
                  <tr key={log.id} className="hover:bg-paper-2 transition-colors">
                    <td className="p-3 text-muted">
                      <span className="font-bold text-ink block">{log.timestamp}</span>
                      <span className="text-[10px] text-muted">ID: #{log.id}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-serif font-bold text-ink block">{log.user}</span>
                      <span className={`inline-block font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 border border-ink mt-0.5 ${
                        log.userRole === "admin"
                          ? "bg-blood text-paper"
                          : log.userRole === "faculty"
                          ? "bg-ink text-paper"
                          : "bg-paper-3 text-ink"
                      }`}>
                        {log.userRole}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-ink block">{log.action}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blood">
                        {isCritical ? (
                          <AlertTriangle className="w-3 h-3 text-rose-700" />
                        ) : isWarning ? (
                          <Clock className="w-3 h-3 text-amber-700" />
                        ) : (
                          <Shield className="w-3 h-3 text-emerald-700" />
                        )}
                        {log.module}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-xs text-ink font-bold block">{log.record}</span>
                    </td>

                    <td className="p-3">
                      <div className="bg-paper-2 border border-ink p-2 hard-sm space-y-1 max-w-xs">
                        <div className="text-[10px] text-rose-800 line-through font-mono">
                          <span className="font-bold text-muted">OLD:</span> {log.oldValue || "(None)"}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-extrabold font-mono flex items-center gap-1">
                          <span className="text-muted font-bold">NEW:</span> {log.newValue}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-muted text-[10px]">
                      <span className="font-mono block text-ink">{log.ipAddress}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-2 border-ink bg-paper-2 p-3 flex items-center justify-between font-mono text-xs text-muted">
        <span>Showing {filteredLogs.length} of {auditLogs.length} recorded audit events</span>
        <span>VSCMS Security Compliance Standard v2.4</span>
      </div>
    </div>
  );
}

/* ============================================================
   VERIFIED EVENT ATTENDANCE SYSTEM
   ============================================================ */
export function VerifiedEventAttendanceTab({
  events = [],
  registrations = [],
  students = [],
  currentUser,
  onAddEvent,
  onUpdateCoordinators,
  onSubmitScanRequest,
  onApproveAttendance,
  onRejectAttendance,
  onRegisterStudent,
}: {
  events: CampusEvent[];
  registrations: EventRegistration[];
  students: User[];
  currentUser: User | null;
  onAddEvent?: (e: Partial<CampusEvent>) => void;
  onUpdateCoordinators?: (eventId: number, coordinators: string[]) => void;
  onSubmitScanRequest?: (eventId: number, studentRollNo: string, qrRound: string) => void;
  onApproveAttendance?: (regId: number, verifierName: string) => void;
  onRejectAttendance?: (regId: number) => void;
  onRegisterStudent?: (eventId: number, studentId: number) => void;
}) {
  const [selectedEventId, setSelectedEventId] = useState<number>(events[0]?.id || 1);
  const [durationMinutes, setDurationMinutes] = useState<number>(3);
  const [qrRoundCount, setQrRoundCount] = useState<number>(1);
  const [activeQrWindow, setActiveQrWindow] = useState<EventQrWindow | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || events[0],
    [events, selectedEventId]
  );

  const eventRegistrations = useMemo(
    () => registrations.filter((r) => r.eventId === (activeEvent?.id || 1)),
    [registrations, activeEvent]
  );

  // Check if current user is an Assigned Coordinator or Faculty/Admin
  const isCoordinator = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === "admin" || currentUser.role === "faculty") return true;
    if (!activeEvent) return false;
    const coordList = activeEvent.coordinators || [];
    return (
      coordList.includes(currentUser.rollNo) ||
      coordList.includes(currentUser.name) ||
      coordList.includes(String(currentUser.id))
    );
  }, [currentUser, activeEvent]);

  // Check current student's registration status
  const currentStudentReg = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return null;
    return eventRegistrations.find(
      (r) => r.studentId === currentUser.id || r.rollNo === currentUser.rollNo
    );
  }, [currentUser, eventRegistrations]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!activeQrWindow || !activeQrWindow.isActive) return;

    const interval = setInterval(() => {
      const expires = new Date(activeQrWindow.expiresAt).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeLeftSeconds(remaining);

      if (remaining <= 0) {
        setActiveQrWindow((prev) => (prev ? { ...prev, isActive: false } : null));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQrWindow]);

  // Handler: Coordinator Starts New QR Window (QR-01, QR-02, etc.)
  const handleStartQrWindow = () => {
    if (!activeEvent) return;
    const roundStr = `QR-${String(qrRoundCount).padStart(2, "0")}`;
    const now = new Date();
    const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const newWindow: EventQrWindow = {
      id: roundStr,
      eventId: activeEvent.id,
      roundNumber: qrRoundCount,
      durationMinutes,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isActive: true,
      createdBy: currentUser?.name || "Event Coordinator",
      payload: `https://vscms.edu/event-verify?evt=${activeEvent.id}&round=${roundStr}&exp=${expires.getTime()}`,
    };

    setActiveQrWindow(newWindow);
    setTimeLeftSeconds(durationMinutes * 60);
    setQrRoundCount((prev) => prev + 1);
  };

  // Handler: Student Scans & Submits Attendance Request
  const handleStudentScan = () => {
    if (!activeEvent || !currentUser) return;
    if (!activeQrWindow || !activeQrWindow.isActive || timeLeftSeconds <= 0) {
      alert("This Attendance QR Window has expired! Please request your Event Coordinator to generate the Next Round QR Code.");
      return;
    }

    if (onSubmitScanRequest) {
      onSubmitScanRequest(activeEvent.id, currentUser.rollNo, activeQrWindow.id);
    }
  };

  // New Event Form State
  const [evtTitle, setEvtTitle] = useState("");
  const [evtCode, setEvtCode] = useState("");
  const [evtDate, setEvtDate] = useState("2026-08-25");
  const [evtTime, setEvtTime] = useState("10:00 AM - 04:00 PM");
  const [evtVenue, setEvtVenue] = useState("Main Auditorium · Block A");
  const [evtDept, setEvtDept] = useState("Computer Applications & Management");
  const [selectedCoordRolls, setSelectedCoordRolls] = useState<string[]>(["101"]);

  const handleCreateEventSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!evtTitle || !evtCode) return;
    if (onAddEvent) {
      onAddEvent({
        title: evtTitle,
        code: evtCode,
        date: evtDate,
        time: evtTime,
        venue: evtVenue,
        department: evtDept,
        createdBy: currentUser?.name || "Dr. Tanya Mishra",
        coordinators: selectedCoordRolls,
        description: "Official Campus Event with Verified QR Attendance.",
      });
    }
    setShowCreateModal(false);
    setEvtTitle("");
    setEvtCode("");
  };

  // Export Verified Attendance CSV
  const handleExportCsv = () => {
    if (eventRegistrations.length === 0) return;
    const headers = ["Roll No", "Student Name", "Course Area", "Registration Date", "Attendance Status", "QR Round", "Verified By", "Timestamp"];
    const csvRows = [
      headers.join(","),
      ...eventRegistrations.map((r) =>
        [
          r.rollNo,
          `"${r.studentName}"`,
          `"${r.department}"`,
          `"${r.registeredAt}"`,
          `"${r.attendanceStatus}"`,
          `"${r.qrRound || "-"}"`,
          `"${r.verifiedBy || "-"}"`,
          `"${r.verifiedAt || "-"}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeEvent?.code || "EVENT"}_Attendance_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = useMemo(() => {
    return eventRegistrations.filter((r) => {
      if (statusFilter !== "all" && r.attendanceStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return r.studentName.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [eventRegistrations, statusFilter, searchQuery]);

  const pendingQueue = useMemo(
    () => eventRegistrations.filter((r) => r.attendanceStatus === "pending_verification"),
    [eventRegistrations]
  );
  const presentCount = useMemo(
    () => eventRegistrations.filter((r) => r.attendanceStatus === "present").length,
    [eventRegistrations]
  );

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-6">
      <SectionTitle
        index="37"
        kicker="Event Governance"
        title="Verified Event"
        accent="Attendance System"
        sub="Dynamic QR code attendance windows with physical cross-verification by assigned Student Coordinators."
        right={
          <div className="flex flex-wrap gap-2">
            <select
              className={INPUT + " !w-auto text-xs py-1.5 font-bold"}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.code} · {evt.title}
                </option>
              ))}
            </select>
            {(currentUser?.role === "admin" || currentUser?.role === "faculty") && (
              <BrutalButton tone="blood" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" /> Create Event
              </BrutalButton>
            )}
            <BrutalButton tone="ghost" onClick={handleExportCsv} disabled={eventRegistrations.length === 0}>
              <Download className="w-4 h-4" /> Export CSV
            </BrutalButton>
          </div>
        }
      />

      {/* Event Overview & Coordinators Banner */}
      {activeEvent && (
        <div className="border-2 border-ink bg-paper-2 hard p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-ink/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Stamp>{activeEvent.code}</Stamp>
                <span className="font-mono text-xs text-blood font-bold">{activeEvent.department}</span>
              </div>
              <h3 className="font-display uppercase text-xl text-ink mt-1">{activeEvent.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="border border-ink bg-paper px-2.5 py-1 flex items-center gap-1 font-bold">
                <Calendar className="w-3.5 h-3.5 text-blood" /> {activeEvent.date}
              </span>
              <span className="border border-ink bg-paper px-2.5 py-1 flex items-center gap-1 font-bold">
                <MapPin className="w-3.5 h-3.5 text-blood" /> {activeEvent.venue}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted uppercase font-bold">Assigned Student Coordinators:</span>
              <div className="flex flex-wrap gap-1.5">
                {(activeEvent.coordinators || []).map((cRoll) => {
                  const studentObj = students.find((s) => s.rollNo === cRoll || s.name === cRoll);
                  return (
                    <span key={cRoll} className="bg-ink text-paper font-bold px-2 py-0.5 border border-ink text-[11px] uppercase flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blood" /> {studentObj?.name || `Roll: ${cRoll}`}
                    </span>
                  );
                })}
              </div>
            </div>

            {(currentUser?.role === "admin" || currentUser?.role === "faculty") && (
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="font-mono text-xs text-blood font-bold underline hover:text-ink flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Manage Coordinators
              </button>
            )}
          </div>
        </div>
      )}

      {/* COORDINATOR CONTROL CONSOLE (If user is Coordinator or Faculty/Admin) */}
      {isCoordinator ? (
        <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <div>
              <span className="font-mono text-xs uppercase font-bold text-blood tracking-wider block">
                Coordinator Console
              </span>
              <h4 className="font-display text-lg text-ink uppercase">
                Attendance Window & QR Generator
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-mono text-xs font-bold text-ink">Window Duration:</label>
              <select
                className={INPUT + " !w-auto text-xs py-1 font-bold"}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                disabled={activeQrWindow?.isActive}
              >
                <option value={2}>2 Minutes</option>
                <option value={3}>3 Minutes (Default)</option>
                <option value={4}>4 Minutes</option>
                <option value={5}>5 Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left: QR Display Box & Countdown Timer */}
            <div className="border-2 border-ink bg-paper-3 hard p-5 space-y-4 text-center">
              {activeQrWindow && activeQrWindow.isActive ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-blood text-paper font-mono text-xs font-bold px-2 py-0.5 border border-ink uppercase">
                      LIVE ROUND: {activeQrWindow.id}
                    </span>
                    <span className="font-mono text-xs text-emerald-800 font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-4 h-4" /> Window Active
                    </span>
                  </div>

                  <div className="p-3 bg-paper border-2 border-ink inline-block mx-auto shadow-md">
                    <StudentQrCode value={activeQrWindow.payload} size={160} />
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-2xl font-black text-blood">
                      {Math.floor(timeLeftSeconds / 60)}:
                      {String(timeLeftSeconds % 60).padStart(2, "0")}
                    </div>
                    <p className="font-mono text-[10px] text-muted uppercase">
                      Timer expires in {durationMinutes} mins · Display QR to students
                    </p>
                  </div>

                  <BrutalButton
                    tone="blood"
                    className="w-full"
                    onClick={handleStartQrWindow}
                  >
                    <RefreshCw className="w-4 h-4" /> Invalidate & Generate Next Round (QR-0{qrRoundCount})
                  </BrutalButton>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="w-16 h-16 border-2 border-ink bg-paper mx-auto flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-blood" />
                  </div>
                  <div>
                    <h5 className="font-display uppercase text-base text-ink">No Active Attendance Window</h5>
                    <p className="font-mono text-xs text-muted mt-1 max-w-xs mx-auto">
                      Click below to generate a {durationMinutes}-minute dynamic QR code window for students to scan.
                    </p>
                  </div>

                  <BrutalButton tone="ink" className="w-full" onClick={handleStartQrWindow}>
                    <Play className="w-4 h-4" /> Start {durationMinutes}-Min Window & Generate QR-0{qrRoundCount}
                  </BrutalButton>
                </div>
              )}
            </div>

            {/* Right: Live Physical Verification Queue */}
            <div className="border-2 border-ink bg-paper hard p-4 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink/15 pb-2">
                <span className="font-mono text-xs uppercase font-bold text-ink">
                  Pending Physical Verifications ({pendingQueue.length})
                </span>
                {pendingQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onApproveAttendance) {
                        pendingQueue.forEach((q) => onApproveAttendance(q.id, currentUser?.name || "Coordinator"));
                      }
                    }}
                    className="font-mono text-[10px] font-bold text-blood underline hover:text-ink"
                  >
                    Approve All ({pendingQueue.length})
                  </button>
                )}
              </div>

              {pendingQueue.length === 0 ? (
                <div className="p-6 text-center">
                  <EmptyState label="No pending scan requests" hint="When students scan the live QR code, their verification requests will appear here in real-time." />
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {pendingQueue.map((item) => (
                    <div key={item.id} className="border-2 border-ink bg-paper-2 p-3 hard-sm flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-serif font-bold text-sm text-ink block">{item.studentName}</span>
                        <span className="font-mono text-[11px] text-blood font-bold block">Roll: {item.rollNo} · {item.department}</span>
                        <span className="font-mono text-[9px] text-muted block">Scanned: {item.registeredAt} ({item.qrRound || "QR-01"})</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onApproveAttendance && (
                          <BrutalButton
                            tone="blood"
                            className="!py-1 !px-2 !text-[11px]"
                            onClick={() => onApproveAttendance(item.id, currentUser?.name || "Coordinator")}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Approve
                          </BrutalButton>
                        )}
                        {onRejectAttendance && (
                          <BrutalButton
                            tone="ghost"
                            className="!py-1 !px-1.5 !text-[11px]"
                            onClick={() => onRejectAttendance(item.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </BrutalButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STUDENT VIEW (Scan QR Code for Attendance) */
        <div className="border-2 border-ink bg-paper hard p-5 space-y-4 max-w-lg mx-auto text-center">
          <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
            <span className="font-mono text-xs uppercase font-bold text-ink">
              Student Attendance Portal
            </span>
            <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-ink ${
              currentStudentReg?.attendanceStatus === "present"
                ? "bg-emerald-100 text-emerald-900"
                : currentStudentReg?.attendanceStatus === "pending_verification"
                ? "bg-amber-100 text-amber-900"
                : "bg-paper-3 text-ink"
            }`}>
              {currentStudentReg?.attendanceStatus === "present"
                ? "VERIFIED PRESENT"
                : currentStudentReg?.attendanceStatus === "pending_verification"
                ? "PENDING VERIFICATION"
                : "NOT MARKED"}
            </span>
          </div>

          {currentStudentReg?.attendanceStatus === "present" ? (
            <div className="border-2 border-emerald-800 bg-emerald-50 p-5 hard-sm space-y-2">
              <BadgeCheck className="w-10 h-10 text-emerald-700 mx-auto" />
              <h4 className="font-display uppercase text-lg text-emerald-950">Attendance Verified & Recorded</h4>
              <p className="font-mono text-xs text-emerald-900">
                Verified by <strong className="font-bold">{currentStudentReg.verifiedBy}</strong> on {currentStudentReg.verifiedAt}.
              </p>
            </div>
          ) : currentStudentReg?.attendanceStatus === "pending_verification" ? (
            <div className="border-2 border-amber-800 bg-amber-50 p-5 hard-sm space-y-2">
              <Clock className="w-10 h-10 text-amber-700 mx-auto animate-spin" />
              <h4 className="font-display uppercase text-lg text-amber-950">Request Sent to Coordinator</h4>
              <p className="font-mono text-xs text-amber-900">
                Your QR scan request has been submitted. Please wait for the Event Coordinator to physically cross-verify and approve you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-mono text-xs text-muted">
                Scan the live QR code displayed on the Event Coordinator&apos;s screen during the active 2-5 minute window.
              </p>

              <BrutalButton tone="blood" className="w-full !py-3" onClick={handleStudentScan}>
                <QrCode className="w-5 h-5" /> Scan QR & Submit Attendance Request
              </BrutalButton>
            </div>
          )}
        </div>
      )}

      {/* FINAL VERIFIED ATTENDANCE LEDGER */}
      <div className="border-2 border-ink bg-paper hard space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-display uppercase text-lg text-ink">Verified Event Attendance Ledger</h4>
            <p className="font-mono text-xs text-muted">
              Live registration list for {activeEvent?.title || "selected event"}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tag tone="ink">{presentCount} Verified Present</Tag>
            <Tag tone="blood">{pendingQueue.length} Pending</Tag>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Search Student">
            <input
              className={INPUT}
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Field>
          <Field label="Filter Status">
            <select className={INPUT} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Registrations ({eventRegistrations.length})</option>
              <option value="present">Verified Present ({presentCount})</option>
              <option value="pending_verification">Pending Verification ({pendingQueue.length})</option>
              <option value="not_scanned">Not Scanned</option>
            </select>
          </Field>
        </div>

        {/* Table */}
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink text-paper font-mono text-xs uppercase tracking-wider">
                <th className="p-3 border-r border-paper/20">Scholar Name</th>
                <th className="p-3 border-r border-paper/20">Roll No</th>
                <th className="p-3 border-r border-paper/20">Course</th>
                <th className="p-3 border-r border-paper/20">Status</th>
                <th className="p-3 border-r border-paper/20">QR Round</th>
                <th className="p-3">Verified By / Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/10 font-mono text-xs">
              {filteredRegistrations.map((r) => {
                const isPres = r.attendanceStatus === "present";
                const isPend = r.attendanceStatus === "pending_verification";

                return (
                  <tr key={r.id} className="hover:bg-paper-2 transition-colors">
                    <td className="p-3 font-serif font-bold text-ink">{r.studentName}</td>
                    <td className="p-3 text-blood font-bold">{r.rollNo}</td>
                    <td className="p-3 text-muted">{r.department}</td>
                    <td className="p-3">
                      {isPres ? (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 border border-ink text-[10px] uppercase flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3 text-emerald-700" /> Verified Present
                        </span>
                      ) : isPend ? (
                        <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 border border-ink text-[10px] uppercase flex items-center gap-1 w-fit animate-pulse">
                          <Clock className="w-3 h-3 text-amber-800" /> Pending Physical Sign-off
                        </span>
                      ) : (
                        <span className="bg-paper-3 text-muted font-bold px-2 py-0.5 border border-ink text-[10px] uppercase">
                          Not Scanned
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-blood font-bold">{r.qrRound || "-"}</td>
                    <td className="p-3 text-muted text-[11px]">
                      {isPres ? (
                        <div>
                          <span className="text-ink font-bold">{r.verifiedBy || "Coordinator"}</span>
                          <span className="block text-[9px] text-muted">{r.verifiedAt || "Today"}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateEventSubmit} className="border-2 border-ink bg-paper hard p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h4 className="font-display uppercase text-lg text-ink">Create Campus Event</h4>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <Field label="Event Title">
              <input className={INPUT} value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} required placeholder="e.g. VSCMS Tech Conclave 2026" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Event Code">
                <input className={INPUT} value={evtCode} onChange={(e) => setEvtCode(e.target.value)} required placeholder="e.g. EVT-2026-CS" />
              </Field>
              <Field label="Date">
                <input type="date" className={INPUT} value={evtDate} onChange={(e) => setEvtDate(e.target.value)} required />
              </Field>
            </div>

            <Field label="Venue">
              <input className={INPUT} value={evtVenue} onChange={(e) => setEvtVenue(e.target.value)} required placeholder="e.g. Main Auditorium" />
            </Field>

            <Field label="Assign Student Coordinators">
              <select
                multiple
                className={INPUT + " h-24 text-xs"}
                value={selectedCoordRolls}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, (o) => o.value);
                  setSelectedCoordRolls(options);
                }}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.rollNo}>
                    {s.name} ({s.rollNo} · {s.department})
                  </option>
                ))}
              </select>
              <p className="font-mono text-[9px] text-muted mt-1">Hold Ctrl/Cmd to select multiple student coordinators.</p>
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-ink/10">
              <BrutalButton type="button" tone="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </BrutalButton>
              <BrutalButton type="submit" tone="blood">
                Create Event & Assign
              </BrutalButton>
            </div>
          </form>
        </div>
      )}

      {/* MANAGE COORDINATORS MODAL */}
      {showAssignModal && activeEvent && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-2 border-ink bg-paper hard p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <h4 className="font-display uppercase text-lg text-ink">Manage Student Coordinators</h4>
              <button type="button" onClick={() => setShowAssignModal(false)} className="p-1 text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-mono text-xs text-muted">
              Select scholars to act as official Event Coordinators for <strong className="text-ink">{activeEvent.title}</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-ink p-2 bg-paper-2">
              {students.map((s) => {
                const isSelected = (activeEvent.coordinators || []).includes(s.rollNo);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      const current = activeEvent.coordinators || [];
                      const updated = isSelected
                        ? current.filter((c) => c !== s.rollNo)
                        : [...current, s.rollNo];
                      if (onUpdateCoordinators) onUpdateCoordinators(activeEvent.id, updated);
                    }}
                    className={`border p-2 cursor-pointer flex items-center justify-between text-xs font-mono transition-colors ${
                      isSelected ? "border-ink bg-paper font-bold" : "border-ink/20 hover:bg-paper"
                    }`}
                  >
                    <span>{s.name} ({s.rollNo})</span>
                    {isSelected && <BadgeCheck className="w-4 h-4 text-blood" />}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <BrutalButton tone="ink" onClick={() => setShowAssignModal(false)}>
                Done Managing
              </BrutalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

