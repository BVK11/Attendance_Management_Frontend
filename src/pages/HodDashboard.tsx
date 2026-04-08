import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { attendanceService, studentService, alertService } from '../services/apiStorageService';
import { AttendanceRecord, Student } from '../types';

interface AbsenteeDetails extends Student {
    reason?: string;
}

const HodDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // State for the absentee view modal
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [absenteeDetails, setAbsenteeDetails] = useState<AbsenteeDetails[]>([]);

    useEffect(() => {
        if (user?.department) {
            const loadData = async () => {
                const dept = user.department;
                const attendanceData = await attendanceService.getAll();
                const studentData = await studentService.getAll();
                
                setAttendance(attendanceData.filter(r => r.department === dept));
                setStudents(studentData.filter(s => s.department === dept));
            };
            loadData();
        }
    }, [user]);

    useEffect(() => {
        if (selectedRecord) {
            const loadAbsenteeDetails = async () => {
                const absentStudents = students.filter(s => selectedRecord.absentRollNos.includes(s.rollNo));
                const allAlerts = await alertService.getAll();
                
                const details = absentStudents.map(student => {
                    const alert = allAlerts.find(a => 
                        a.studentRollNo === student.rollNo && 
                        a.date === selectedRecord.date &&
                        a.period === selectedRecord.period
                    );
                    return { ...student, reason: alert?.reason || 'Not provided' };
                });
                setAbsenteeDetails(details);
            };
            loadAbsenteeDetails();
        }
    }, [selectedRecord, students]);

    const handleViewAbsentees = (record: AttendanceRecord) => {
        setSelectedRecord(record);
        setViewModalOpen(true);
    };

    const filteredRecords = useMemo(() => {
        return attendance.filter(record => record.date === filterDate);
    }, [attendance, filterDate]);

    const departmentStats = useMemo(() => {
        if (students.length === 0) {
             return { totalClasses: 0, totalAbsentees: 0, attendancePercentage: 100 };
        }
        
        const totalClassesToday = filteredRecords.length;
        const totalAbsenteesToday = filteredRecords.reduce((acc, curr) => acc + curr.absentRollNos.length, 0);
        
        let totalPresent = 0;
        let totalStudentsInClasses = 0;
        const studentsInSection: {[key: string]: number} = {};
        students.forEach(s => {
            studentsInSection[s.section] = (studentsInSection[s.section] || 0) + 1;
        });

        filteredRecords.forEach(record => {
            const totalStudents = studentsInSection[record.section] || 0;
            totalStudentsInClasses += totalStudents;
            totalPresent += (totalStudents - record.absentRollNos.length);
        });
        
        const attendancePercentage = totalStudentsInClasses > 0 ? (totalPresent / totalStudentsInClasses) * 100 : 100;

        return {
            totalClasses: totalClassesToday,
            totalAbsentees: totalAbsenteesToday,
            attendancePercentage: Math.round(attendancePercentage),
        };
    }, [students, filteredRecords]);
    
    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold">HOD Dashboard ({user?.department})</h1>
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={() => navigate('/admin-management')}>Manage Data</Button>
                        <div className="flex items-center gap-2">
                            <label htmlFor="filter-date" className="font-medium text-sm text-gray-700">Date:</label>
                            <input
                                id="filter-date"
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="block px-3 py-2 border rounded-md shadow-sm sm:text-sm bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-500">Attendance Today</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">{departmentStats.attendancePercentage}%</p>
                    </Card>
                    <Card className="p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-500">Total Classes Today</h3>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{departmentStats.totalClasses}</p>
                    </Card>
                    <Card className="p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-500">Total Absentees Today</h3>
                        <p className="text-4xl font-bold text-red-600 mt-2">{departmentStats.totalAbsentees}</p>
                    </Card>
                </div>

                {/* Attendance Records Table */}
                <Card>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold">Attendance Records for {filterDate}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absentees</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.length > 0 ? filteredRecords.map((record, index) => (
                                    <tr key={`${record.date}-${record.section}-${record.period}-${index}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.section}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.period}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.facultyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{record.absentRollNos.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button variant="secondary" onClick={() => handleViewAbsentees(record)} className="text-xs !py-1 !px-2">View</Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No attendance records found for this date.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title={`Absentee Details for Period ${selectedRecord?.period}`}>
                {absenteeDetails.length > 0 ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 font-semibold text-sm border-b pb-2">
                           <span>Student Name</span>
                           <span>Roll No</span>
                           <span>Reason</span>
                        </div>
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {absenteeDetails.map(student => (
                                <li key={student.rollNo} className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded-md text-sm">
                                    <span className="font-medium text-gray-800">{student.name}</span>
                                    <span className="text-gray-600">{student.rollNo}</span>
                                    <span className="text-gray-600">{student.reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-center p-4">No absentees were recorded for this class.</p>
                )}
                 <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setViewModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        </Layout>
    );
};

export default HodDashboard;
