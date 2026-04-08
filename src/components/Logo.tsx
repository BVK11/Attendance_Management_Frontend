import React from 'react';

const Logo: React.FC = () => {
    return (
        <div className="mx-auto h-20 w-20 flex items-center justify-center mb-4">
            <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi4cQpLUQDjWH3n7zDVgiavL_SMg0IW8PlEA&s" 
                alt="Narayana Engineering College Logo" 
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default Logo;
