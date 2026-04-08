import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
          Student Attendance Management
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Please select your role to login.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RoleCard
            role="Faculty"
            description="Mark and manage student attendance for your classes."
            link="/faculty-login"
            color="blue"
          />
          <RoleCard
            role="HOD / Admin"
            description="View departmental statistics and manage records."
            link="/hod-login"
            color="red"
          />
          <RoleCard
            role="Mentor"
            description="View attendance alerts for your assigned students."
            link="/mentor-login"
            color="green"
          />
        </div>
      </div>
    </div>
  );
};

interface RoleCardProps {
    role: string;
    description: string;
    link: string;
    color: 'blue' | 'red' | 'green';
}

const RoleCard: React.FC<RoleCardProps> = ({ role, description, link, color }) => {
    const colors = {
        blue: 'hover:border-blue-500 hover:shadow-blue-500/20',
        red: 'hover:border-red-500 hover:shadow-red-500/20',
        green: 'hover:border-green-500 hover:shadow-green-500/20'
    }
    return (
         <Link to={link}>
            <Card className={`p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent ${colors[color]} hover:shadow-xl`}>
                <h2 className={`text-2xl font-bold text-gray-800 mb-3`}>{role}</h2>
                <p className="text-gray-600">{description}</p>
            </Card>
        </Link>
    );
};

export default HomePage;