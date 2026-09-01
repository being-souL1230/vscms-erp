// Direct Live Backend on Render (Public URL)
const BASE_URL = 'https://vscms-erp-api.onrender.com/api';
const RENDER_FALLBACK_URL = 'https://vscms-erp-api.onrender.com/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
  },
  STUDENT: {
    PROFILE: '/students',
    DASHBOARD: '/students',
  },
  FACULTY: {
    LIST: '/faculty',
  },
  NOTICES: {
    LIST: '/notices',
    DETAIL: (id) => `/notices?id=${id}`,
  },
  ATTENDANCE: {
    LIST: '/attendance',
    SUBMIT: '/attendance',
  },
  GRADES: {
    LIST: '/grades',
  },
  INTERNAL_MARKS: {
    LIST: '/internal-marks',
  },
  FEES: {
    LIST: '/fees',
  },
  ASSIGNMENTS: {
    LIST: '/assignments',
  },
  COURSES: {
    LIST: '/courses',
  },
  TIMETABLE: {
    LIST: '/timetable',
  },
  DEPARTMENTS: {
    LIST: '/departments',
  },
  LEAVES: {
    LIST: '/leaves',
  },
  EVENTS: {
    LIST: '/competitions',
  },
  COMPETITIONS: {
    LIST: '/competitions',
  },
  CHAT: {
    QUERY: '/chat',
  },
  COURSE_MATERIALS: {
    LIST: '/course-materials',
  },
};

export { BASE_URL, RENDER_FALLBACK_URL };
