// SAME IMPORTS AS YOUR FILE (UNCHANGED)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { MentorAlert, LeaveApplication } from '../types';
import { alertService, leaveService, studentService } from '../services/apiStorageService';
import Button from '../components/Button';
import Input from '../components/Input';

const MentorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'alerts' | 'leaves'>('alerts');
    const [alerts, setAlerts] = useState<MentorAlert[]>([]);
    const [reasons, setReasons] = useState<{ [alertId: string]: string }>({});
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);

    useEffect(() => {
        if (user?.mentorId) {
            const loadData = async () => {
                const allAlerts = await alertService.getAll();
                const mentorAlerts = allAlerts.filter(a => a.mentorId === user.mentorId);
                setAlerts(mentorAlerts);

                const students = await studentService.getAll();
                const myStudentRollNos = students
                    .filter(s => s.mentorId === user.mentorId)
                    .map(s => s.rollNo);

                const allLeaves = await leaveService.getAll();
                setLeaves(
                    allLeaves.filter(l => myStudentRollNos.includes(l.rollNo))
                );
            };
            
            loadData();
        }
    }, [user]);

    /* 🔴 FIXED FUNCTION */
    const handleLeaveApproval = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
        await leaveService.update(leaveId, { status });

        setLeaves(prev =>
            prev.map(l => l.id === leaveId ? { ...l, status } : l)
        );

        window.dispatchEvent(new Event('leave-updated'));
        localStorage.setItem('__leave_sync__', Date.now().toString());

        alert(`Leave Application ${status.toLowerCase()} successfully.`);
    };

    const handleReasonChange = (alertId: string, value: string) => {
        setReasons(prev => ({
            ...prev,
            [alertId]: value
        }));
    };

    const handleSaveReason = async (alertId: string) => {
        const reason = reasons[alertId];
        if (!reason.trim()) {
            alert('Please enter a reason');
            return;
        }

        await alertService.update(alertId, { reason });
        setAlerts(prev =>
            prev.map(a => a.id === alertId ? { ...a, reason } : a)
        );
        setReasons(prev => {
            const updated = { ...prev };
            delete updated[alertId];
            return updated;
        });
        alert('Reason saved successfully.');
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mentor Workspace</h1>
                        <p className="text-slate-500 font-medium">Assigned ID: {user?.mentorId}</p>
                    </div>
                    
                    <div className="flex bg-slate-200 p-1 rounded-2xl shadow-inner w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('alerts')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Absence Alerts
                        </button>
                        <button 
                            onClick={() => setActiveTab('leaves')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leaves' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Leave Requests {leaves.filter(l => l.status === 'PENDING').length > 0 && <span className="ml-2 bg-red-500 text-white w-1.5 h-1.5 rounded-full inline-block"></span>}
                        </button>
                    </div>
                </header>

                <Card className="rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 bg-white">
                    {activeTab === 'alerts' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {alerts.map(alert => (
                                        <tr key={alert.id}>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-600">{alert.date}</td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-black text-slate-800">{alert.studentName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{alert.studentRollNo}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {alert.reason ? (
                                                    <span className="text-sm text-slate-500 italic">"{alert.reason}"</span>
                                                ) : (
                                                    <Input
                                                        type="text"
                                                        value={reasons[alert.id] || ''}
                                                        onChange={e => handleReasonChange(alert.id, e.target.value)}
                                                        placeholder="Add parent feedback..."
                                                        className="!rounded-xl !text-xs !py-2 !bg-slate-50"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {!alert.reason && (
                                                    <Button onClick={() => handleSaveReason(alert.id)} className="!text-[10px] !font-black !px-4 !py-2 !rounded-xl !bg-indigo-600">Save</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 gap-4">
                            {leaves.length > 0 ? leaves.map(leave => (
                                <div key={leave.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-800">{leave.studentName} ({leave.rollNo})</span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">{leave.aiCategory}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">{leave.startDate} to {leave.endDate}</p>
                                        <p className="text-sm text-slate-600 mt-2 font-medium italic">"{leave.reason}"</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {leave.status === 'PENDING' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleLeaveApproval(leave.id, 'APPROVED')}
                                                    className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100 transition-transform active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleLeaveApproval(leave.id, 'REJECTED')}
                                                    className="flex-1 md:flex-none px-6 py-2.5 bg-white text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                                                leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {leave.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center text-slate-400 font-bold italic">No leave applications to process.</div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default MentorDashboard;
