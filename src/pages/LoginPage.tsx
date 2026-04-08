import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {

    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const identifier = role === 'student' ? rollNumber : email;

        try {
            const success = await login(identifier, password);
            if (!success) {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('Failed to login. Please check your connection.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 space-y-8">
            
            <div className="w-full max-w-sm">
                <Card className="p-8 space-y-4 rounded-xl shadow-lg">

                    <div className="text-center">
                        <Logo />
                        <h2 className="text-3xl font-bold text-slate-800">Sign In</h2>
                        <p className="text-slate-500 mt-1">Attendance Portal</p>
                    </div>

                    {error && (
                        <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">

                        {/* ROLE SELECT */}
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="hod">HOD / Admin</option>
                            <option value="mentor">Mentor</option>
                        </select>

                        {/* CONDITIONAL INPUT */}
                        {role === 'student' ? (
                            <Input
                                id="rollNumber"
                                type="text"
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                required
                                placeholder="Roll Number"
                            />
                        ) : (
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email"
                            />
                        )}

                        <Input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Password"
                        />

                        <div className="flex items-center justify-between text-sm pt-2">
                            <span className="text-gray-400">
                                {role === "student" ? "Students use Roll No" : "Use registered email"}
                            </span>
                            <a href="#" className="font-medium text-indigo-600 hover:underline">
                                Forgot?
                            </a>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full !mt-6 bg-[#0D2B4F] hover:bg-[#1E487B] text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Default Student Pass: <span className="font-mono font-bold">password</span>
                        </p>
                        <p className="text-xs text-gray-400">
                            e.g. Roll No: <span className="font-mono font-bold">CSE101</span>
                        </p>
                    </div>

                </Card>
            </div>


            {/* DEMO LOGIN SECTION */}
            <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                
                <h3 className="text-xl font-bold text-slate-700 mb-6 text-center">
                    Demo Login Credentials
                </h3>

                <div className="grid md:grid-cols-3 gap-6 text-sm">

                    {/* Faculty */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-700 mb-3">Faculty Portal</h4>
                        <ul className="space-y-2">
                            <li>
                                <span className="font-semibold">Prof. Ram Mohan</span><br/>
                                Email: <span className="font-mono">rammohan@necn.ac.in</span><br/>
                                Pass: <span className="font-mono">password</span>
                            </li>

                            <li>
                                <span className="font-semibold">Prof. Bvk</span><br/>
                                Email: <span className="font-mono">bvk@necn.ac.in</span><br/>
                                Pass: <span className="font-mono">password</span>
                            </li>
                        </ul>
                    </div>

                    {/* HOD */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-700 mb-3">HOD / Admin Portal</h4>
                        <ul className="space-y-2">
                            <li>
                                <span className="font-semibold">Dr. Ramesh Kumar</span><br/>
                                Email: <span className="font-mono">hod@necn.ac.in</span><br/>
                                Pass: <span className="font-mono">password</span>
                            </li>

                            <li>
                                <span className="font-semibold">Dr. Sunita Desai</span><br/>
                                Email: <span className="font-mono">sunita.desai@college.edu</span><br/>
                                Pass: <span className="font-mono">hodpass</span>
                            </li>
                        </ul>
                    </div>

                    {/* Mentor */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-slate-700 mb-3">Mentor Portal</h4>
                        <ul className="space-y-2">
                            <li>
                                Rajesh Gupta <br/>
                                <span className="font-mono">rajesh.gupta@college.edu</span>
                            </li>
                            <li>
                                Priya Verma <br/>
                                <span className="font-mono">priya.verma@college.edu</span>
                            </li>
                            <li>
                                Suresh Patil <br/>
                                <span className="font-mono">suresh.patil@college.edu</span>
                            </li>
                            <li>
                                Deepa Mehta <br/>
                                <span className="font-mono">deepa.mehta@college.edu</span>
                            </li>
                            <p className="text-xs text-gray-500 pt-2">
                                Password: <span className="font-mono">mentorpass</span>
                            </p>
                        </ul>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default LoginPage;