
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { timetableService } from '../services/apiStorageService';

const StudentTimetable: React.FC = () => {
    const { user } = useAuth();
    const [timetableByDay, setTimetableByDay] = useState<{ [key: string]: any[] }>({});
    
    useEffect(() => {
        if (!user) return;
        
        const loadTimetable = async () => {
            const entries = await timetableService.getAll();
            const filtered = entries.filter(t => t.department === user.department && t.section === user.section);
            
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const grouped: { [key: string]: any[] } = {};
            
            days.forEach(day => {
                grouped[day] = filtered.filter(e => e.day === day).sort((a, b) => a.period - b.period);
            });
            
            setTimetableByDay(grouped);
        };
        
        loadTimetable();
    }, [user]);

    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    
    const isCurrentPeriod = (startTime: string, endTime: string, day: string) => {
        if (day !== today) return false;
        
        const now = new Date();
        const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
        
        const parseTime = (timeStr: string) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            const d = new Date();
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        const start = parseTime(startTime);
        const end = parseTime(endTime);
        return now >= start && now <= end;
    };

    return (
        <Layout>
            <div className="space-y-6">
                <header>
                    <h1 className="text-3xl font-extrabold text-slate-900">Weekly Schedule</h1>
                    <p className="text-slate-500 font-medium">Class schedule for {user?.department} - Section {user?.section}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {Object.entries(timetableByDay).map(([day, classes]) => {
                        const isToday = day === today;
                        return (
                            <div key={day} className={`space-y-4 rounded-3xl p-1 transition-all ${isToday ? 'bg-indigo-50 border-2 border-indigo-200 ring-4 ring-indigo-50' : ''}`}>
                                <h3 className={`text-sm font-black text-center py-3 rounded-2xl uppercase tracking-widest ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                                    {day}
                                    {isToday && <span className="block text-[8px] opacity-70">Current Day</span>}
                                </h3>
                                <div className="space-y-3 px-2 pb-2">
                                    {classes.length > 0 ? classes.map((cls, idx) => {
                                        const active = isCurrentPeriod(cls.startTime, cls.endTime, day);
                                        return (
                                            <Card key={idx} className={`p-4 border-l-4 transition-all duration-300 ${active ? 'border-indigo-600 shadow-xl scale-105 z-10 bg-indigo-50' : 'border-slate-300'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>P{cls.period}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{cls.startTime}</span>
                                                </div>
                                                <h4 className={`font-black text-sm leading-tight line-clamp-2 ${active ? 'text-indigo-900' : 'text-slate-800'}`}>{cls.subject}</h4>
                                                <p className="text-[10px] text-slate-400 mt-2 font-bold italic">{cls.faculty}</p>
                                                {active && <div className="mt-2 flex items-center gap-1.5 text-indigo-600 animate-pulse">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                                    <span className="text-[8px] font-black uppercase">Live Period</span>
                                                </div>}
                                            </Card>
                                        );
                                    }) : (
                                        <div className="text-center py-10 text-[10px] font-black text-slate-300 uppercase italic">No Classes Scheduled</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <Card className="p-8 bg-slate-900 text-white overflow-hidden relative rounded-3xl">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black mb-2 tracking-tight">System Compliance Notice</h3>
                        <p className="opacity-70 text-sm leading-relaxed max-w-2xl">Attendance tracking is real-time. Please ensure you are physically present in the classroom during marked periods. Shortages are recalculated after every session.</p>
                    </div>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                </Card>
            </div>
        </Layout>
    );
};

export default StudentTimetable;
