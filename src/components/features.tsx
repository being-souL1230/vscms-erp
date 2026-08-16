"use client";
import { useMemo, useState } from "react";
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
  Section,
  SemesterInfo,
  AcademicSession,
  ExamSchedule,
  ExamDefinition,
  InternalMark,
  FacultyAttendance,
  PermissionRow,
  LeaveRequest,
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
}: {
  students: User[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
}) {
  const [q, setQ] = useState("");
  const rows = students
    .map((s) => {
      const att = attendance.filter((a) => a.studentId === s.id);
      const present = att.filter((a) => a.status !== "absent").length;
      const rate = att.length ? pct(present, att.length) : 100;
      const myGrades = grades.filter((g) => g.studentId === s.id);
      const avg = myGrades.length
        ? myGrades.reduce((a, g) => a + (Number(g.marksObtained) / Number(g.maxMarks || 100)) * 100, 0) / myGrades.length
        : null;
      const gpa = Number(s.gpa) || 0;
      return { s, rate, avg, myGrades: myGrades.length, gpa };
    })
    .filter((r) => r.s.name.toLowerCase().includes(q.toLowerCase()) || r.s.rollNo.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4">
      <SectionTitle
        kicker="Scholar Analytics"
        title="Student"
        accent="Performance"
        sub="Attendance % and average scores across all students."
      />
      <Field label="Search"><input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name / roll…" /></Field>
      <div className="border-2 border-ink overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={TH}>Scholar</th><th className={TH}>Attendance</th><th className={TH}>Avg Score</th><th className={TH}>GPA</th><th className={TH}>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.s.id} className="border-b-2 border-ink/10">
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <SquareAvatar src={r.s.avatarUrl} initial={r.s.name.charAt(0)} className="!h-8 !w-8" />
                    <div>
                      <p className="font-serif text-xs font-semibold">{r.s.name}</p>
                      <p className="font-mono text-[10px] text-muted">{r.s.rollNo} · {r.s.department}</p>
                    </div>
                  </div>
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 border border-ink"><div className="h-full hazard" style={{ width: `${r.rate}%` }} /></div>
                    <Tag tone={r.rate >= 75 ? "ink" : "blood"}>{r.rate}%</Tag>
                  </div>
                </td>
                <td className={TD}>
                  {r.avg != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 border border-ink"><div className="h-full bg-blood" style={{ width: `${r.avg}%` }} /></div>
                      <span className="font-mono text-[11px]">{r.avg.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-muted"></span>
                  )}
                </td>
                <td className={TD}><span className="font-mono text-[11px] text-blood">{r.gpa.toFixed(2)}</span></td>
                <td className={TD}>
                  <Tag tone={r.rate >= 75 && (r.avg ?? 100) >= 40 ? "ink" : "blood"}>
                    {r.rate >= 75 && (r.avg ?? 100) >= 40 ? "Good" : "At Risk"}
                  </Tag>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}><div className="p-6"><EmptyState label="No students" /></div></td></tr>}
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
export function StudentIdCardTab({
  currentUser,
  admission,
}: {
  currentUser: User | null;
  admission: AdmissionInfo | null;
}) {
  const u = currentUser;
  if (!u) return <EmptyState label="Sign in to view your ID card" />;
  const session = "2025-26";
  const a = admission;
  return (
    <div className="border-2 border-ink bg-paper hard p-4 sm:p-6 space-y-5">
      <SectionTitle
        kicker="Identity"
        title="Student"
        accent="ID Card"
        sub="Your official institute identity valid for session 2025-26."
        right={<BrutalButton tone="ink" onClick={() => printElement("student-id-card")}><Printer className="w-4 h-4" /> Print</BrutalButton>}
      />
      <div id="student-id-card" className="max-w-md mx-auto border-2 border-ink hard overflow-hidden">
        <div className="bg-ink text-paper px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-display uppercase text-base leading-none">College of Management Studies</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/70 mt-1">VSCMS · {session}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vscms-logo.png"
            alt="College of Management Studies"
            className="h-11 w-11 rounded-full bg-paper border-2 border-paper object-contain"
          />
        </div>
        <div className="bg-paper px-5 py-5 flex gap-4">
          <div className="shrink-0">
            <SquareAvatar src={u.avatarUrl} initial={u.name.charAt(0)} className="!h-20 !w-20 border-2 border-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display uppercase text-lg text-ink leading-tight">{u.name}</p>
            <p className="font-mono text-[10px] text-blood mt-1">Roll No · {u.rollNo}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[10px]">
              <span className="text-muted">Course</span><span className="text-ink font-bold">{u.department}</span>
              <span className="text-muted">Semester</span><span className="text-ink font-bold">{u.semester || 1}</span>
              <span className="text-muted">Blood</span><span className="text-ink font-bold">{a?.bloodGroup || ""}</span>
              <span className="text-muted">Category</span><span className="text-ink font-bold">{a?.category || "General"}</span>
            </div>
          </div>
        </div>
        <div className="border-t-2 border-ink px-5 py-3 bg-paper-2">
          <div className="flex items-center justify-between font-mono text-[9px] text-muted">
            <span>Admission · {a?.admissionNumber || ""}</span>
            <span>Guardian · {a?.guardianPhone || ""}</span>
          </div>
        </div>
        <div className="hazard h-2" />
      </div>
      <p className="font-mono text-[10px] text-muted text-center">
        Print this card and laminate it carry it for library, lab and exam entry.
      </p>
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
  // Faculty can only see and edit the courses assigned to them.
  const ownedCourses = courses.filter(
    (c) => c.facultyId === currentUser?.id || c.facultyName === currentUser?.name,
  );
  const [courseId, setCourseId] = useState<number>(ownedCourses[0]?.id || 0);
  const [maxT, setMaxT] = useState(30);
  const [maxP, setMaxP] = useState(20);
  const [passP, setPassP] = useState(40);
  const course = ownedCourses.find((c) => c.id === courseId) || ownedCourses[0];
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
          <select className={INPUT} value={courseId} onChange={(e) => setCourseId(Number(e.target.value))} disabled={ownedCourses.length === 0}>
            {ownedCourses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select>
        </Field>
        <Field label="Max Theory"><input type="number" min={1} max={100} className={INPUT} value={maxT} onChange={(e) => setMaxT(Number(e.target.value))} /></Field>
        <Field label="Max Practical"><input type="number" min={1} max={100} className={INPUT} value={maxP} onChange={(e) => setMaxP(Number(e.target.value))} /></Field>
        <Field label="Passing %"><input type="number" min={1} max={99} className={INPUT} value={passP} onChange={(e) => setPassP(Number(e.target.value))} /></Field>
      </div>
      {ownedCourses.length === 0 && (
        <EmptyState
          label="No courses assigned to you"
          hint="Marks entry is restricted to the subjects assigned to you by the academic office."
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
  const mine = marks.filter(
    (m) =>
      m.status === "approved" &&
      (m.studentId === currentUser?.id || m.studentName === currentUser?.name),
  );
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

  return (
    <div className="space-y-4">
      <SectionTitle
        index="12"
        kicker="Fees · Collection"
        title="Student"
        accent="Fees"
        sub="Collect fees from students enrolled in your courses. Every payment is stamped with your name for the audit record."
        right={
          <div className="flex items-center gap-2">
            <Tag tone="ink">{scopeFees.length} invoices</Tag>
            <Tag tone="blood">{dueCount} due</Tag>
          </div>
        }
      />

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
                          {eff !== "paid" && (
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
