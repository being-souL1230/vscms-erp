// VSCMS - College of Management Studies
// Clean database configuration with strictly 1 Admin user and no dummy data.
import type {
  User,
  Competition,
  CompetitionTeam,
  CompetitionSubmission,
  CompetitionEvaluation,
  CompetitionCertificate,
  LeaderboardEntry,
} from "@/types/erp";

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Prof. (Dr.) Gauri Singh Gaur",
    email: "director@vscms.edu",
    role: "admin",
    subRole: "dean",
    rollNo: "1",
    rollNoOrEmpId: "1",
    department: "Office of the Director",
    designation: "Director & Dean, VSCMS",
    phone: "+91 11 4011 9001",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80",
    status: "active",
  },
];

export const initialDepartments: any[] = [];
export const initialCourses: any[] = [];
export const initialNotices: any[] = [];
export const initialAttendance: any[] = [];
export const initialInternalMarks: any[] = [];
export const initialFees: any[] = [];
export const initialAdmissions: any[] = [];
export const initialDocuments: any[] = [];
export const initialCourseMaterials: any[] = [];
export const initialAuditLogs: any[] = [];
export const initialCampusEvents: any[] = [];
export const initialEventRegistrations: any[] = [];
export const initialCompetitions: Competition[] = [];
export const initialCompetitionTeams: CompetitionTeam[] = [];
export const initialCompetitionSubmissions: CompetitionSubmission[] = [];
export const initialLeaderboard: LeaderboardEntry[] = [];
export const initialCertificates: CompetitionCertificate[] = [];
