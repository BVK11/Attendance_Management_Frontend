import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'light' | 'dark';
}

const Input: React.FC<InputProps> = ({ label, id, variant = 'light', className, ...props }) => {
  const lightClasses = "border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900";
  const darkClasses = "bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        id={id}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${variant === 'light' ? lightClasses : darkClasses} ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
