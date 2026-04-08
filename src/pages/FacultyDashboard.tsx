import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { studentService } from '../services/apiStorageService';

const FacultyDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [department, setDepartment] = useState('');
    const [section, setSection] = useState('');
    const [availableSections, setAvailableSections] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.department) {
            setDepartment(user.department);
            
            const loadSections = async () => {
                const students = await studentService.getAll();
                const sections = [...new Set(students
                    .filter(s => s.department === user.department)
                    .map(s => s.section))];
                setAvailableSections(sections.sort());
            };
            
            loadSections();
        }
    }, [user]);

    const handleProceed = () => {
        if (!section) {
            setError('Please select a section.');
            return;
        }
        navigate(`/attendance/${department}/${section}`);
    };

    return (
        <Layout>
             <div className="flex items-center justify-center pt-10">
                <Card className="w-full max-w-lg p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">Take Attendance</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input 
                                type="text" 
                                value={department} 
                                disabled 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select
                                id="section"
                                value={section}
                                onChange={(e) => { setSection(e.target.value); setError(''); }}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md shadow-sm bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select Section</option>
                                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button onClick={handleProceed} className="w-full !mt-8" disabled={!section}>Proceed to Mark Attendance</Button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default FacultyDashboard;