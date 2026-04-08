
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { Student } from '../types';
import { studentService, attendanceService, alertService } from '../services/apiStorageService';
import { v4 as uuidv4 } from 'uuid';

const AttendancePage: React.FC = () => {
    const { department, section } = useParams<{ department: string, section: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceStatus, setAttendanceStatus] = useState<Map<string, boolean>>(new Map());
    const [subject, setSubject] = useState('');
    const [period, setPeriod] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');
    
    // --- VOICE ATTENDANCE STATE ---
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const studentsRef = useRef<Student[]>([]);
    const processTimeoutRef = useRef<any>(null);
    const lastTranscriptRef = useRef<string>('');

    // Initialize students and attendance status on component mount
    useEffect(() => {
        if (department && section) {
            const loadStudents = async () => {
                const allStudents = await studentService.getAll();
                const classStudents = allStudents.filter(s => s.department === department && s.section === section);
                setStudents(classStudents);
                studentsRef.current = classStudents;
                const initialStatus = new Map(classStudents.map(s => [s.rollNo, true]));
                setAttendanceStatus(initialStatus);
            };
            
            loadStudents();
        }
    }, [department, section]);

    // Initialize Speech Recognition ONCE on component mount
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && !recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onresult = (event: any) => {
                // Collect ALL transcripts including interim results for faster capture
                let transcript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript.toLowerCase() + ' ';
                }
                
                transcript = transcript.trim();
                
                if (!transcript) return;
                
                // Store transcript for debounced processing
                lastTranscriptRef.current = transcript;
                
                // Clear existing timeout
                if (processTimeoutRef.current) {
                    clearTimeout(processTimeoutRef.current);
                }
                
                // Only process on final result (isFinal = true)
                const isFinal = event.results[event.results.length - 1].isFinal;
                
                if (isFinal) {
                    // Process immediately when final
                    processVoiceCommand(transcript);
                } else {
                    // Debounce interim results - wait 150ms for more speech (faster response)
                    processTimeoutRef.current = setTimeout(() => {
                        processVoiceCommand(lastTranscriptRef.current);
                    }, 150);
                }
            };
            
            // Helper function to process voice commands with NLP-like intelligence - OPTIMIZED
            const processVoiceCommand = (transcript: string) => {
                console.log('Processing Voice Input:', transcript);
                
                // Fast path: Extract status first
                const isAbsent = transcript.includes('absent');
                const isPresent = transcript.includes('present');
                
                if (!isAbsent && !isPresent) return; // No status command found
                
                const rollNumbers = new Set<string>();
                
                // Fast extraction: Get all numbers
                const allNumberMatches = transcript.match(/\d+/g) || [];
                if (allNumberMatches.length === 0) return; // No numbers found
                
                const uniqueNumbers = [...new Set(allNumberMatches)];
                const studentMap = new Map(studentsRef.current.map(s => [s.rollNo, s.name]));
                
                // Optimized matching: Fast single-pass approach
                uniqueNumbers.forEach(extractedNum => {
                    // Try 1: Direct match (fastest)
                    if (studentMap.has(extractedNum)) {
                        rollNumbers.add(extractedNum);
                        return;
                    }
                    
                    // Try 2: Match by last 3 digits (most common)
                    if (extractedNum.length >= 3) {
                        const last3 = extractedNum.slice(-3);
                        for (const [rollNo] of studentMap) {
                            if (rollNo.endsWith(last3)) {
                                rollNumbers.add(rollNo);
                                return;
                            }
                        }
                    }
                    
                    // Try 3: Match by last 2 digits
                    if (extractedNum.length >= 2) {
                        const last2 = extractedNum.slice(-2);
                        for (const [rollNo] of studentMap) {
                            if (rollNo.endsWith(last2)) {
                                rollNumbers.add(rollNo);
                                return;
                            }
                        }
                    }
                });
                
                // Fast batch update
                if (rollNumbers.size > 0) {
                    setAttendanceStatus(prev => {
                        const newStatus = new Map(prev);
                        const status = !isAbsent;
                        rollNumbers.forEach(rollNo => {
                            newStatus.set(rollNo, status);
                        });
                        return newStatus;
                    });
                    
                    const status = isAbsent ? 'ABSENT' : 'PRESENT';
                    setVoiceFeedback(`✓ Marked ${rollNumbers.size} as ${status}`);
                    setTimeout(() => setVoiceFeedback(''), 1500);
                    
                    console.log(`✓ Marked ${rollNumbers.size} as ${status}:`, Array.from(rollNumbers));
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setVoiceFeedback(`Error: ${event.error}`);
                setTimeout(() => setVoiceFeedback(''), 3000);
            };
            
            recognitionRef.current.onend = () => {
                // Auto-restart immediately for continuous listening
                if (isListening) {
                    // Restart with minimal delay
                    recognitionRef.current?.start();
                }
            };
        }
    }, []); // Empty dependency array - initialize only once on mount

    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };

    const absentStudents = useMemo(() => {
        return students.filter(s => !attendanceStatus.get(s.rollNo));
    }, [students, attendanceStatus]);

    const toggleStatus = (rollNo: string) => {
        setAttendanceStatus(prev => {
            const newStatus = new Map(prev);
            newStatus.set(rollNo, !newStatus.get(rollNo));
            return newStatus;
        });
    };
    
    const markAll = (isPresent: boolean) => {
        setAttendanceStatus(new Map(students.map(s => [s.rollNo, isPresent])));
    };

    const handleConfirmSubmit = () => {
        if (!subject || !period) {
            alert('Please fill in the subject and period number.');
            return;
        }
        setConfirmModalOpen(true);
    };

    const handleSubmit = () => {
        if (!department || !section || !user) return;
        
        const absentRollNos = students
            .filter(s => !attendanceStatus.get(s.rollNo))
            .map(s => s.rollNo);

        const attendanceRecord = {
            date,
            department,
            section,
            period: parseInt(period),
            subject,
            facultyName: user.name,
            absentRollNos,
        };
        attendanceService.add(attendanceRecord);

        const newAlerts = absentStudents.map(student => ({
            id: uuidv4(),
            date,
            mentorId: student.mentorId,
            studentName: student.name,
            studentRollNo: student.rollNo,
            parentContact: student.parentContact,
            department: student.department,
            section: student.section,
            period: parseInt(period),
            reason: '',
        }));
        alertService.addBatch(newAlerts);

        setConfirmModalOpen(false);
        setNotificationModalOpen(true);
    };

    return (
        <Layout>
            <Card>
                <div className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
                        <div>
                            <button onClick={() => navigate(-1)} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                            <h2 className="text-3xl font-bold text-gray-800">Mark Attendance</h2>
                            <p className="text-gray-600 font-medium mt-1">Department: {department} | Section: {section}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 sm:mt-0">
                            <button 
                                onClick={toggleVoice} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                {isListening ? 'Listening...' : 'Voice Assist'}
                            </button>
                           <input 
                             id="attendance-date"
                             type="date"
                             value={date}
                             onChange={e => setDate(e.target.value)}
                             className="block px-3 py-2 text-base rounded-md shadow-sm bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                           />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-6 bg-slate-50 rounded-lg border">
                        <Input label="Subject Name" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Artificial Intelligence" variant="dark" />
                        <Input label="Period Number" type="number" value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. 1" min="1" max="8" variant="dark" />
                    </div>

                    <div className="flex gap-4 mb-6">
                        <Button variant="secondary" onClick={() => markAll(true)}>Mark All Present</Button>
                        <Button variant="secondary" onClick={() => markAll(false)}>Mark All Absent</Button>
                    </div>

                    {isListening && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border-2 border-indigo-200 mb-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                <p className="text-indigo-900 font-bold text-sm">🎤 Voice Recognition Active</p>
                            </div>
                            <ul className="text-indigo-700 text-sm space-y-1.5 list-disc list-inside font-medium">
                                <li>Say numbers with status: "191 192 193 210 absent"</li>
                                <li>Works with interruptions: "191 hello 193 hlo 210 absent"</li>
                                <li>Both 190 & 200 series supported automatically</li>
                                <li>By name also works: "John Mike Sarah absent"</li>
                            </ul>
                            {voiceFeedback && (
                                <div className={`mt-3 p-3 rounded-lg font-semibold text-sm transition-all ${
                                    voiceFeedback.includes('⚠') 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800 animate-pulse'
                                }`}>
                                    {voiceFeedback}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="hidden md:grid grid-cols-3 gap-4 font-bold text-sm text-gray-500 uppercase px-4 py-2 bg-slate-50 rounded-t-lg">
                            <span>Register No.</span>
                            <span>Student Name</span>
                            <span className="text-center">Status</span>
                        </div>
                        <ul className="divide-y divide-gray-200">
                        {students.map(student => {
                            const isPresent = attendanceStatus.get(student.rollNo);
                            return (
                                <li key={student.rollNo} className={`grid grid-cols-3 gap-4 items-center p-4 rounded-lg transition-colors ${!isPresent ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                                    <span className="font-mono text-sm text-gray-700">{student.rollNo}</span>
                                    <span className="font-semibold text-gray-800">{student.name}</span>
                                    <div className="flex justify-center">
                                        <button onClick={() => toggleStatus(student.rollNo)} className={`px-4 py-1 text-sm rounded-full font-semibold w-24 text-center transition-all ${
                                            isPresent 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-500 text-white shadow-md'
                                        }`}>
                                            {isPresent ? 'Present' : 'Absent'}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                        </ul>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <Button onClick={handleConfirmSubmit} disabled={!subject || !period}>Submit Attendance</Button>
                </div>
            </Card>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Absentees">
                <p className="mb-4">Please review the list of absent students before submitting.</p>
                {absentStudents.length > 0 ? (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {absentStudents.map(s => <li key={s.rollNo} className="p-2 bg-gray-100 rounded-md">{s.name} ({s.rollNo})</li>)}
                    </ul>
                ) : (
                    <p className="text-green-600 font-semibold p-4 text-center bg-green-50 rounded-md">All students are present!</p>
                )}
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Confirm & Submit</Button>
                </div>
            </Modal>

            <Modal isOpen={isNotificationModalOpen} onClose={() => navigate('/faculty-dashboard')} title="Submission Successful">
                <p className="mb-4">Attendance has been recorded. Notifications have been sent to mentors and parents of absent students.</p>
                <h3 className="font-semibold mb-2">Simulated Parent SMS:</h3>
                {absentStudents.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto text-sm p-3 bg-gray-100 rounded-md">
                        {absentStudents.map(s => <p key={s.rollNo}>[SMS to {s.parentContact}]: Dear Parent, your ward {s.name} was absent for {subject} class.</p>)}
                    </div>
                ) : (
                     <p className="p-2 text-center">No parent notifications sent as all students were present.</p>
                )}
                <div className="flex justify-end mt-6">
                    <Button onClick={() => navigate('/faculty-dashboard')}>Close</Button>
                </div>
            </Modal>
        </Layout>
    );
};

export default AttendancePage;
