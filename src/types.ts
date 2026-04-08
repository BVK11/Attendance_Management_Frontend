export interface Student {
    rollNo: string;
    name: string;
    password?: string;
    parentContact: string;
    mentorId: string;
    department: string;
    section: string;
}

export interface TimetableEntry {
    id: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    period: number;
    subject: string;
    faculty: string;
    startTime: string;
    endTime: string;
    department: string;
    section: string;
}

export interface Faculty {
    id: string;
    name: string;
    email: string;
    department: string;
    password?: string;
    isActive: boolean;
}

export interface Hod {
    id: string;
    name: string;
    email: string;
    department: string;
    password?: string;
    isActive: boolean;
}

export interface Mentor {
    id: string;
    name: string;
    mentorId: string;
    email: string;
    password?: string;
    isActive: boolean;
    department: string;
}

export interface AttendanceRecord {
    date: string;
    department: string;
    section: string;
    period: number;
    subject: string;
    facultyName: string;
    absentRollNos: string[];
}

export interface MentorAlert {
    id: string;
    date: string;
    mentorId: string;
    studentName: string;
    studentRollNo: string;
    parentContact: string;
    department: string;
    section: string;
    period: number;
    reason?: string;
}

// --- NEW TYPES ---
export interface LeaveApplication {
    id: string;
    rollNo: string;
    studentName: string;
    startDate: string;
    endDate: string;
    reason: string;
    fileData?: string; // Base64
    aiCategory?: string;
    aiScore?: number;
    aiSuggestion?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    appliedOn: string;
}

export interface CallLog {
    id: string;
    rollNo: string;
    date: string;
    type: 'ABSENCE' | 'LOW_ATTENDANCE';
}

export enum UserRole {
    Faculty = 'FACULTY',
    Hod = 'HOD',
    Mentor = 'MENTOR',
    Student = 'STUDENT',
}

export interface AuthenticatedUser {
    id: string;
    name: string;
    role: UserRole;
    department?: string; 
    mentorId?: string; 
    section?: string; 
    rollNo?: string; 
}
