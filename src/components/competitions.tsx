"use client";

import { useState } from "react";
import {
  Trophy,
  Users,
  Code,
  Award,
  CheckCircle2,
  Lock,
  Plus,
  ExternalLink,
  GitBranch,
  FileText,
  Video,
  Star,
  QrCode,
  ShieldCheck,
  Search,
  ChevronRight,
  Eye,
  Send,
  UserPlus,
  AlertCircle,
  X,
  Play,
  Share2,
  Clock,
  Sparkles,
  Check,
  UserCheck,
  Building2,
  Layers,
  CheckSquare
} from "lucide-react";
import type {
  User,
  Competition,
  CompetitionTeam,
  CompetitionTeamMember,
  CompetitionSubmission,
  CompetitionEvaluation,
  CompetitionCertificate,
  LeaderboardEntry
} from "@/types/erp";
import {
  BrutalButton,
  Tag,
  Stamp,
  SectionTitle,
  EmptyState,
  Field,
  INPUT,
  Hazard
} from "@/components/shell";

interface CompetitionsProps {
  currentUser: User;
  students?: User[];
  competitions: Competition[];
  teams: CompetitionTeam[];
  submissions: CompetitionSubmission[];
  leaderboard: LeaderboardEntry[];
  certificates: CompetitionCertificate[];
  onCreateCompetition?: (comp: Partial<Competition>) => void;
  onCreateTeam?: (compId: number, teamName: string, memberIds: number[]) => void;
  onRespondInvite?: (teamId: number, accept: boolean) => void;
  onLockTeam?: (teamId: number) => void;
  onSubmitProject?: (sub: Partial<CompetitionSubmission>) => void;
  onEvaluate?: (evalData: Partial<CompetitionEvaluation>) => void;
  onCheckIn?: (compId: number) => void;
  onToggleLeaderboard?: (compId: number, published: boolean) => void;
  onFinalizeWinners?: (compId: number) => void;
}

function RectTag({ children, tone = "ink", className = "" }: { children: React.ReactNode; tone?: "ink" | "blood" | "paper" | "muted" | "outline"; className?: string }) {
  return (
    <Tag tone={tone} className={`!rounded-none font-mono ${className}`}>
      {children}
    </Tag>
  );
}

function RectButton({
  children,
  onClick,
  type = "button",
  tone = "blood",
  className = "",
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "blood" | "ink" | "paper" | "ghost";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <BrutalButton
      type={type}
      onClick={onClick}
      tone={tone}
      disabled={disabled}
      title={title}
      className={`!rounded-none font-mono uppercase tracking-wider ${className}`}
    >
      {children}
    </BrutalButton>
  );
}

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
      className={`lift relative border-2 border-ink p-4 hard overflow-hidden rounded-none ${
        dark ? "bg-ink text-paper" : "bg-paper text-ink"
      }`}
    >
      <span className="hazard absolute top-0 right-0 h-3 w-3 rounded-none" />
      <div className="flex items-start justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
            dark ? "text-paper/60" : "text-muted"
          }`}
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

function ScoreCounter({
  label,
  subLabel,
  value,
  max = 20,
  onChange,
}: {
  label: string;
  subLabel?: string;
  value: number;
  max?: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="border-2 border-ink bg-paper p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-none">
      <div>
        <div className="font-mono text-xs font-bold text-ink uppercase tracking-wider">{label}</div>
        {subLabel && <div className="font-serif italic text-[11px] text-muted">{subLabel}</div>}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border-2 border-ink bg-paper-3 rounded-none overflow-hidden">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="px-2.5 py-1 font-mono font-bold text-ink bg-paper hover:bg-ink hover:text-paper border-r-2 border-ink transition"
          >
            -
          </button>
          <input
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
            className="w-10 text-center font-mono font-bold text-xs bg-transparent text-blood focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="px-2.5 py-1 font-mono font-bold text-ink bg-paper hover:bg-ink hover:text-paper border-l-2 border-ink transition"
          >
            +
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {[12, 15, 18, 20].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-1.5 py-0.5 border border-ink transition ${
                value === preset ? "bg-blood text-paper font-bold" : "bg-paper-2 text-ink hover:bg-ink hover:text-paper"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompetitionsComponent({
  currentUser,
  students = [],
  competitions = [],
  teams = [],
  submissions = [],
  leaderboard = [],
  certificates = [],
  onCreateCompetition,
  onCreateTeam,
  onRespondInvite,
  onLockTeam,
  onSubmitProject,
  onEvaluate,
  onCheckIn,
  onToggleLeaderboard,
  onFinalizeWinners
}: CompetitionsProps) {
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [selectedComp, setSelectedComp] = useState<Competition | null>(competitions[0] || null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  const [showCreateCompModal, setShowCreateCompModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState<CompetitionCertificate | null>(null);

  // Form states for Create Competition
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<Competition["type"]>("Hackathon");
  const [newDesc, setNewDesc] = useState("");
  const [newCompDate, setNewCompDate] = useState("2026-04-15");
  const [newRegStart, setNewRegStart] = useState("2026-04-01");
  const [newRegEnd, setNewRegEnd] = useState("2026-04-10");
  const [newTeamSizeMin, setNewTeamSizeMin] = useState(2);
  const [newTeamSizeMax, setNewTeamSizeMax] = useState(4);
  const [newDept, setNewDept] = useState("All Departments");
  const [newRules, setNewRules] = useState("1. Build original software during event.\n2. Open source frameworks permitted.\n3. Zero plagiarism code policy.");
  const [newProblems, setNewProblems] = useState("Track 1: Smart Campus AI Assistant\nTrack 2: Automated Fee & Accounting Ledger\nTrack 3: Real-Time Access Gate");
  const [newPrizes, setNewPrizes] = useState("🥇 1st: ₹50,000 | 🥈 2nd: ₹30,000 | 🥉 3rd: ₹15,000");

  // Team creation & invite states
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Project submission form states
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [pptUrl, setPptUrl] = useState("");
  const [screenshotsUrl, setScreenshotsUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Judge dashboard state & local evaluations history
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(teams[0]?.id || null);
  const [scoreInnovation, setScoreInnovation] = useState(18);
  const [scoreTech, setScoreTech] = useState(18);
  const [scoreUiUx, setScoreUiUx] = useState(17);
  const [scoreImpact, setScoreImpact] = useState(18);
  const [scorePresentation, setScorePresentation] = useState(17);
  const [judgeRemarks, setJudgeRemarks] = useState("Outstanding architecture, clean execution & real-world utility!");

  const [evaluations, setEvaluations] = useState<CompetitionEvaluation[]>([
    {
      id: 1,
      competitionId: 1,
      teamId: 1,
      teamName: "Code Warriors",
      judgeId: currentUser.id,
      judgeName: currentUser.name || "Dr. Aris Thorne",
      scoreInnovation: 19,
      scoreTech: 19,
      scoreUiUx: 18,
      scoreImpact: 18,
      scorePresentation: 18,
      totalScore: 92,
      remarks: "Exceptional architecture with robust real-time synchronization!",
      evaluatedAt: "2026-08-23 02:30 PM"
    },
    {
      id: 2,
      competitionId: 1,
      teamId: 2,
      teamName: "Tech Titans",
      judgeId: currentUser.id,
      judgeName: currentUser.name || "Dr. Aris Thorne",
      scoreInnovation: 18,
      scoreTech: 17,
      scoreUiUx: 18,
      scoreImpact: 17,
      scorePresentation: 17,
      totalScore: 87,
      remarks: "Solid presentation and great practical utility across departments.",
      evaluatedAt: "2026-08-23 03:15 PM"
    }
  ]);
  const [showEvalSuccessModal, setShowEvalSuccessModal] = useState<CompetitionEvaluation | null>(null);

  const isStaff = currentUser.role === "admin" || currentUser.role === "faculty";
  const isStudent = currentUser.role === "student";

  // Filter competitions
  const filteredCompetitions = competitions.filter((c) => {
    if (selectedTypeFilter !== "all" && c.type !== selectedTypeFilter) return false;
    return true;
  });

  // Find user's pending invites
  const myPendingInvites = teams.flatMap((t) =>
    (t.members || [])
      .filter((m) => m.userId === currentUser.id && m.status === "invited")
      .map((m) => ({ team: t, member: m }))
  );

  // Find user's current team for the selected competition
  const myTeam = teams.find(
    (t) =>
      t.competitionId === selectedComp?.id &&
      (t.captainId === currentUser.id ||
        (t.members || []).some((m) => m.userId === currentUser.id && m.status === "accepted"))
  );

  // Find submission for selected team
  const selectedTeamSubmission = submissions.find((s) => s.teamId === selectedTeamId);

  const handleCreateCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCompetition?.({
      title: newTitle,
      type: newType,
      description: newDesc,
      compDate: newCompDate,
      regStart: newRegStart,
      regEnd: newRegEnd,
      teamSizeMin: Number(newTeamSizeMin),
      teamSizeMax: Number(newTeamSizeMax),
      eligibilityDept: newDept,
      rules: newRules,
      problemStatements: newProblems,
      prizes: newPrizes,
      submissionDeadline: newCompDate + " 18:00",
      isLeaderboardPublished: 0,
      status: "open"
    });
    setShowCreateCompModal(false);
    setNewTitle("");
  };

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !selectedComp || !isStudent) return;
    onCreateTeam?.(selectedComp.id, newTeamName, selectedMemberIds);
    setShowCreateTeamModal(false);
    setNewTeamName("");
    setSelectedMemberIds([]);
  };

  const handleSubmitProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !selectedComp || !isStudent) return;
    const targetTeam = myTeam || teams[0];
    onSubmitProject?.({
      competitionId: selectedComp.id,
      teamId: targetTeam ? targetTeam.id : 1,
      teamName: targetTeam ? targetTeam.teamName : "My Team",
      projectTitle: projTitle,
      description: projDesc,
      githubUrl,
      demoUrl,
      pptUrl,
      screenshotsUrl,
      videoUrl,
      isLocked: 1
    });
    setShowSubmitModal(false);
    setProjTitle("");
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp || !selectedTeamId) {
      alert("Please select a team from the roster before submitting an evaluation.");
      return;
    }
    const targetTeam = teams.find((t) => t.id === selectedTeamId);
    if (!targetTeam) return;

    const total = scoreInnovation + scoreTech + scoreUiUx + scoreImpact + scorePresentation;
    const newEvalRecord: CompetitionEvaluation = {
      id: Date.now(),
      competitionId: selectedComp.id,
      teamId: selectedTeamId,
      teamName: targetTeam.teamName,
      judgeId: currentUser.id,
      judgeName: currentUser.name,
      scoreInnovation,
      scoreTech,
      scoreUiUx,
      scoreImpact,
      scorePresentation,
      totalScore: total,
      remarks: judgeRemarks || "Evaluation recorded.",
      evaluatedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setEvaluations((prev) => [newEvalRecord, ...prev.filter((ev) => ev.teamId !== selectedTeamId)]);
    setShowEvalSuccessModal(newEvalRecord);

    onEvaluate?.({
      competitionId: selectedComp.id,
      teamId: selectedTeamId,
      judgeId: currentUser.id,
      judgeName: currentUser.name,
      scoreInnovation,
      scoreTech,
      scoreUiUx,
      scoreImpact,
      scorePresentation,
      totalScore: total,
      remarks: judgeRemarks
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner matching VSCMS Theme (100% Rectangular) */}
      <div className="border-2 border-ink bg-ink text-paper hard p-5 sm:p-6 rounded-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stamp className="!rounded-none">Module 14</Stamp>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-paper/70">Governance & Contests</span>
            </div>
            <h1 className="font-display uppercase text-2xl sm:text-3xl text-paper tracking-tight">Competitions & Hackathons</h1>
            <p className="font-serif italic text-xs sm:text-sm text-paper/80 mt-1 max-w-2xl">
              Create contests, manage student team rosters, submit project decks, score multi-criteria rubrics, publish leaderboards, & verify QR certificates.
            </p>
          </div>
          {isStaff && (
            <RectButton tone="blood" onClick={() => setShowCreateCompModal(true)}>
              <Plus className="w-4 h-4" /> Create Competition
            </RectButton>
          )}
        </div>
      </div>

      {/* KPI Overview Bar matching ERP Stat cards (Rectangular) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat mark="01" label="Total Events" value={competitions.length} foot="Active Contests" Icon={Trophy} />
        <Stat mark="02" label="Registered Teams" value={teams.length} foot="Team Roster" dark accent Icon={Users} />
        <Stat mark="03" label="Submissions" value={submissions.length} foot="Project Vault" Icon={Code} />
        <Stat mark="04" label="QR Certificates" value={certificates.length} foot="Issued Honors" Icon={Award} />
      </div>

      {/* Pending Invites Banner (Rectangular) - Only for Students */}
      {isStudent && myPendingInvites.length > 0 && (
        <div className="border-2 border-blood bg-paper-3 hard p-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blood shrink-0" />
            <div className="text-xs font-serif text-ink">
              <strong className="text-blood font-mono uppercase tracking-wider">Pending Team Invite:</strong> Team{" "}
              <strong className="underline">{myPendingInvites[0].team.teamName}</strong> has invited you to join their competition roster.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RectButton tone="blood" onClick={() => onRespondInvite?.(myPendingInvites[0].team.id, true)}>
              Accept Invite
            </RectButton>
            <RectButton tone="ghost" onClick={() => onRespondInvite?.(myPendingInvites[0].team.id, false)}>
              Decline
            </RectButton>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Rectangular) */}
      <div className="flex items-center gap-2 border-b-2 border-ink overflow-x-auto pb-1 text-xs">
        {[
          { id: "browse", label: "Browse Competitions" },
          { id: "teams", label: "Team & Invites" },
          { id: "submit", label: "Project Submissions" },
          ...(isStaff ? [{ id: "judge", label: "Judge Dashboard" }] : []),
          { id: "leaderboard", label: "Live Leaderboard" },
          { id: "attendance", label: "Verified Attendance & Certs" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              "px-4 py-2 font-mono font-bold uppercase tracking-wider border-2 border-ink transition rounded-none " +
              (activeTab === tab.id ? "bg-ink text-paper hard-sm" : "bg-paper text-ink hover:bg-paper-2")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BROWSE COMPETITIONS & PROBLEM STATEMENTS */}
      {activeTab === "browse" && (
        <div className="space-y-4">
          <div className="border-2 border-ink bg-paper p-3.5 hard flex items-center gap-2 overflow-x-auto text-xs rounded-none">
            <span className="font-mono font-bold uppercase text-muted">Filter Type:</span>
            {[
              "all",
              "Hackathon",
              "Coding Contest",
              "Quiz",
              "Case Competition",
              "Debate",
              "Presentation",
              "Business Plan",
              "Technical Competition"
            ].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={
                  "px-3 py-1 font-mono font-bold uppercase text-[11px] border-2 border-ink transition rounded-none " +
                  (selectedTypeFilter === type ? "bg-ink text-paper hard-sm" : "bg-paper text-ink hover:bg-paper-2")
                }
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetitions.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelectedComp(comp)}
                className={
                  "lift border-2 border-ink bg-paper-3 hard p-4 flex flex-col justify-between space-y-3 cursor-pointer rounded-none " +
                  (selectedComp?.id === comp.id ? "ring-2 ring-blood" : "")
                }
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <RectTag tone="ink">{comp.type}</RectTag>
                    <RectTag tone={comp.status === "ongoing" ? "blood" : "paper"}>{comp.status}</RectTag>
                  </div>
                  <h3 className="font-display uppercase text-base text-ink leading-snug">{comp.title}</h3>
                  <p className="font-serif text-xs text-ink/80 line-clamp-2 mt-1">{comp.description}</p>
                </div>

                <div className="space-y-2 border-t-2 border-dashed border-ink/20 pt-3 font-mono text-[11px]">
                  <div className="flex justify-between text-muted">
                    <span>Team Size:</span>
                    <strong className="text-ink font-bold">
                      {comp.teamSizeMin === comp.teamSizeMax
                        ? comp.teamSizeMin === 1
                          ? "Individual"
                          : `${comp.teamSizeMin} Members`
                        : `${comp.teamSizeMin}-${comp.teamSizeMax} Members`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Eligibility:</span>
                    <strong className="text-ink font-bold truncate max-w-[150px]">{comp.eligibilityDept}</strong>
                  </div>
                  <div className="flex items-center justify-between text-blood font-bold pt-1">
                    <span className="truncate">{comp.prizes || "Certificates & Medals"}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Competition Detailed View (Rectangular) */}
          {selectedComp && (
            <div className="border-2 border-ink bg-paper hard p-5 sm:p-6 space-y-4 rounded-none">
              <SectionTitle
                index={selectedComp.type}
                kicker={`Event Date: ${selectedComp.compDate}`}
                title={selectedComp.title}
                accent="Details"
                sub={`Registration Deadline: ${selectedComp.regEnd} | Submission Deadline: ${selectedComp.submissionDeadline}`}
                right={
                  isStudent ? (
                    !myTeam ? (
                      <RectButton tone="blood" onClick={() => setShowCreateTeamModal(true)}>
                        Form Team & Register
                      </RectButton>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RectTag tone="ink">Team: {myTeam.teamName}</RectTag>
                        <RectButton tone="blood" onClick={() => setShowSubmitModal(true)}>
                          Submit Project
                        </RectButton>
                      </div>
                    )
                  ) : (
                    <RectTag tone="ink">Judge / Organizer Mode</RectTag>
                  )
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-ink bg-paper-3 p-4 space-y-2 rounded-none">
                  <h4 className="font-mono text-xs uppercase font-bold text-blood flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Problem Statements & Tracks
                  </h4>
                  <pre className="font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed">
                    {selectedComp.problemStatements || "Problem statements will be released at the event start."}
                  </pre>
                </div>

                <div className="border-2 border-ink bg-paper-3 p-4 space-y-2 rounded-none">
                  <h4 className="font-mono text-xs uppercase font-bold text-blood flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Rules & Evaluation Criteria
                  </h4>
                  <div className="space-y-2 text-xs font-serif text-ink">
                    <p className="whitespace-pre-wrap font-mono">{selectedComp.rules}</p>
                    <div className="pt-2 border-t-2 border-dashed border-ink/20 font-bold text-blood font-mono">
                      Rubric: {selectedComp.evaluationCriteria || "Innovation (20), Tech (20), UI/UX (20), Impact (20), Presentation (20)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM MANAGEMENT & INVITES */}
      {activeTab === "teams" && (
        <div className="space-y-4">
          <SectionTitle
            kicker="Roster Governance"
            title="Registered"
            accent="Teams"
            sub="Student team rosters, member invitations, & locked rosters."
            right={
              isStudent && selectedComp ? (
                <RectButton tone="blood" onClick={() => setShowCreateTeamModal(true)}>
                  + Form New Team
                </RectButton>
              ) : undefined
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => {
              const isCaptain = t.captainId === currentUser.id;
              return (
                <div key={t.id} className="lift border-2 border-ink bg-paper hard p-5 space-y-4 rounded-none">
                  <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                    <div>
                      <h4 className="font-display uppercase text-lg text-ink">{t.teamName}</h4>
                      <p className="font-mono text-[11px] text-muted">Captain: <strong className="text-ink">{t.captainName}</strong></p>
                    </div>
                    <div>
                      {t.isLocked ? (
                        <RectTag tone="paper">Locked</RectTag>
                      ) : isCaptain ? (
                        <RectButton tone="blood" className="!py-1 !px-2.5 !text-[10px]" onClick={() => onLockTeam?.(t.id)}>
                          Lock Roster
                        </RectButton>
                      ) : (
                        <RectTag tone="ink">Open Roster</RectTag>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">Roster Members</span>
                    <div className="space-y-1.5">
                      {(t.members || []).map((m) => (
                        <div key={m.id} className="flex items-center justify-between border-2 border-ink bg-paper-3 px-3 py-2 text-xs rounded-none">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-ink">{m.userName}</span>
                            <span className="text-[10px] text-muted capitalize">({m.roleInTeam})</span>
                          </div>
                          <RectTag tone={m.status === "accepted" ? "ink" : m.status === "declined" ? "paper" : "blood"}>
                            {m.status}
                          </RectTag>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT SUBMISSIONS */}
      {activeTab === "submit" && (
        <div className="space-y-4">
          <SectionTitle
            kicker="Code & Artifact Vault"
            title="Project"
            accent="Submissions"
            sub="Submitted GitHub repository, live demo, presentation deck, & video walkthroughs."
            right={
              isStudent ? (
                <RectButton tone="blood" onClick={() => setShowSubmitModal(true)}>
                  + Submit Project Deck
                </RectButton>
              ) : undefined
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="lift border-2 border-ink bg-paper hard p-5 space-y-4 rounded-none">
                <div className="flex items-center justify-between border-b-2 border-ink pb-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-blood block">Team: {sub.teamName}</span>
                    <h4 className="font-display uppercase text-lg text-ink mt-0.5">{sub.projectTitle}</h4>
                  </div>
                  <RectTag tone="ink">Locked Submission</RectTag>
                </div>

                <p className="font-serif text-sm text-ink/80 leading-relaxed">{sub.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                  {sub.githubUrl && (
                    <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="p-2 border-2 border-ink bg-paper-3 hover:bg-ink hover:text-paper transition flex items-center gap-1.5 font-bold rounded-none">
                      <GitBranch className="w-3.5 h-3.5" /> GitHub Repo
                    </a>
                  )}
                  {sub.demoUrl && (
                    <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="p-2 border-2 border-ink bg-paper-3 hover:bg-ink hover:text-paper transition flex items-center gap-1.5 font-bold rounded-none">
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                  {sub.pptUrl && (
                    <a href={sub.pptUrl} target="_blank" rel="noreferrer" className="p-2 border-2 border-ink bg-paper-3 hover:bg-ink hover:text-paper transition flex items-center gap-1.5 font-bold rounded-none">
                      <FileText className="w-3.5 h-3.5" /> Presentation PDF
                    </a>
                  )}
                  {sub.videoUrl && (
                    <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="p-2 border-2 border-ink bg-paper-3 hover:bg-ink hover:text-paper transition flex items-center gap-1.5 font-bold rounded-none">
                      <Video className="w-3.5 h-3.5" /> Video Pitch
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HIGH-DENSITY COMPACT JUDGE DASHBOARD */}
      {activeTab === "judge" && isStaff && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Panel: Compact Team Selector */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider flex items-center justify-between border-b-2 border-ink pb-1">
                <span>Select Team to Score</span>
                <span className="text-blood font-bold">{teams.length} Teams</span>
              </div>
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {teams.map((t) => {
                  const isSelected = selectedTeamId === t.id;
                  const sub = submissions.find((s) => s.teamId === t.id);
                  const evalRec = evaluations.find((ev) => ev.teamId === t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        if (evalRec) {
                          setScoreInnovation(evalRec.scoreInnovation);
                          setScoreTech(evalRec.scoreTech);
                          setScoreUiUx(evalRec.scoreUiUx);
                          setScoreImpact(evalRec.scoreImpact);
                          setScorePresentation(evalRec.scorePresentation);
                          setJudgeRemarks(evalRec.remarks || "");
                        }
                      }}
                      className={
                        "w-full text-left p-3.5 border-2 border-ink transition cursor-pointer rounded-none space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blood " +
                        (isSelected ? "bg-ink text-paper hard-sm" : "bg-paper text-ink hover:bg-paper-2")
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display uppercase text-sm font-bold">{t.teamName}</span>
                        {evalRec ? (
                          <RectTag tone="blood">Scored: {evalRec.totalScore}/100</RectTag>
                        ) : sub ? (
                          <RectTag tone={isSelected ? "paper" : "ink"}>Submitted</RectTag>
                        ) : (
                          <RectTag tone="paper">Pending</RectTag>
                        )}
                      </div>
                      <p className="font-serif italic text-xs opacity-80 truncate">
                        {sub ? sub.projectTitle : "Project deck pending..."}
                      </p>
                      {isSelected ? (
                        <div className="text-[10px] font-mono text-blood font-bold flex items-center gap-1 pt-1 border-t border-paper/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Currently Evaluating
                        </div>
                      ) : (
                        sub && (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] opacity-70 pt-0.5">
                            {sub.githubUrl && <span>GitHub</span>}
                            {sub.demoUrl && <span>• Demo</span>}
                            {sub.pptUrl && <span>• Deck</span>}
                          </div>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Compact Rubric Console */}
            <div className="lg:col-span-2 border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-4 rounded-none">
              {!selectedTeamId ? (
                <EmptyState
                  label="No Team Selected for Evaluation"
                  hint="Please click any team card from the left panel to load its submission deck and rubric scoring form."
                />
              ) : (
                <>
                  {/* Quick Artifact Inspector Header */}
                  {selectedTeamSubmission ? (
                    <div className="border-2 border-ink bg-paper-3 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono rounded-none">
                      <div>
                        <span className="text-[10px] text-muted block uppercase">Selected Team Deck</span>
                        <span className="font-bold text-ink">{selectedTeamSubmission.projectTitle}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {selectedTeamSubmission.githubUrl && (
                          <a href={selectedTeamSubmission.githubUrl} target="_blank" rel="noreferrer" className="px-2 py-1 border border-ink bg-paper hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                            <GitBranch className="w-3 h-3" /> Code Repo
                          </a>
                        )}
                        {selectedTeamSubmission.demoUrl && (
                          <a href={selectedTeamSubmission.demoUrl} target="_blank" rel="noreferrer" className="px-2 py-1 border border-ink bg-paper hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Live Demo
                          </a>
                        )}
                        {selectedTeamSubmission.pptUrl && (
                          <a href={selectedTeamSubmission.pptUrl} target="_blank" rel="noreferrer" className="px-2 py-1 border border-ink bg-paper hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                            <FileText className="w-3 h-3" /> PPT Deck
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border-2 border-dashed border-ink/40 font-mono text-xs text-muted text-center">
                      Project deck pending for this team. You can still evaluate using the rubric below.
                    </div>
                  )}

                  <form onSubmit={handleSaveEvaluation} className="space-y-3.5 text-xs">
                    <div className="space-y-2 border-2 border-ink bg-paper-3 p-3 rounded-none">
                      <ScoreCounter label="1. Innovation & Originality" subLabel="Novelty of concept, problem solving approach" value={scoreInnovation} onChange={setScoreInnovation} />
                      <ScoreCounter label="2. Technical Implementation" subLabel="Architecture code cleanliness & stack complexity" value={scoreTech} onChange={setScoreTech} />
                      <ScoreCounter label="3. UI / UX & Design Polish" subLabel="Visual aesthetics usability & layout responsiveness" value={scoreUiUx} onChange={setScoreUiUx} />
                      <ScoreCounter label="4. Impact & Utility" subLabel="Real-world scalability & practical value" value={scoreImpact} onChange={setScoreImpact} />
                      <ScoreCounter label="5. Presentation & Pitch" subLabel="Communication clarity, demo deck & Q&A defense" value={scorePresentation} onChange={setScorePresentation} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <Field label="Judge Remarks & Feedback">
                          <input type="text" placeholder="Enter judge feedback..." className={`${INPUT} rounded-none`} value={judgeRemarks} onChange={(e) => setJudgeRemarks(e.target.value)} />
                        </Field>
                      </div>

                      <div className="border-2 border-ink bg-ink text-paper p-2.5 flex items-center justify-between rounded-none">
                        <div>
                          <span className="font-mono text-[9px] uppercase text-paper/60 block">Total Score</span>
                          <span className="font-display text-xl text-blood font-bold">
                            {scoreInnovation + scoreTech + scoreUiUx + scoreImpact + scorePresentation} / 100
                          </span>
                        </div>
                        <RectButton type="submit" tone="blood" disabled={!selectedTeamId} className="!py-1.5 !px-3 !text-[11px]">
                          Submit Score
                        </RectButton>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* RECORDED EVALUATIONS HISTORY CARD */}
          {evaluations.length > 0 && (
            <div className="border-2 border-ink bg-paper hard p-4 sm:p-5 space-y-3 rounded-none">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-blood tracking-widest block">Audit Trail</span>
                  <h4 className="font-display uppercase text-base text-ink flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blood" /> Recorded Judge Evaluations ({evaluations.length})
                  </h4>
                </div>
                <RectTag tone="ink">Saved to Leaderboard</RectTag>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluations.map((ev) => {
                  const sub = submissions.find((s) => s.teamId === ev.teamId);
                  return (
                    <div key={ev.id} className="lift border-2 border-ink bg-paper-3 p-3.5 space-y-2.5 rounded-none">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display text-base uppercase text-ink font-bold block">{ev.teamName}</span>
                          <span className="font-mono text-[10px] text-muted">Evaluated by: {ev.judgeName}</span>
                        </div>
                        <RectTag tone="blood">Score: {ev.totalScore} / 100</RectTag>
                      </div>

                      {/* Submitted Project & Artifact Links */}
                      {sub && (
                        <div className="border-2 border-ink bg-paper p-2 space-y-1 rounded-none font-mono text-xs">
                          <div className="flex items-center justify-between text-[10px] text-muted uppercase font-bold">
                            <span>Project:</span>
                            <span className="text-ink font-bold truncate max-w-[200px]">{sub.projectTitle}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-dashed border-ink/20">
                            {sub.githubUrl && (
                              <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 border border-ink bg-paper-3 hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                                <GitBranch className="w-3 h-3 text-blood" /> GitHub
                              </a>
                            )}
                            {sub.demoUrl && (
                              <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 border border-ink bg-paper-3 hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                                <ExternalLink className="w-3 h-3 text-blood" /> Live Demo
                              </a>
                            )}
                            {sub.pptUrl && (
                              <a href={sub.pptUrl} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 border border-ink bg-paper-3 hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blood" /> PPT Deck
                              </a>
                            )}
                            {sub.videoUrl && (
                              <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 border border-ink bg-paper-3 hover:bg-ink hover:text-paper font-bold transition flex items-center gap-1">
                                <Video className="w-3 h-3 text-blood" /> Video Pitch
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="font-serif italic text-xs text-ink/80 border-t border-dashed border-ink/20 pt-1.5">
                        "{ev.remarks}"
                      </p>

                      <div className="font-mono text-[10px] text-muted pt-1 flex items-center justify-between border-t border-ink/10">
                        <span>Inn:{ev.scoreInnovation} | Tech:{ev.scoreTech} | UI:{ev.scoreUiUx} | Imp:{ev.scoreImpact} | Pitch:{ev.scorePresentation}</span>
                        <span className="font-bold text-blood">{ev.evaluatedAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LIVE LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="border-2 border-ink bg-ink text-paper hard p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-none">
            <div>
              <span className="font-mono text-[10px] uppercase text-blood font-bold tracking-widest block">Official Standings</span>
              <h3 className="font-display uppercase text-xl text-paper">Competition Leaderboard</h3>
              <p className="font-serif italic text-xs text-paper/75 mt-0.5">Real-time averaged scores submitted by the judging panel.</p>
            </div>

            {isStaff && selectedComp && (
              <div className="flex items-center gap-2">
                <RectButton
                  tone={selectedComp.isLeaderboardPublished ? "paper" : "blood"}
                  onClick={() => onToggleLeaderboard?.(selectedComp.id, selectedComp.isLeaderboardPublished ? false : true)}
                >
                  {selectedComp.isLeaderboardPublished ? "Hide Leaderboard" : "Publish Leaderboard"}
                </RectButton>
                <RectButton tone="blood" onClick={() => onFinalizeWinners?.(selectedComp.id)}>
                  Finalize & Issue Certs
                </RectButton>
              </div>
            )}
          </div>

          {selectedComp && !selectedComp.isLeaderboardPublished && !isStaff ? (
            <EmptyState
              label="Leaderboard Under Judge Evaluation"
              hint="Judges are reviewing submissions and evaluating scores. Results will be published shortly."
            />
          ) : (
            <div className="border-2 border-ink overflow-x-auto bg-paper rounded-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink text-paper font-mono text-[10px] uppercase tracking-[0.18em]">
                    <th className="p-3 text-left">Rank</th>
                    <th className="p-3 text-left">Team Name</th>
                    <th className="p-3 text-left">Project Title</th>
                    <th className="p-3 text-center">Judges</th>
                    <th className="p-3 text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.teamId} className="border-b-2 border-ink/10 hover:bg-paper-2 font-mono">
                      <td className="p-3 font-bold">
                        {entry.rank === 1 ? (
                          <RectTag tone="blood">🥇 1st Place</RectTag>
                        ) : entry.rank === 2 ? (
                          <RectTag tone="ink">🥈 2nd Place</RectTag>
                        ) : entry.rank === 3 ? (
                          <RectTag tone="muted">🥉 3rd Place</RectTag>
                        ) : (
                          <span>#{entry.rank}</span>
                        )}
                      </td>
                      <td className="p-3 font-serif font-bold text-ink">{entry.teamName}</td>
                      <td className="p-3 text-muted">{entry.projectTitle}</td>
                      <td className="p-3 text-center text-muted">{entry.judgeCount} Judges</td>
                      <td className="p-3 text-right font-display text-base text-blood font-bold">
                        {entry.score} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VERIFIED ATTENDANCE & DIGITAL CERTIFICATES */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* 4-State Pipeline Stepper (Rectangular) */}
          <div className="border-2 border-ink bg-paper hard p-5 space-y-4 rounded-none">
            <SectionTitle
              kicker="Audit Trail"
              title="4-State Attendance"
              accent="Pipeline"
              sub="Registration ≠ Attendance ≠ Submission ≠ Winner (State Separation)"
              right={
                selectedComp ? (
                  <RectButton tone="blood" onClick={() => onCheckIn?.(selectedComp.id)}>
                    Verify Venue Check-in
                  </RectButton>
                ) : undefined
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border-2 border-ink bg-paper-3 p-3.5 space-y-1 rounded-none">
                <span className="font-mono text-[10px] uppercase font-bold text-ink flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-blood" /> 1. Registration
                </span>
                <p className="font-serif text-xs text-muted">Team roster created & verified.</p>
              </div>

              <div className="border-2 border-ink bg-paper-3 p-3.5 space-y-1 rounded-none">
                <span className="font-mono text-[10px] uppercase font-bold text-ink flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blood" /> 2. Venue Check-in
                </span>
                <p className="font-serif text-xs text-muted">QR physical check-in verified.</p>
              </div>

              <div className="border-2 border-ink bg-paper-3 p-3.5 space-y-1 rounded-none">
                <span className="font-mono text-[10px] uppercase font-bold text-ink flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-blood" /> 3. Code Submission
                </span>
                <p className="font-serif text-xs text-muted">Project code & deck locked.</p>
              </div>

              <div className="border-2 border-ink bg-paper-3 p-3.5 space-y-1 rounded-none">
                <span className="font-mono text-[10px] uppercase font-bold text-ink flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blood" /> 4. Award Certificate
                </span>
                <p className="font-serif text-xs text-muted">Evaluated & QR certificate issued.</p>
              </div>
            </div>
          </div>

          {/* Digital Certificates Gallery (Rectangular) */}
          <div className="space-y-4">
            <SectionTitle kicker="Verified Honors" title="Digital QR" accent="Certificates" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="lift border-2 border-ink bg-ink text-paper hard p-5 space-y-4 rounded-none">
                  <div className="flex items-center justify-between border-b border-paper/20 pb-2">
                    <RectTag tone="blood">{cert.certType.replace("_", " ")}</RectTag>
                    <span className="font-mono text-[10px] text-paper/70">{cert.certCode}</span>
                  </div>

                  <div>
                    <h4 className="font-display uppercase text-base text-paper">{cert.competitionTitle}</h4>
                    <p className="font-serif text-xs text-paper/80 mt-1">
                      Awarded to: <strong className="text-paper">{cert.userName}</strong> ({cert.teamName || "Individual"})
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-paper/20">
                    <span className="font-mono text-[10px] text-paper/50">Issued: {cert.issuedAt}</span>
                    <RectButton tone="paper" className="!py-1 !px-2.5 !text-[11px]" onClick={() => setShowCertModal(cert)}>
                      <QrCode className="w-3.5 h-3.5" /> View Printable Cert
                    </RectButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE COMPETITION (Rectangular & Overflow-Hidden) */}
      {showCreateCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-[2px]">
          <div className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-lg rounded-none overflow-hidden">
            <Hazard className="h-2" />
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
              <h3 className="font-display uppercase text-base text-paper">Create Competition Event</h3>
              <button onClick={() => setShowCreateCompModal(false)} className="text-paper hover:text-blood">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} className="p-5 space-y-3.5 text-xs">
              <Field label="Competition Title">
                <input type="text" required placeholder="e.g. VSCMS National Hackathon 2026" className={`${INPUT} rounded-none`} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Competition Type">
                  <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className={`${INPUT} rounded-none`}>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding Contest">Coding Contest</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Case Competition">Case Competition</option>
                    <option value="Debate">Debate</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Business Plan">Business Plan</option>
                    <option value="Technical Competition">Technical Competition</option>
                  </select>
                </Field>
                <Field label="Eligibility Dept">
                  <input type="text" className={`${INPUT} rounded-none`} value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Reg Start Date"><input type="date" className={`${INPUT} rounded-none`} value={newRegStart} onChange={(e) => setNewRegStart(e.target.value)} /></Field>
                <Field label="Reg End Date"><input type="date" className={`${INPUT} rounded-none`} value={newRegEnd} onChange={(e) => setNewRegEnd(e.target.value)} /></Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Event Date"><input type="date" className={`${INPUT} rounded-none`} value={newCompDate} onChange={(e) => setNewCompDate(e.target.value)} /></Field>
                <Field label="Min Team"><input type="number" min="1" className={`${INPUT} rounded-none`} value={newTeamSizeMin} onChange={(e) => setNewTeamSizeMin(Number(e.target.value))} /></Field>
                <Field label="Max Team"><input type="number" min="1" className={`${INPUT} rounded-none`} value={newTeamSizeMax} onChange={(e) => setNewTeamSizeMax(Number(e.target.value))} /></Field>
              </div>

              <Field label="Prizes & Rewards">
                <input type="text" className={`${INPUT} rounded-none`} value={newPrizes} onChange={(e) => setNewPrizes(e.target.value)} />
              </Field>

              <Field label="Problem Statements & Tracks">
                <textarea rows={3} className={`${INPUT} rounded-none`} value={newProblems} onChange={(e) => setNewProblems(e.target.value)} />
              </Field>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-dashed border-ink/30">
                <RectButton tone="ghost" onClick={() => setShowCreateCompModal(false)}>Cancel</RectButton>
                <RectButton type="submit" tone="blood"><Plus className="w-4 h-4" /> Publish Contest</RectButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE TEAM (Rectangular & Overflow-Hidden) */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-[2px]">
          <div className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-md rounded-none overflow-hidden">
            <Hazard className="h-2" />
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
              <h3 className="font-display uppercase text-base text-paper">Form Team & Invite Members</h3>
              <button onClick={() => setShowCreateTeamModal(false)} className="text-paper hover:text-blood">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="p-5 space-y-3.5 text-xs">
              <Field label="Team Name">
                <input type="text" required placeholder="e.g. Code Warriors" className={`${INPUT} rounded-none`} value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
              </Field>

              <Field label="Invite Team Members">
                <div className="max-h-36 overflow-y-auto space-y-1 border-2 border-ink bg-paper-3 p-2 rounded-none">
                  {students
                    .filter((s) => s.id !== currentUser.id)
                    .map((stu) => {
                      const isSelected = selectedMemberIds.includes(stu.id);
                      return (
                        <div
                          key={stu.id}
                          onClick={() =>
                            setSelectedMemberIds((prev) =>
                              isSelected ? prev.filter((id) => id !== stu.id) : [...prev, stu.id]
                            )
                          }
                          className={
                            "flex items-center justify-between p-2 cursor-pointer font-mono text-xs transition rounded-none " +
                            (isSelected ? "bg-ink text-paper font-bold" : "hover:bg-paper-2 text-ink")
                          }
                        >
                          <div>
                            <div>{stu.name}</div>
                            <div className="text-[10px] opacity-75">{stu.department || "Student"}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blood" />}
                        </div>
                      );
                    })}
                </div>
              </Field>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-dashed border-ink/30">
                <RectButton tone="ghost" onClick={() => setShowCreateTeamModal(false)}>Cancel</RectButton>
                <RectButton type="submit" tone="blood">Create & Dispatch Invites</RectButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROJECT SUBMISSION (Rectangular & Overflow-Hidden) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-[2px]">
          <div className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-lg rounded-none overflow-hidden">
            <Hazard className="h-2" />
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
              <h3 className="font-display uppercase text-base text-paper">Submit Hackathon Project</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-paper hover:text-blood">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProjectForm} className="p-5 space-y-3.5 text-xs">
              <Field label="Project Title">
                <input type="text" required placeholder="e.g. Smart Campus AI Assistant" className={`${INPUT} rounded-none`} value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
              </Field>

              <Field label="Description">
                <textarea rows={2} required placeholder="Summary of solution..." className={`${INPUT} rounded-none`} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="GitHub Repository URL">
                  <input type="url" placeholder="https://github.com/..." className={`${INPUT} rounded-none`} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                </Field>
                <Field label="Live Demo URL">
                  <input type="url" placeholder="https://demo.vscms.edu" className={`${INPUT} rounded-none`} value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="PPT / PDF Presentation">
                  <input type="url" placeholder="https://vscms.edu/deck.pdf" className={`${INPUT} rounded-none`} value={pptUrl} onChange={(e) => setPptUrl(e.target.value)} />
                </Field>
                <Field label="Video Demo Link">
                  <input type="url" placeholder="https://youtube.com/..." className={`${INPUT} rounded-none`} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-dashed border-ink/30">
                <RectButton tone="ghost" onClick={() => setShowSubmitModal(false)}>Cancel</RectButton>
                <RectButton type="submit" tone="blood"><Send className="w-4 h-4" /> Submit & Lock</RectButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE CERTIFICATE (Rectangular & Overflow-Hidden) */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-[2px]">
          <div className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-lg text-center relative rounded-none overflow-hidden">
            <Hazard className="h-2" />
            <button onClick={() => setShowCertModal(null)} className="absolute top-4 right-4 text-ink hover:text-blood">
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-4 border-ink bg-paper-3 space-y-3 m-4 rounded-none">
              <Award className="w-12 h-12 text-blood mx-auto" />
              <div className="font-mono text-[10px] uppercase font-bold text-blood tracking-[0.2em]">Official VSCMS Certificate of Excellence</div>
              <h2 className="font-display uppercase text-xl text-ink leading-tight">{showCertModal.competitionTitle}</h2>
              <div className="py-2 border-y-2 border-ink/20">
                <p className="font-serif text-xs text-muted">Presented to</p>
                <p className="font-display text-2xl text-blood">{showCertModal.userName}</p>
                <p className="font-mono text-xs text-ink">Team: {showCertModal.teamName || "Individual"}</p>
              </div>
              <div className="font-mono text-[10px] text-muted flex justify-between">
                <span>Code: <strong>{showCertModal.certCode}</strong></span>
                <span>Issued: {showCertModal.issuedAt}</span>
              </div>
            </div>

            <div className="p-3 border-2 border-ink bg-paper-3 text-left font-mono text-xs mx-4 rounded-none">
              <span className="text-[10px] text-muted block uppercase">QR Verification Payload</span>
              <span className="text-blood font-bold break-all">{showCertModal.qrPayload}</span>
            </div>

            <div className="flex gap-2 p-4 pt-4">
              <RectButton tone="ink" className="flex-1" onClick={() => window.print()}>
                Print Certificate
              </RectButton>
              <RectButton tone="blood" className="flex-1" onClick={() => setShowCertModal(null)}>
                Close
              </RectButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EVALUATION SAVED CONFIRMATION CARD */}
      {showEvalSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-[2px]">
          <div className="pop-in bg-paper border-2 border-ink hard-lg w-full max-w-md space-y-4 rounded-none overflow-hidden text-left">
            <Hazard className="h-2" />
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-ink text-paper">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blood" />
                <h3 className="font-display uppercase text-base text-paper">Evaluation Saved Successfully</h3>
              </div>
              <button onClick={() => setShowEvalSuccessModal(null)} className="text-paper hover:text-blood">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="border-2 border-ink bg-paper-3 p-4 space-y-2 rounded-none">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Evaluated Team</span>
                    <h4 className="font-display text-lg text-ink uppercase">{showEvalSuccessModal.teamName}</h4>
                  </div>
                  <RectTag tone="blood">Score: {showEvalSuccessModal.totalScore} / 100</RectTag>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t-2 border-dashed border-ink/20">
                  <div>Innovation: <strong className="text-blood">{showEvalSuccessModal.scoreInnovation}/20</strong></div>
                  <div>Tech Stack: <strong className="text-blood">{showEvalSuccessModal.scoreTech}/20</strong></div>
                  <div>UI / UX: <strong className="text-blood">{showEvalSuccessModal.scoreUiUx}/20</strong></div>
                  <div>Impact: <strong className="text-blood">{showEvalSuccessModal.scoreImpact}/20</strong></div>
                  <div className="col-span-2">Presentation: <strong className="text-blood">{showEvalSuccessModal.scorePresentation}/20</strong></div>
                </div>
              </div>

              <div className="border-2 border-ink bg-paper p-3 text-xs italic font-serif rounded-none">
                <strong className="font-mono text-[10px] uppercase text-muted block not-italic">Judge Feedback:</strong>
                "{showEvalSuccessModal.remarks}"
              </div>

              <div className="flex justify-end pt-2">
                <RectButton tone="blood" onClick={() => setShowEvalSuccessModal(null)}>
                  Done & Continue Judging
                </RectButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
