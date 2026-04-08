
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { attendanceService } from '../services/apiStorageService';

const StudentAttendance: React.FC = () => {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState<'all' | 'absent' | 'present'>('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [records, setRecords] = useState<any[]>([]);
    
    useEffect(() => {
        if (!user || !user.rollNo) return;
        
        const loadRecords = async () => {
            const all = await attendanceService.getAll();
            const filtered = all
                .filter(r => r.department === user.department && r.section === user.section)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
            const withPresence = filtered.map(record => ({
                ...record,
                isPresent: !record.absentRollNos.includes(user.rollNo!)
            }));
            
            setRecords(withPresence);
        };
        
        loadRecords();
    }, [user]);

    const subjects = useMemo(() => ['all', ...new Set(records.map(r => r.subject))], [records]);
    const months = useMemo(() => {
        const unique = [...new Set(records.map(r => r.date.substring(0, 7)))];
        return ['all', ...unique.sort().reverse()];
    }, [records]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchStatus = statusFilter === 'all' || (statusFilter === 'present' ? r.isPresent : !r.isPresent);
            const matchSubject = subjectFilter === 'all' || r.subject === subjectFilter;
            const matchMonth = monthFilter === 'all' || r.date.startsWith(monthFilter);
            return matchStatus && matchSubject && matchMonth;
        });
    }, [records, statusFilter, subjectFilter, monthFilter]);

    return (
        <Layout>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance History</h1>
                    <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
                        {['all', 'present', 'absent'].map((f) => (
                            <button 
                                key={f}
                                onClick={() => setStatusFilter(f as any)}
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${statusFilter === f ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Filter by Subject</label>
                        <select 
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                        >
                            {subjects.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Filter by Month</label>
                        <select 
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                        >
                            {months.map(m => <option key={m} value={m}>{m === 'all' ? 'ALL MONTHS' : m}</option>)}
                        </select>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">P#</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredRecords.length > 0 ? filteredRecords.map((record, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-black">{record.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">P{record.period}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">{record.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 italic">{record.facultyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                                                record.isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {record.isPresent ? 'PRESENT' : 'ABSENT'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-bold">No attendance records found for current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default StudentAttendance;
