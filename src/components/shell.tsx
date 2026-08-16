"use client";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  GraduationCap,
  Shield,
  BookOpen,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowUpRight,
  LogOut,
  Bell,
  RefreshCw,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Printer,
} from "lucide-react";
import type { UserRole, User, Notice, Course, FeeRecord, FeeStructure, FeePayment } from "@/types/erp";
import { feeRemaining } from "@/types/erp";

/* ============================================================
   USER PROFILES
   ============================================================ */
export const PROFILES: Record<UserRole, User> = {
  admin: {
    id: 1,
    name: "Dr. Virendra Swaroop",
    email: "director@vscms.edu",
    role: "admin",
    rollNo: "1",
    rollNoOrEmpId: "1",
    department: "Office of the Director",
    designation: "Director, College of Management Studies",
    status: "active",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80",
  },
  faculty: {
    id: 2,
    name: "Prof. Elena Rostova",
    email: "e.rostova@vscms.edu",
    role: "faculty",
    rollNo: "2",
    rollNoOrEmpId: "2",
    department: "BCA (CSJM)",
    designation: "Professor of Computer Science · HOD",
    status: "active",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
  },
  student: {
    id: 5,
    name: "Aarav Rao",
    email: "aarav.r@vscms.edu",
    role: "student",
    rollNo: "101",
    rollNoOrEmpId: "101",
    department: "BCA (CSJM)",
    semester: 3,
    gpa: "3.81",
    status: "active",
    avatarUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
  },
};

/* ============================================================
   BASIC UI BUILDING BLOCKS
   ============================================================ */
export const INPUT =
  "w-full bg-paper-3 border-2 border-ink px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-blood focus:shadow-[3px_3px_0_0_var(--color-blood)] transition-shadow rounded-none";

/* ============================================================
   PRINT HELPER — print only one element (not the whole page)
   ============================================================ */
export function printElement(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    window.print();
    return;
  }
  let host = document.getElementById("print-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "print-host";
    document.body.appendChild(host);
  }
  // Clone the element into the hidden print host so only it prints.
  // Strip the id so it isn't duplicated while the original stays in the DOM.
  const clone = target.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  host.replaceChildren(clone);
  document.body.classList.add("print-mode");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    document.body.classList.remove("print-mode");
    host.replaceChildren();
    if (timer !== undefined) clearTimeout(timer);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // Safety net for browsers where afterprint doesn't fire reliably.
  timer = setTimeout(cleanup, 5000);
  window.print();
}

export function Hazard({ className = "" }: { className?: string }) {
  return <div className={`hazard ${className}`} aria-hidden />;
}

export function Tag({
  children,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  tone?: "ink" | "blood" | "paper" | "muted" | "outline";
  className?: string;
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-paper border-ink",
    blood: "bg-blood text-paper border-ink",
    paper: "bg-paper text-ink border-ink",
    muted: "bg-paper-2 text-ink border-ink",
    outline: "bg-transparent text-ink border-ink",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 border-2 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Stamp({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-blood text-paper font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 border-2 border-ink hard-sm ${className}`}
    >
      {children}
    </span>
  );
}

type Tone = "blood" | "ink" | "paper" | "ghost";

export function BrutalButton({
  children,
  onClick,
  type = "button",
  tone = "blood",
  className = "",
  disabled = false,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: Tone;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const tones: Record<Tone, string> = {
    blood: "bg-blood text-paper border-ink hard press",
    ink: "bg-ink text-paper border-ink hard press",
    paper: "bg-paper text-ink border-ink hard press",
    ghost:
      "bg-transparent text-ink border-ink hard-sm press hover:bg-ink hover:text-paper",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({
  index,
  kicker,
  title,
  accent,
  sub,
  right,
}: {
  index?: string;
  kicker?: string;
  title: string;
  accent?: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-ink pb-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {index && (
            <span className="font-mono text-xs font-bold text-blood">§ {index}</span>
          )}
          {kicker && (
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {kicker}
            </span>
          )}
          <span className="hazard h-3 w-10 border border-ink" aria-hidden />
        </div>
        <h2 className="font-display uppercase leading-[0.92] text-2xl sm:text-3xl lg:text-4xl text-ink">
          {title} {accent && <span className="text-blood">{accent}</span>}
        </h2>
        {sub && (
          <p className="mt-2 font-serif italic text-sm text-muted max-w-xl">{sub}</p>
        )}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  right,
  children,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
          {label}
        </span>
        {right}
      </div>
      {children}
      {hint && <span className="block mt-1 font-serif italic text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function EmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="border-2 border-dashed border-ink/60 bg-paper-2/60 px-6 py-12 text-center">
      <div className="mx-auto mb-3 h-8 w-8 border-2 border-ink bg-paper flex items-center justify-center">
        <span className="hazard h-3 w-3" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink">{label}</p>
      {hint && <p className="mt-1 font-serif italic text-sm text-muted">{hint}</p>}
    </div>
  );
}

/* ============================================================
   TOP STATUS BAR
   ============================================================ */
export function Ticker() {
  return (
    <div className="w-full bg-white text-slate-600 border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 text-xs">
        <span className="font-medium">College of Management Studies · Academic Operations Portal</span>
        <span className="hidden sm:flex items-center gap-2 text-slate-500">
          <span className="blink h-2 w-2 rounded-full bg-blue-600" />
          Sem II · 2026 · Live
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 w-[330px] max-w-[92vw]">
      {toasts.map((t) => {
        const palette =
          t.type === "error"
            ? "bg-blood text-paper border-ink"
            : t.type === "info"
              ? "bg-paper text-ink border-ink"
              : "bg-ink text-paper border-ink";
        const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? AlertCircle : Info;
        const bar = t.type === "success" ? "bg-blood" : t.type === "error" ? "bg-paper" : "bg-blood";
        return (
          <div
            key={t.id}
            className={`pop-in flex items-start gap-3 border-2 hard ${palette} relative overflow-hidden`}
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${bar}`} />
            <div className="pl-4 pr-2 py-3 flex items-start gap-2.5 w-full">
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">{t.title}</p>
                <p className="font-serif text-xs mt-0.5 opacity-90">{t.message}</p>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="opacity-70 hover:opacity-100 p-0.5"
                aria-label="dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   TOP NAVIGATION BAR
   ============================================================ */
export function Navbar({
  currentUser,
  activeRole,
  onRoleChange,
  onLogout,
  onResetSeed,
  isSeeding,
  notices,
  onToast,
}: {
  currentUser: User | null;
  activeRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  onLogout: () => void;
  onResetSeed: () => void;
  isSeeding: boolean;
  notices: Notice[];
  onToast?: (type: "success" | "error" | "info", title: string, message: string) => void;
}) {
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const roles: { key: UserRole; label: string; Icon: typeof Shield; handle: string }[] = [
    { key: "admin", label: "Admin", Icon: Shield, handle: "director" },
    { key: "faculty", label: "Faculty", Icon: BookOpen, handle: "e.rostova" },
    { key: "student", label: "Scholar", Icon: GraduationCap, handle: "aarav.r" },
  ];

  return (
    <header className="bg-paper border-b-2 border-ink">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[68px] gap-3">
          {/* Crest + wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <Crest size={44} />
            <div className="leading-none min-w-0">
              <div className="font-display uppercase text-lg sm:text-xl text-ink tracking-tight">
                VSCMS <span className="text-blood">ERP</span>
              </div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-muted mt-1 truncate">
                College of Management Studies
              </div>
            </div>
          </div>

          {/* Role segmented switch */}
          <div className="hidden lg:flex items-center border-2 border-ink bg-paper-2 p-1 hard-sm">
            {roles.map((r) => {
              const active = activeRole === r.key;
              const Icon = r.Icon;
              return (
                <button
                  key={r.key}
                  onClick={() => onRoleChange(r.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] border-2 transition-colors ${
                    active
                      ? "bg-ink text-paper border-ink"
                      : "bg-transparent text-ink border-transparent hover:bg-paper"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSeed}
              disabled={isSeeding}
              title="Reset demo data"
              className="hidden sm:inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] hard-sm press hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin text-blood" : ""}`} />
              <span className="hidden md:inline">Reset</span>
            </button>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setBell((v) => !v);
                  setMenu(false);
                }}
                title="Campus notices"
                className="relative border-2 border-ink bg-paper p-2 hard-sm press"
              >
                <Bell className="w-4 h-4" />
                {notices.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blood text-paper border-2 border-ink font-mono text-[9px] font-bold h-5 w-5 flex items-center justify-center">
                    {notices.length}
                  </span>
                )}
              </button>
              {bell && (
                <div className="pop-in absolute right-0 mt-2 w-80 border-2 border-ink bg-paper hard-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2 bg-ink text-paper">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                      Campus Notices
                    </span>
                    <span className="font-mono text-[10px] text-paper/70">{notices.length} active</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notices.length === 0 && (
                      <p className="p-4 font-serif italic text-sm text-muted">No notices posted yet.</p>
                    )}
                    {notices.map((n) => (
                      <div
                        key={n.id}
                        className="px-3 py-2.5 border-b-2 border-ink/10 hover:bg-paper-2 cursor-default"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Tag tone={n.priority === "urgent" ? "blood" : "ink"}>{n.category}</Tag>
                          <span className="font-mono text-[10px] text-muted">{n.publishedDate}</span>
                        </div>
                        <p className="font-serif text-xs text-ink leading-snug line-clamp-2">{n.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User chip */}
            <div className="relative">
              <button
                onClick={() => {
                  setMenu((v) => !v);
                  setBell(false);
                }}
                className="flex items-center gap-2 border-2 border-ink bg-paper pl-1.5 pr-2.5 py-1.5 hard-sm press"
              >
                <SquareAvatar src={currentUser?.avatarUrl} initial={currentUser?.name?.charAt(0) || "V"} />
                <div className="text-left hidden sm:block leading-tight">
                  <p className="font-mono text-[11px] font-bold text-ink truncate max-w-[120px]">
                    {currentUser?.name || "Guest"}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-blood">
                    {activeRole}
                  </p>
                </div>
              </button>
              {menu && (
                <div className="pop-in absolute right-0 mt-2 w-60 border-2 border-ink bg-paper hard-lg z-50">
                  <div className="px-3 py-2.5 border-b-2 border-ink">
                    <p className="font-mono text-[11px] font-bold text-ink">{currentUser?.name}</p>
                    <p className="font-mono text-[10px] text-muted truncate">{currentUser?.email}</p>
                    <p className="font-mono text-[10px] text-blood mt-0.5">{currentUser?.rollNoOrEmpId}</p>
                  </div>
                  <div className="lg:hidden py-1 border-b-2 border-ink">
                     <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                       Switch view
                     </p>
                    {roles.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => {
                          onRoleChange(r.key);
                          setMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-ink hover:bg-ink hover:text-paper"
                      >
                        {r.label} console
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setMenu(false);
                      setPwOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-paper"
                  >
                    <Lock className="w-3.5 h-3.5" /> Change password
                  </button>
                  <button
                    onClick={() => {
                      setMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-blood hover:bg-blood hover:text-paper"
                  >
                     <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={pwOpen}
        onClose={() => setPwOpen(false)}
        onSuccess={(msg) => onToast?.("success", "Password updated", msg)}
      />
    </header>
  );
}

export function SquareAvatar({
  src,
  initial,
  className = "",
}: {
  src?: string | null;
  initial?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden border-2 border-ink bg-ink text-paper font-display ${className}`}
      style={{ width: 30, height: 30 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm">{initial}</span>
      )}
    </span>
  );
}

export function Crest({ size = 56 }: { size?: number }) {
  return (
    <div
      className="bg-paper border-2 border-ink hard-sm flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/vscms-logo.png"
        alt="College of Management Studies"
        className="object-contain"
        style={{ width: size - 10, height: size - 10 }}
      />
    </div>
  );
}

/* ============================================================
   SIDEBAR MENU
   ============================================================ */
export function Sidebar({
  activeRole,
  currentTab,
  onTabChange,
  pendingFeeCount = 0,
  assignmentsCount = 0,
}: {
  activeRole: UserRole;
  currentTab: string;
  onTabChange: (t: string) => void;
  pendingFeeCount?: number;
  assignmentsCount?: number;
}) {
  const nav = (() => {
    if (activeRole === "admin")
      return [
        { id: "overview", label: "Dashboard", mark: "01" },
        { id: "students", label: "Students", mark: "02" },
        { id: "faculty", label: "Teachers", mark: "03" },
        { id: "courses", label: "Courses", mark: "04" },
        { id: "departments", label: "Departments", mark: "05" },
        {
          id: "fees",
          label: "Fees",
          mark: "06",
          badge: pendingFeeCount > 0 ? `${pendingFeeCount} due` : undefined,
        },
        { id: "notices", label: "Notices", mark: "07" },
        { id: "timetable", label: "Timetable", mark: "08" },
        { id: "exams", label: "Exam Schedule", mark: "09" },
        { id: "setup", label: "Academic Setup", mark: "10" },
        { id: "documents", label: "Documents", mark: "11" },
        { id: "users", label: "Users & Roles", mark: "12" },
        { id: "permissions", label: "Permissions", mark: "13" },
        { id: "reports", label: "Reports", mark: "14" },
        { id: "attendance", label: "Attendance", mark: "15" },
      ];
    if (activeRole === "faculty")
      return [
        { id: "overview", label: "My Dashboard", mark: "01" },
        { id: "attendance", label: "Attendance", mark: "02" },
        { id: "grades", label: "Grades", mark: "03" },
        {
          id: "assignments",
          label: "Assignments",
          mark: "04",
          badge: assignmentsCount > 0 ? `${assignmentsCount}` : undefined,
        },
        { id: "marks", label: "Exam Marks", mark: "05" },
        { id: "leaves", label: "Leave Requests", mark: "06" },
        { id: "myleave", label: "My Leave", mark: "07" },
        { id: "performance", label: "Performance", mark: "08" },
        { id: "notices", label: "Notices", mark: "09" },
        { id: "timetable", label: "Timetable", mark: "10" },
        { id: "myattendance", label: "My Attendance", mark: "11" },
        { id: "fees", label: "Fees", mark: "12" },
      ];
    return [
      { id: "overview", label: "My Dashboard", mark: "01" },
      { id: "attendance", label: "My Attendance", mark: "02" },
      { id: "results", label: "My Grades", mark: "03" },
      {
        id: "fees",
        label: "Fees",
        mark: "04",
        badge: pendingFeeCount > 0 ? "due" : undefined,
      },
      { id: "leave", label: "Leave Request", mark: "05" },
      { id: "timetable", label: "Timetable", mark: "06" },
      { id: "assignments", label: "Assignments", mark: "07" },
      { id: "notices", label: "Notices", mark: "08" },
      { id: "exams", label: "Exam Schedule", mark: "09" },
      { id: "history", label: "Academic History", mark: "10" },
      { id: "documents", label: "My Documents", mark: "11" },
      { id: "idcard", label: "ID Card", mark: "12" },
      { id: "profile", label: "My Profile", mark: "13" },
      { id: "admitcard", label: "Admit Card", mark: "14" },
    ];
  })();

  const roleLabel =
    activeRole === "admin" ? "Admin View" : activeRole === "faculty" ? "Teacher View" : "Student View";

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-ink text-paper border-2 border-ink hard flex flex-col">
      <Hazard className="h-2" />
      <div className="px-4 pt-4 pb-3 border-b-2 border-paper/15">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">Current View</p>
        <p className="font-display uppercase text-base text-paper mt-1 leading-none">{roleLabel}</p>
        <p className="font-mono text-[10px] text-blood mt-1.5 tracking-[0.14em]">{"// College of Management Studies"}</p>
      </div>

      <nav className="p-3 space-y-1.5 flex-1">
        {nav.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full group flex items-center justify-between gap-2 px-3 py-2.5 border-2 transition-colors ${
                active
                  ? "bg-blood text-paper border-paper hard-paper"
                  : "bg-transparent text-paper/80 border-transparent hover:bg-paper hover:text-ink hover:border-ink"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`font-mono text-[10px] font-bold ${active ? "text-paper/80" : "text-blood"}`}
                >
                  {item.mark}
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] truncate">
                  {item.label}
                </span>
              </span>
              {item.badge && (
                <span
                  className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border ${
                    active ? "border-paper text-paper" : "border-blood text-blood"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>


    </aside>
  );
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
export function LoginPage({
  onLogin,
  allUsers,
}: {
  onLogin: (u: User, r: UserRole) => void;
  allUsers: User[];
}) {
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("director@vscms.edu");
  const [pass, setPass] = useState("demo12345");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("BCA (CSJM)");

  const pickEmail = (r: UserRole) =>
    r === "admin" ? "director@vscms.edu" : r === "faculty" ? "e.rostova@vscms.edu" : "aarav.r@vscms.edu";

  const selectRole = (r: UserRole) => {
    setRole(r);
    setEmail(pickEmail(r));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch(registering ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(registering ? { name, email, password: pass, rollNoOrEmpId: rollNo, department } : { email, password: pass }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Login failed");
      onLogin(body.user, body.user.role);
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setBusy(false); }
  };

  const signInDemo = async (demoRole: UserRole) => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: demoRole }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Demo login failed");
      onLogin(body.user, body.user.role);
    } catch (err) { setError(err instanceof Error ? err.message : "Demo login failed"); }
    finally { setBusy(false); }
  };

  const cards: { key: UserRole; label: string; handle: string; Icon: typeof Shield; tilt: string }[] = [
    { key: "admin", label: "Admin", handle: "director", Icon: Shield, tilt: "tilt-l" },
    { key: "faculty", label: "Faculty", handle: "e.rostova", Icon: BookOpen, tilt: "tilt-m" },
    { key: "student", label: "Scholar", handle: "aarav.r", Icon: GraduationCap, tilt: "tilt-r" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Ticker />

      {/* top meta strip */}
      <div className="bg-paper border-b-2 border-ink">
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
          <span>Form VSCMS-01 - College Access</span>
          <span className="hidden sm:flex items-center gap-2">
            <span className="blink h-2 w-2 bg-blood" /> 2026 - Live
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 border-2 border-ink hard-lg bg-paper">
             {/* LEFT - brand panel */}
          <div className="relative bg-ink text-paper p-7 sm:p-10 ruled-right flex flex-col">
            <Hazard className="absolute top-0 left-0 right-0 h-3" />

            <div className="flex items-start justify-between mt-3">
              <div className="bg-paper p-3 border-2 border-paper hard-red">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/vscms-logo.png"
                  alt="College of Management Studies"
                  className="h-24 w-24 rounded-full border-2 border-blood bg-paper-3 object-contain"
                />
              </div>
              <Stamp className="-rotate-6">CMS</Stamp>
            </div>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-paper/70">
              Official · Secured Portal
            </p>
            <h1 className="mt-3 font-display uppercase leading-[0.86] text-paper text-5xl sm:text-6xl">
              Welcome to
              <br />
              <span className="text-blood">VSCMS</span>
            </h1>
            <p className="mt-5 font-serif italic text-paper/80 text-base leading-relaxed max-w-sm">
              College of Management Studies — manage attendance, courses, fees and campus notices in
              one simple system.
            </p>

            {/* demo credentials plate */}
            <div className="mt-auto pt-8">
              <div className="border-2 border-paper/40 bg-ink-2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/70">
                    Quick Login
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-blood">
                    2026
                  </span>
                </div>
                <div className="divide-y divide-paper/15">
                  {cards.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => signInDemo(c.key)}
                      className="w-full grid grid-cols-[70px_1fr_auto] items-center gap-3 py-2 text-left group hover:bg-paper/5 px-1"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/70">
                        {c.label}
                      </span>
                      <span className="font-mono text-[11px] text-paper group-hover:text-blood transition-colors truncate">
                        {c.handle}@vscms.edu
                      </span>
                      <span className="font-mono text-[10px] font-bold text-blood border border-blood px-1.5 py-0.5">
                        {c.key}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

             {/* RIGHT - login form */}
          <div className="p-7 sm:p-10 bg-paper flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
                  Please Authenticate
                </p>
                <h2 className="font-display uppercase text-3xl sm:text-4xl text-ink mt-1">
                  College <span className="text-blood">Login</span>
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted border-b border-dashed border-ink/40 pb-0.5">
                Home
              </span>
            </div>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">Quick Login</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {cards.map((c) => {
                const Icon = c.Icon;
                const active = role === c.key;
                return (
                  <button
                    key={c.key}
                      onClick={() => signInDemo(c.key)}
                    className={`${c.tilt} text-left border-2 border-ink bg-paper p-3 hard-sm hover:hard flex items-center gap-2.5`}
                  >
                    <span
                      className={`h-9 w-9 flex items-center justify-center border-2 border-ink ${
                        active ? "bg-blood text-paper" : "bg-ink text-paper"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="leading-tight min-w-0">
                      <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink truncate">
                        {c.label}
                      </span>
                      <span className="block font-serif italic text-[11px] text-muted truncate">
                        {c.handle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="flex-1 border-t-2 border-dashed border-ink/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Or use email and password
              </span>
              <span className="flex-1 border-t-2 border-dashed border-ink/40" />
            </div>

            <form onSubmit={submit} className="space-y-4 flex-1">
              {registering && <>
                <Field label="Full Name"><input required value={name} onChange={(e) => setName(e.target.value)} className={INPUT} /></Field>
                <Field label="Roll Number / Student ID"><input required value={rollNo} onChange={(e) => setRollNo(e.target.value)} className={INPUT} /></Field>
                <Field label="Department"><input required value={department} onChange={(e) => setDepartment(e.target.value)} className={INPUT} /></Field>
              </>}
              <Field label="Email">
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="firstname.lastname@vscms.edu"
                    className={INPUT + " pl-9"}
                  />
                </div>
              </Field>

              <Field
                label="Password"
                right={
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-blood"
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                }
              >
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type={show ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="admin / faculty / student"
                    className={INPUT + " pl-9"}
                  />
                </div>
              </Field>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2 select-none"
                >
                  <span
                    className={`h-5 w-5 border-2 border-ink flex items-center justify-center ${
                      remember ? "bg-blood text-paper" : "bg-paper"
                    }`}
                  >
                    {remember && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-serif text-sm text-ink">Remember this browser</span>
                </button>

                <BrutalButton type="submit" tone="blood" disabled={busy}>
                  {busy ? "Signing in…" : "Enter Console"} <ArrowRight className="w-4 h-4" />
                </BrutalButton>
              </div>
              {error && <p className="text-sm text-blood font-mono">{error}</p>}
              <button type="button" onClick={() => { setRegistering((value) => !value); setError(""); }} className="font-mono text-xs text-blood underline underline-offset-4">
                {registering ? "Already have an account? Login" : "New student? Create account"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t-2 border-dashed border-ink/40 flex items-center justify-between">
              <p className="font-serif italic text-xs text-muted">
                Forgot your password? Contact the IT office.
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Version 2.4 - 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODALS - Student / Course / Fee Receipt
   ============================================================ */
export function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: Partial<User>) => void;
  initialData?: User | null;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [roll, setRoll] = useState(initialData?.rollNoOrEmpId || "");
  const [dept, setDept] = useState(initialData?.department || "BCA (CSJM)");
  const [sem, setSem] = useState(initialData?.semester || 3);
  const [phone, setPhone] = useState(initialData?.phone || "+91 98200 00000");

  if (!isOpen) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ id: initialData?.id, name, email, rollNoOrEmpId: roll.trim() || `${Math.floor(100 + Math.random() * 900)}`, department: dept, semester: Number(sem), phone });
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={initialData ? "Edit Student" : "Add Student"} tag="FORM - SCH-01" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <Field label="Full Name">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Student ID">
            <input className={INPUT} value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="auto e.g. 101" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Department">
            <select className={INPUT} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option>BCA (CSJM)</option>
              <option>BCA (MCU)</option>
              <option>MBA</option>
              <option>BBA</option>
            </select>
          </Field>
          <Field label="Semester">
            <input type="number" min={1} max={6} className={INPUT} value={sem} onChange={(e) => setSem(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Phone Number">
          <input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="blood">{initialData ? "Update" : "Add Student"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function CourseModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: Partial<Course>) => void;
}) {
  const [code, setCode] = useState("FIN620");
  const [name, setName] = useState("Mergers, Acquisitions & Restructuring");
  const [dept, setDept] = useState("BCA (CSJM)");
  const [credits, setCredits] = useState(3);
  const [sem, setSem] = useState(4);
  const [faculty, setFaculty] = useState("Prof. Elena Rostova");
  const [room, setRoom] = useState("Bloomberg Wing · BL-305");

  if (!isOpen) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ code, name, department: dept, credits: Number(credits), semester: Number(sem), facultyName: faculty, room });
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Add New Course" tag="FORM - CRS-02" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Code"><input className={INPUT} value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
          <Field label="Credits"><input type="number" min={1} max={6} className={INPUT} value={credits} onChange={(e) => setCredits(Number(e.target.value))} /></Field>
        </div>
        <Field label="Course Title"><input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Department">
          <select className={INPUT} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option>BCA (CSJM)</option>
            <option>BCA (MCU)</option>
            <option>MBA</option>
            <option>BBA</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Faculty"><input className={INPUT} value={faculty} onChange={(e) => setFaculty(e.target.value)} /></Field>
          <Field label="Room"><input className={INPUT} value={room} onChange={(e) => setRoom(e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="ink">Save Course</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function FeeReceiptModal({
  isOpen,
  onClose,
  record,
  onPay,
  printable = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: FeeRecord | null;
  onPay?: (id: number) => void;
  printable?: boolean;
}) {
  if (!isOpen || !record) return null;
  return (
    <Overlay onClose={onClose}>
      <div className="hazard h-3" />
      <div id="fee-receipt">
      <div className="px-6 pt-5 pb-2 text-center border-b-2 border-ink">
        <div className="mx-auto mb-2"><Crest size={52} /></div>
        <p className="font-display uppercase text-lg text-ink">College of Management Studies</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted mt-0.5">
          Office - Official Fee Receipt
        </p>
      </div>
      <div className="px-6 py-4 space-y-1.5 text-sm">
        <Row label="Student" value={record.studentName} strong />
        <Row label="Student ID" value={record.rollNo} mono />
        <Row label="Fee Type" value={record.feeType} />
        <Row label="Due Date" value={record.dueDate} />
          <Row label="Amount" value={`₹ ${Number(record.amount).toFixed(2)}`} strong accent />
          <Row label="Paid" value={`₹ ${Number(record.paidAmount || 0).toFixed(2)}`} mono />
          {feeRemaining(record) > 0 && <Row label="Remaining" value={`₹ ${feeRemaining(record).toFixed(2)}`} mono />}
        <div className="flex justify-between items-center py-1.5 border-t-2 border-dashed border-ink/30 mt-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Status</span>
          <Tag tone={record.status === "paid" ? "ink" : "blood"}>{record.status}</Tag>
        </div>
        {record.status === "paid" && (
          <Row label="Receipt No." value={record.receiptNumber || "-"} mono />
        )}
        {record.collectedBy && (
          <Row label="Collected By" value={`${record.collectedBy}${record.collectedAt ? ` · ${record.collectedAt}` : ""}`} strong />
        )}
      </div>
      </div>
      <div className="px-6 pb-5 pt-3 border-t-2 border-ink flex items-center justify-between gap-2">
        <BrutalButton tone="ghost" onClick={onClose}>Close</BrutalButton>
        {record.status === "pending" && onPay ? (
          <BrutalButton tone="blood" onClick={() => onPay(record.id)}>Pay Now</BrutalButton>
        ) : printable && record.status === "paid" ? (
          <BrutalButton tone="ink" onClick={() => printElement("fee-receipt")}>
            <Printer className="w-4 h-4" /> Print
          </BrutalButton>
        ) : null}
      </div>
    </Overlay>
  );
}

/* ============================================================
   FEES · STRUCTURE / INSTALLMENT PAY / HISTORY MODALS
   ============================================================ */
export function FeeStructureModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: { id?: number; courseCode: string; courseName: string; semester: number; feeType: string; amount: string; dueDate: string }) => void;
  initialData?: FeeStructure | null;
  courses?: { code: string; name: string; semester: number }[];
}) {
  const [courseCode, setCourseCode] = useState(initialData?.courseCode || courses?.[0]?.code || "");
  const [courseName, setCourseName] = useState(initialData?.courseName || courses?.[0]?.name || "");
  const [semester, setSemester] = useState(String(initialData?.semester || courses?.[0]?.semester || 1));
  const [feeType, setFeeType] = useState(initialData?.feeType || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "2026-04-15");

  if (!isOpen) return null;
  const pickCourse = (code: string) => {
    const c = courses?.find((x) => x.code === code);
    setCourseCode(code);
    setCourseName(c?.name || code);
    setSemester(String(c?.semester || 1));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ id: initialData?.id, courseCode, courseName, semester: Number(semester || 1), feeType, amount, dueDate });
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={initialData ? "Edit Fee Structure" : "Add Fee Structure"} tag="FORM - FEE-09" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <Field label="Course">
          <select className={INPUT} value={courseCode} onChange={(e) => pickCourse(e.target.value)} required>
            {courses && courses.length > 0 ? (
              courses.map((c) => (
                <option key={c.code} value={c.code}>{c.code} · {c.name} (Sem {c.semester})</option>
              ))
            ) : (
              <option value={courseCode}>{courseCode || "No courses"}</option>
            )}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Semester">
            <input className={INPUT} type="number" min={1} value={semester} onChange={(e) => setSemester(e.target.value)} required />
          </Field>
          <Field label="Due Date">
            <input className={INPUT} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </Field>
        </div>
        <Field label="Fee Type">
          <select className={INPUT} value={feeType} onChange={(e) => setFeeType(e.target.value)} required>
            {Array.from(new Set([feeType || `Sem ${semester} Tuition`, "Semester Tuition", "Lab & Library Fee", "Development Fee", "Hostel Fee", "Exam Fee", "Other"])).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input className={INPUT} value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 48000" />
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="ink">{initialData ? "Update" : "Add Structure"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function FeePayModal({
  record,
  onClose,
  onPay,
}: {
  record: FeeRecord | null;
  onClose: () => void;
  onPay: (amount: number, method: string) => void;
}) {
  const remaining = record ? feeRemaining(record) : 0;
  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : "");
  const [method, setMethod] = useState("UPI");

  if (!record) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    onPay(Math.min(value, remaining), method);
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Pay Fees" tag="FORM - FEE-10" onClose={onClose} />
      <div className="p-5 space-y-4">
        {record && (
          <div className="border-2 border-ink bg-paper-3 hard p-4 space-y-1.5 text-sm">
            <p className="font-serif font-semibold text-ink">{record.feeType} {record.courseCode ? `· ${record.courseCode}` : ""}</p>
            <p className="font-mono text-[11px] text-muted">Due {record.dueDate} · Total ₹{Number(record.amount).toFixed(2)}</p>
            <p className="font-mono text-[11px] text-muted">Paid ₹{Number(record.paidAmount || 0).toFixed(2)} · Remaining <span className="text-blood font-bold">₹{remaining.toFixed(2)}</span></p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-3.5">
          <Field label={`Amount to pay (₹)`}>
            <input className={INPUT} type="number" step="0.01" min="1" max={remaining || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Payment Method">
            <select className={INPUT} value={method} onChange={(e) => setMethod(e.target.value)}>
              {["UPI", "Card", "NetBanking", "Cash", "Cheque", "Demand Draft"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
            <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
            <BrutalButton type="submit" tone="blood">Pay ₹{Number(amount || 0).toFixed(2)}</BrutalButton>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

export function FeeHistoryModal({
  isOpen,
  payments,
  onClose,
  title,
}: {
  isOpen: boolean;
  payments: FeePayment[];
  onClose: () => void;
  title?: string;
}) {
  if (!isOpen) return null;
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={title || "Payment History"} tag="HIST - FEE-11" onClose={onClose} />
      <div className="p-5">
        {payments.length === 0 ? (
          <EmptyState label="No payments yet" hint="Transactions appear here once an installment is settled." />
        ) : (
          <div className="overflow-x-auto border-2 border-ink">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 border-ink bg-paper-2">Date</th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 border-ink bg-paper-2">Amount</th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 border-ink bg-paper-2">Method</th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 border-ink bg-paper-2">Collected By</th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 border-ink bg-paper-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b-2 border-ink/10">
                    <td className="px-3 py-2 font-mono text-[11px]">{p.paidAt}</td>
                    <td className="px-3 py-2 font-mono font-bold text-ink">₹{Number(p.amount).toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted">{p.paymentMethod}</td>
                    <td className="px-3 py-2 font-serif text-xs">{p.collectedBy || "-"}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-blood">{p.receiptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-4">
          <BrutalButton tone="ghost" onClick={onClose}>Close</BrutalButton>
        </div>
      </div>
    </Overlay>
  );
}

/* ============================================================
   FACULTY / DEPARTMENT / TIMETABLE / PASSWORD MODALS
   ============================================================ */
export function FacultyModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: Partial<User>) => void;
  initialData?: User | null;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [empId, setEmpId] = useState(initialData?.rollNoOrEmpId || "");
  const [dept, setDept] = useState(initialData?.department || "BCA (CSJM)");
  const [designation, setDesignation] = useState(initialData?.designation || "Assistant Professor");
  const [phone, setPhone] = useState(initialData?.phone || "+91 11 4011 9000");

  if (!isOpen) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id,
      name,
      email,
      rollNoOrEmpId: empId.trim() || `FAC-${Math.floor(100 + Math.random() * 900)}`,
      department: dept,
      designation,
      phone,
    });
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={initialData ? "Edit Teacher" : "Add Teacher"} tag="FORM - TCH-03" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <Field label="Full Name">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Employee ID">
            <input className={INPUT} value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="auto e.g. FAC-102" />
          </Field>
        </div>
        <Field label="Department">
          <select className={INPUT} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option>BCA (CSJM)</option>
            <option>BCA (MCU)</option>
            <option>MBA</option>
            <option>BBA</option>
          </select>
        </Field>
        <Field label="Designation">
          <input className={INPUT} value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </Field>
        <Field label="Phone Number">
          <input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="blood">{initialData ? "Update" : "Add Teacher"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function DepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: { id?: number; code: string; name: string; headOfDepartment: string; location: string }) => void;
  initialData?: { id?: number; code?: string; name?: string; headOfDepartment?: string; location?: string | null } | null;
}) {
  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState(initialData?.name || "");
  const [hod, setHod] = useState(initialData?.headOfDepartment || "");
  const [location, setLocation] = useState(initialData?.location || "Main Campus");

  if (!isOpen) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ id: initialData?.id, code, name, headOfDepartment: hod, location });
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={initialData ? "Edit Department" : "Add Department"} tag="FORM - DEP-04" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code">
            <input className={INPUT} value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. BCA-CSJM" />
          </Field>
          <Field label="Location">
            <input className={INPUT} value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <Field label="Department Name">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Head of Department">
          <input className={INPUT} value={hod} onChange={(e) => setHod(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="ink">{initialData ? "Update" : "Add Department"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function TimetableModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: {
    id?: number;
    courseCode: string;
    courseName: string;
    department: string;
    semester: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    facultyName: string;
  }) => void;
  initialData?: {
    id?: number;
    courseCode?: string;
    courseName?: string;
    department?: string;
    semester?: number;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    facultyName?: string;
  } | null;
}) {
  const [code, setCode] = useState(initialData?.courseCode || "BCA101");
  const [name, setName] = useState(initialData?.courseName || "");
  const [dept, setDept] = useState(initialData?.department || "BCA (CSJM)");
  const [sem, setSem] = useState(initialData?.semester || 1);
  const [day, setDay] = useState(initialData?.dayOfWeek || "Monday");
  const [start, setStart] = useState(initialData?.startTime || "09:00 AM");
  const [end, setEnd] = useState(initialData?.endTime || "10:30 AM");
  const [room, setRoom] = useState(initialData?.room || "LT-Hall 1");
  const [faculty, setFaculty] = useState(initialData?.facultyName || "");

  if (!isOpen) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id,
      courseCode: code,
      courseName: name,
      department: dept,
      semester: Number(sem),
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      room,
      facultyName: faculty,
    });
  };
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={initialData ? "Edit Slot" : "Add Slot"} tag="FORM - TTM-05" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Code">
            <input className={INPUT} value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label="Semester">
            <input type="number" min={1} max={8} className={INPUT} value={sem} onChange={(e) => setSem(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Course Title">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Day">
          <select className={INPUT} value={day} onChange={(e) => setDay(e.target.value)}>
            {days.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <input className={INPUT} value={start} onChange={(e) => setStart(e.target.value)} required />
          </Field>
          <Field label="End">
            <input className={INPUT} value={end} onChange={(e) => setEnd(e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Room">
            <input className={INPUT} value={room} onChange={(e) => setRoom(e.target.value)} />
          </Field>
          <Field label="Faculty">
            <input className={INPUT} value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          </Field>
        </div>
        <Field label="Department">
          <select className={INPUT} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option>BCA (CSJM)</option>
            <option>BCA (MCU)</option>
            <option>MBA</option>
            <option>BBA</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="blood">{initialData ? "Save Changes" : "Add Slot"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Failed to update password");
      setCurrent("");
      setNext("");
      setConfirm("");
      onClose();
      onSuccess?.(b.message || "Password updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Change Password" tag="FORM - SEC-06" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-3.5">
        <Field label="Current Password">
          <input type="password" className={INPUT} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="New Password" hint="At least 8 characters">
          <input type="password" className={INPUT} value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {error && <p className="font-mono text-xs text-blood">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t-2 border-dashed border-ink/30">
          <BrutalButton tone="ghost" onClick={onClose}>Cancel</BrutalButton>
          <BrutalButton type="submit" tone="blood" disabled={busy}>{busy ? "Saving…" : "Update Password"}</BrutalButton>
        </div>
      </form>
    </Overlay>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-1 border-b border-ink/10">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <span
        className={`text-right ${mono ? "font-mono text-blood font-bold" : strong ? "font-display" : "font-serif"} ${
          accent ? "text-blood" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="sr-only">close</button>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, tag, onClose }: { title: string; tag: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60">{tag}</p>
        <h3 className="font-display uppercase text-base text-paper leading-none mt-0.5">{title}</h3>
      </div>
      <button onClick={onClose} className="border-2 border-paper p-1.5 hover:bg-blood hover:border-blood press">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// re-export an icon
export { ArrowUpRight };

