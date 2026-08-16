namespace VscmsErp.Api.Lib;

/// <summary>
/// Indian-style demo seed data ported 1:1 from src/lib/seed-data.ts.
/// </summary>
public static class SeedData
{
    public sealed record SeedUser(
        string Name, string Email, string Role, string RollNo, string Department,
        long? Semester, string? Designation, string Phone, string AvatarUrl, string? Gpa, string Status);

    public static readonly SeedUser[] InitialUsers =
    [
        new("Dr. Virendra Swaroop", "director@vscms.edu", "admin", "1", "Office of the Director", null,
            "Director, College of Management Studies", "+91 11 4011 9001",
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80", null, "active"),
        new("Prof. Elena Rostova", "e.rostova@vscms.edu", "faculty", "2", "BCA (CSJM)", null,
            "Professor of Computer Science · HOD", "+91 11 4011 9142",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80", null, "active"),
        new("Dr. Marcus Lindqvist", "m.lindqvist@vscms.edu", "faculty", "3", "MBA", null,
            "Associate Professor · Program Lead", "+91 11 4011 9221",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80", null, "active"),
        new("Prof. Aisha Okonkwo", "a.okonkwo@vscms.edu", "faculty", "4", "BCA (MCU)", null,
            "Professor of Data Science", "+91 11 4011 9098",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80", null, "active"),
        new("Aarav Rao", "aarav.r@vscms.edu", "student", "101", "BCA (CSJM)", 3, null,
            "+91 98200 11431", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80", "3.81", "active"),
        new("Priya Nair", "priya.n@vscms.edu", "student", "102", "BCA (MCU)", 3, null,
            "+91 98200 22718", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80", "3.92", "active"),
        new("Rohan Das", "rohan.d@vscms.edu", "student", "103", "MBA", 2, null,
            "+91 98200 33007", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80", "3.66", "active"),
        new("Meera Iyer", "meera.i@vscms.edu", "student", "104", "BBA", 2, null,
            "+91 98200 44012", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80", "3.74", "active"),
        new("Kabir Shah", "kabir.s@vscms.edu", "student", "105", "BCA (CSJM)", 4, null,
            "+91 98200 55044", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80", "3.48", "active"),
    ];

    public sealed record SeedDepartment(string Code, string Name, string Head, string Location, long Students, long Faculty);

    public static readonly SeedDepartment[] InitialDepartments =
    [
        new("BCA-CSJM", "BCA (CSJM)", "Prof. Elena Rostova", "Computer Wing · Level 1", 120, 8),
        new("BCA-MCU", "BCA (MCU)", "Prof. Aisha Okonkwo", "Computer Wing · Level 2", 95, 6),
        new("MBA", "MBA", "Dr. Marcus Lindqvist", "Management Block · Level 3", 80, 10),
        new("BBA", "BBA", "Prof. Nina Sharma", "Management Block · Level 2", 110, 7),
    ];

    public sealed record SeedCourse(
        string Code, string Name, string Department, long Credits, long Semester,
        string FacultyName, string Room, string Schedule, string Description);

    public static readonly SeedCourse[] InitialCourses =
    [
        new("BCA101", "Introduction to Programming", "BCA (CSJM)", 4, 1, "Prof. Elena Rostova", "Lab 1 · LT-101",
            "Mon · Wed · Fri  09:00 10:30", "Basics of programming with Python. Variables, loops, functions and simple projects."),
        new("BCA201", "Data Structures & Algorithms", "BCA (CSJM)", 4, 2, "Prof. Elena Rostova", "Lab 2 · LT-202",
            "Tue · Thu  09:00 10:30", "Arrays, linked lists, stacks, queues, trees and sorting algorithms."),
        new("BCA301", "Database Management Systems", "BCA (CSJM)", 3, 3, "Prof. Aisha Okonkwo", "Lab 1 · LT-101",
            "Mon · Wed  11:00 12:30", "SQL, relational databases, normalization and basic database design."),
        new("MBA101", "Principles of Management", "MBA", 3, 1, "Dr. Marcus Lindqvist", "Hall 1 · MH-101",
            "Tue · Thu  11:00 12:30", "Introduction to management concepts, planning, organizing, leading and controlling."),
        new("MBA201", "Marketing Management", "MBA", 3, 2, "Dr. Marcus Lindqvist", "Hall 2 · MH-202",
            "Mon · Wed  14:00 15:30", "Market research, consumer behaviour, branding and digital marketing basics."),
        new("BBA101", "Business Communication", "BBA", 3, 1, "Prof. Nina Sharma", "Hall 1 · MH-101",
            "Tue · Thu  09:00 10:30", "Business writing, presentations, email etiquette and professional communication skills."),
        new("BBA201", "Financial Accounting", "BBA", 3, 2, "Prof. Nina Sharma", "Hall 2 · MH-202",
            "Mon · Wed  11:00 12:30", "Basic accounting principles, ledger entries, balance sheets and profit & loss statements."),
        new("BCA401", "Web Development", "BCA (CSJM)", 3, 4, "Prof. Aisha Okonkwo", "Lab 2 · LT-202",
            "Fri  11:00 14:00", "HTML, CSS, JavaScript basics and building simple web pages."),
    ];

    public sealed record SeedNotice(string Title, string Content, string Category, string Priority, string Author, string PublishedDate);

    public static readonly SeedNotice[] InitialNotices =
    [
        new("Exam Schedule Released",
            "The exam schedule has been posted. Students must check their dates and prepare accordingly. Contact the office for any changes.",
            "Exam", "urgent", "Exam Cell", "2026-03-15"),
        new("Library Books Return Deadline",
            "All library books must be returned by 31 March. Late returns will attract a fine of ₹50 per day. Students are requested to clear their dues.",
            "Academic", "normal", "Library Office", "2026-03-12"),
        new("Fee Payment Last Date",
            "The last date for clearing tuition and lab fees is 31 March 2026. Pay online or visit the bursar office. Late fee of ₹200 applies after the deadline.",
            "Fee", "urgent", "Bursar Office", "2026-03-10"),
        new("Guest Lecture on AI in Business",
            "An alumnus working in AI will give a guest talk this Friday at 3 PM in the Seminar Hall. All students are welcome. Certificates will be provided.",
            "Event", "normal", "Training & Placement Cell", "2026-03-08"),
    ];
}
