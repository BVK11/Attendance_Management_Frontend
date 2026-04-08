// SAME IMPORTS AS YOUR FILE (UNCHANGED)
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { attendanceService, leaveService } from '../services/apiStorageService';
import { aiService } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();

    const [selectedTarget, setSelectedTarget] = useState(75);
    const [myLeaves, setMyLeaves] = useState<any[]>([]);
    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveReason, setLeaveReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    /* LOAD ATTENDANCE STATS */
    useEffect(() => {
        if (!user?.rollNo) return;

        const loadStats = async () => {
            const records = await attendanceService.getAll();
            const filtered = records.filter(
                r => r.department === user.department && r.section === user.section
            );

            const totalHeld = filtered.length;
            const absent = filtered.filter(r =>
                r.absentRollNos.includes(user.rollNo!)
            ).length;

            const attended = totalHeld - absent;
            const percentage = totalHeld
                ? Math.round((attended / totalHeld) * 100)
                : 100;

            setStats({ totalHeld, attended, percentage });
        };

        loadStats();
    }, [user]);

    /* 🔴 FIXED SYNC LOGIC */
    useEffect(() => {
        if (!user?.rollNo) return;

        const loadLeaves = async () => {
            const leaves = await leaveService.getAll();
            const updated = leaves
                .filter(l => l.rollNo === user.rollNo)
                .reverse();
            setMyLeaves(updated);
        };

        loadLeaves();

        window.addEventListener('leave-updated', loadLeaves);
        window.addEventListener('storage', loadLeaves);

        return () => {
            window.removeEventListener('leave-updated', loadLeaves);
            window.removeEventListener('storage', loadLeaves);
        };
    }, [user?.rollNo]);

    /* ---------------- INIT SPEECH ---------------- */
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.onresult = (e: any) => {
            setLeaveReason(prev => prev + ' ' + e.results[0][0].transcript);
            setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    /* ---------------- TARGET CALCULATION ---------------- */
    const targetInfo = useMemo(() => {
        if (!stats) return null;

        const h = stats.totalHeld;
        const a = stats.attended;
        const t = selectedTarget / 100;

        if (stats.percentage >= selectedTarget) {
            const canMiss = Math.floor((a / t) - h);
            return { type: 'safe', value: Math.max(0, canMiss) };
        } else {
            const need = Math.ceil((t * h - a) / (1 - t));
            return { type: 'need', value: Math.max(0, need) };
        }
    }, [stats, selectedTarget]);

    /* ---------------- APPLY LEAVE ---------------- */
    const applyLeave = async () => {
        if (!leaveReason || !startDate || !endDate) {
            alert('Fill all fields');
            return;
        }

        setIsAnalyzing(true);
        const analysis = await aiService.analyzeLeaveReason(leaveReason);

        await leaveService.add({
            id: uuidv4(),
            rollNo: user!.rollNo!,
            studentName: user!.name,
            startDate,
            endDate,
            reason: leaveReason,
            status: 'PENDING',
            aiCategory: analysis.category,
            appliedOn: new Date().toISOString()
        });

        setIsAnalyzing(false);
        setLeaveModalOpen(false);
        setLeaveReason('');
        setStartDate('');
        setEndDate('');

        window.dispatchEvent(new Event('leave-updated'));
        alert('Leave application submitted');
    };

    if (!stats) return null;

    /* ---------------- UI ---------------- */
    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">

                {/* ATTENDANCE CARD */}
                <Card className="p-12 text-center rounded-[2.5rem] shadow-xl">
                    <p className="text-xs font-black text-slate-400 uppercase mb-3">
                        Current Attendance
                    </p>
                    <h1 className={`text-8xl font-black ${
                        stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {stats.percentage}%
                    </h1>
                </Card>

                {/* TARGET SELECTOR */}
                <Card className="p-8 rounded-3xl bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-lg">Attendance Target</h3>
                        <select
                            value={selectedTarget}
                            onChange={e => setSelectedTarget(+e.target.value)}
                            className="px-4 py-2 rounded-xl border font-black"
                        >
                            {[75, 80, 85, 90].map(v => (
                                <option key={v} value={v}>{v}%</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-6 rounded-2xl text-center font-bold">
                        {targetInfo?.type === 'need' ? (
                            <>Attend <span className="text-red-600 text-xl">{targetInfo.value}</span> more classes to reach {selectedTarget}%</>
                        ) : (
                            <>You can miss <span className="text-green-600 text-xl">{targetInfo?.value}</span> classes and stay at {selectedTarget}%</>
                        )}
                    </div>
                </Card>

                {/* APPLY LEAVE */}
                <div className="text-center">
                    <Button
                        onClick={() => setLeaveModalOpen(true)}
                        className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black"
                    >
                        Apply Leave
                    </Button>
                </div>

                {/* RECENT LEAVES */}
                {myLeaves.length > 0 && (
                    <section>
                        <h3 className="font-black mb-4">Recent Applications</h3>
                        <div className="grid gap-4">
                            {myLeaves.slice(0, 4).map(l => (
                                <Card key={l.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{l.reason}</p>
                                        <p className="text-xs text-slate-400">
                                            {l.startDate} → {l.endDate}
                                        </p>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-xs font-black ${
                                        l.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-700'
                                            : l.status === 'REJECTED'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {l.status}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* LEAVE MODAL */}
            <Modal
                isOpen={isLeaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                title="Apply Leave"
            >
                <div className="space-y-4">
                    <Input type="date" label="From" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input type="date" label="To" value={endDate} onChange={e => setEndDate(e.target.value)} />

                    <textarea
                        value={leaveReason}
                        onChange={e => setLeaveReason(e.target.value)}
                        className="w-full h-32 p-4 rounded-xl border"
                        placeholder="Reason for leave"
                    />

                    <Button onClick={startListening} variant="secondary">
                        🎤 Speak Reason
                    </Button>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
                        <Button onClick={applyLeave} disabled={isAnalyzing}>
                            {isAnalyzing ? 'Analyzing...' : 'Submit'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default StudentDashboard;
