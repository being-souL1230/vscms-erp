/**
 * Data adapter service - transforms raw API responses into the format
 * that mobile screens expect. This bridges the gap between the ASP.NET
 * backend response format and what our React Native screens consume.
 */

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Transform raw attendance array into subject-wise grouped data
 * with overall stats for the AcademicsScreen.
 */
export const transformAttendance = (attendanceRecords, courses) => {
  if (!Array.isArray(attendanceRecords)) return { overall: null, subjects: [] };

  // Group by course
  const courseMap = {};
  attendanceRecords.forEach((record) => {
    const key = record.courseId || record.course_id;
    if (!courseMap[key]) {
      const course = courses?.find(c => c.id === key);
      courseMap[key] = {
        id: key,
        subject: {
          id: key,
          name: record.courseName || record.course_name || course?.name || 'Unknown',
          code: record.courseCode || record.course_code || course?.code || '',
        },
        attended: 0,
        total: 0,
        records: [],
      };
    }
    courseMap[key].total++;
    if (record.status === 'present') courseMap[key].attended++;
    courseMap[key].records.push(record);
  });

  const subjects = Object.values(courseMap).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    attended_classes: s.attended,
    total_classes: s.total,
    classes_missed: s.total - s.attended,
  }));

  // Overall stats
  const totalClasses = subjects.reduce((sum, s) => sum + s.total_classes, 0);
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended_classes, 0);
  const overall = {
    total_classes: totalClasses,
    attended_classes: totalAttended,
    classes_missed: totalClasses - totalAttended,
    percentage: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0,
    is_below_threshold: totalClasses > 0 && (totalAttended / totalClasses) < 0.75,
  };

  return { overall, subjects };
};

/**
 * Transform assignments response into screen-friendly format.
 * Backend returns { assignments: [...], submissions: [...] }
 */
export const transformAssignments = (data) => {
  if (!data) return [];

  const assignments = Array.isArray(data.assignments) ? data.assignments : Array.isArray(data) ? data : [];
  const submissions = Array.isArray(data.submissions) ? data.submissions : [];

  return assignments.map((a) => {
    const mySubmission = submissions.find(
      (s) => s.assignmentId === a.id || s.assignment_id === a.id
    );
    return {
      ...a,
      subject: {
        id: a.courseId || a.course_id,
        name: a.courseName || a.course_name || 'Unknown Course',
        code: '',
      },
      status: mySubmission
        ? mySubmission.status === 'graded' ? 'graded' : 'submitted'
        : 'pending',
      submission: mySubmission || null,
      due_date: a.dueDate || a.due_date,
      created_at: a.createdAt || a.created_at,
      author_name: a.facultyName || a.faculty_name || '',
    };
  });
};

/**
 * Transform a single assignment detail for AssignmentDetailScreen
 */
export const transformAssignmentDetail = (data, assignmentId) => {
  if (!data) return null;

  const assignments = Array.isArray(data.assignments) ? data.assignments : [];
  const submissions = Array.isArray(data.submissions) ? data.submissions : [];

  const a = assignments.find(
    (item) => item.id === Number(assignmentId)
  );
  if (!a) return null;

  const mySubmission = submissions.find(
    (s) => s.assignmentId === a.id || s.assignment_id === a.id
  );

  return {
    ...a,
    subject: {
      id: a.courseId || a.course_id,
      name: a.courseName || a.course_name || 'Unknown Course',
      code: '',
    },
    status: mySubmission
      ? mySubmission.status === 'graded' ? 'graded' : 'submitted'
      : 'pending',
    submission: mySubmission || null,
    due_date: a.dueDate || a.due_date,
    created_at: a.createdAt || a.created_at,
    author_name: a.facultyName || a.faculty_name || '',
  };
};

/**
 * Transform notices response.
 */
export const transformNotices = (data) => {
  if (!data) return [];
  const notices = Array.isArray(data) ? data : Array.isArray(data.notices) ? data.notices : [];
  return notices.map((n) => ({
    ...n,
    published_at: n.publishedDate || n.published_date,
    description: n.content || n.description || '',
    author_name: n.authorName || n.author_name || 'Administration',
  }));
};

/**
 * Transform user data
 */
export const transformUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    student_id: user.rollNo || user.roll_no_or_emp_id || user.roll_no || '',
    year: getYearFromSemester(user.semester),
  };
};

const getYearFromSemester = (semester) => {
  if (!semester) return '';
  if (semester <= 2) return '1st';
  if (semester <= 4) return '2nd';
  if (semester <= 6) return '3rd';
  return '4th';
};

/**
 * Compute dashboard stats
 */
export const computeDashboardStats = (attendanceRecords, assignmentsData, noticesData, user) => {
  let attendance = null;
  if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
    const total = attendanceRecords.length;
    const attended = attendanceRecords.filter(r => r.status === 'present').length;
    attendance = {
      total_classes: total,
      attended_classes: attended,
      percentage: Math.round((attended / total) * 100),
      is_below_threshold: total > 0 && (attended / total) < 0.75,
    };
  }

  let assignments = [];
  if (assignmentsData) {
    const all = Array.isArray(assignmentsData.assignments) ? assignmentsData.assignments : [];
    assignments = all.slice(0, 3).map(a => ({
      ...a,
      subject: { name: a.courseName || a.course_name || 'Course' },
      due_date: a.dueDate || a.due_date,
    }));
  }

  let notices = [];
  if (noticesData) {
    const all = Array.isArray(noticesData) ? noticesData : [];
    notices = all.slice(0, 3).map(n => ({
      ...n,
      published_at: n.publishedDate || n.published_date,
      description: n.content || n.description || '',
    }));
  }

  return {
    attendance,
    assignments,
    notices,
    events: [],
    unread_notifications: 0,
  };
};

/**
 * Transform Leave Requests for Faculty/Admin Approvals
 */
export const transformLeaveRequests = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((l) => ({
    ...l,
    applicant_name: l.userName || l.user_name || l.studentName || 'Applicant',
    role: l.userRole || l.user_role || 'student',
    start_date: l.startDate || l.start_date,
    end_date: l.endDate || l.end_date,
    reason: l.reason || '',
    status: l.status || 'pending',
  }));
};

/**
 * Transform User Directory for Admin Management
 */
export const transformUsersList = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((u) => ({
    ...u,
    role: u.role || 'student',
    sub_role: u.subRole || u.sub_role || '',
    department: u.department || 'General',
    status: u.status || 'active',
    emp_or_roll: u.rollNoOrEmpId || u.roll_no_or_emp_id || u.rollNo || u.empId || '',
  }));
};

/**
 * Transform Competitions List
 */
export const transformCompetitions = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    ...c,
    title: c.name || c.title || 'Campus Competition',
    category: c.category || 'Tech & Academic',
    deadline: c.registrationDeadline || c.deadline,
    prize: c.prizePool || c.prize || 'Certificates & Trophy',
  }));
};
