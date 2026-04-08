import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Logo from '../components/Logo';

const MentorLogin: React.FC = () => {
    // FIX: Changed state from name to email to match authentication logic.
    const [email, setEmail] = useState('');
    // FIX: Changed state from mentorId to password to match authentication logic.
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // FIX: The login function expects 2 arguments (email, password), not 3.
            const success = await login(email, password);
            if (success) {
                navigate('/mentor-dashboard');
            } else {
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm">
                <Card className="p-8 space-y-4 rounded-xl shadow-lg">
                    <div className="text-center">
                        <Logo />
                        <h2 className="text-3xl font-bold text-slate-800">Sign In</h2>
                        <p className="text-slate-500 mt-1">Welcome to the Attendance Portal</p>
                    </div>
                    
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <Input 
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="Email (e.g. rajesh.gupta@college.edu)"
                        />
                         <Input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Password (mentorpass)"
                        />
                        <div className="flex items-center justify-between text-sm pt-2">
                            <a href="#" className="font-medium text-blue-600 hover:underline">Sign up</a>
                            <a href="#" className="font-medium text-blue-600 hover:underline">Forgot password?</a>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full !mt-6 bg-[#0D2B4F] hover:bg-[#1E487B] text-white disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Signing in...' : 'Sign in'}</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default MentorLogin;
