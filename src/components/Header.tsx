
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_THEMES } from '../constants';
import { UserRole } from '../types';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) {
        return null;
    }

    const theme = ROLE_THEMES[user.role as UserRole];
    const isSpecialRole = user.role === UserRole.Hod || user.role === UserRole.Student;

    const navLinks = [
        { name: 'Dashboard', path: `/${user.role.toLowerCase()}-dashboard` },
        ...(user.role === UserRole.Student ? [
            { name: 'My Attendance', path: '/student-attendance' },
            { name: 'Timetable', path: '/student-timetable' },
        ] : [])
    ];

    return (
        <header className={`${isSpecialRole ? `${theme.bg} text-white` : 'bg-white text-gray-800'} shadow-sm`}>
            <div className="container mx-auto px-4 md:px-6 py-3 flex flex-wrap justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="https://cdn.adscientificindex.com/logos/18648.png" alt="Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
                        <span className="text-xl font-bold hidden sm:block">Attendance Portal</span>
                    </Link>
                    
                    {user.role === UserRole.Student && (
                        <nav className="hidden md:flex gap-4">
                            {navLinks.map(link => (
                                <Link 
                                    key={link.path} 
                                    to={link.path}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        location.pathname === link.path ? 'bg-white/20' : 'hover:bg-white/10'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className={`text-xs ${isSpecialRole ? 'opacity-80' : 'text-gray-500'}`}>
                            {user.role} Portal {user.rollNo ? `| ${user.rollNo}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className={`font-semibold py-1.5 px-3 rounded-md transition-colors duration-200 text-xs ${isSpecialRole ? 'bg-white/90 hover:bg-white text-indigo-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                        Logout
                    </button>
                </div>
            </div>
            
            {/* Mobile Nav for Student */}
            {user.role === UserRole.Student && (
                <div className="md:hidden border-t border-white/10 flex justify-around py-2">
                    {navLinks.map(link => (
                        <Link 
                            key={link.path} 
                            to={link.path}
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                                location.pathname === link.path ? 'bg-white/20' : ''
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
};

export default Header;
