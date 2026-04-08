import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { facultyService, studentService, mentorService } from '../services/apiStorageService';
import { Faculty, Student, Mentor } from '../types';

type ActiveTab = 'students' | 'faculty' | 'mentors';

const AdminManagement: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('students');
    
    // States for each entity type
    const [students, setStudents] = useState<Student[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);

    // Modal states
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentEntity, setCurrentEntity] = useState<Partial<Student | Faculty | Mentor> | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // State to trigger data reload
    const [dataVersion, setDataVersion] = useState(0);
    const forceReload = () => setDataVersion(v => v + 1);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.department) return;
            const dept = user.department;
            const [studentData, facultyData, mentorData] = await Promise.all([
                studentService.getAll(),
                facultyService.getAll(),
                mentorService.getAll()
            ]);
            
            setStudents(studentData.filter(s => s.department === dept));
            setFaculty(facultyData.filter(f => f.department === dept));
            setMentors(mentorData.filter(m => m.department === dept));
        };
        
        if (user?.department) {
            loadData();
        }
    }, [user, dataVersion]);


    const openAddModal = () => {
        setIsEditing(false);
        switch (activeTab) {
            case 'students':
                setCurrentEntity({ department: user?.department, section: 'A' });
                break;
            case 'faculty':
                setCurrentEntity({ department: user?.department, isActive: true });
                break;
            case 'mentors':
                setCurrentEntity({ department: user?.department, isActive: true });
                break;
        }
        setModalOpen(true);
    };

    const openEditModal = (entity: Student | Faculty | Mentor) => {
        setIsEditing(true);
        if ('email' in entity) { // Faculty or Mentor
             setCurrentEntity({ ...entity, password: '' });
        } else { // Student
            setCurrentEntity(entity);
        }
        setModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
            switch (activeTab) {
                case 'students': studentService.remove(id); break;
                case 'faculty': facultyService.remove(id); break;
                case 'mentors': mentorService.remove(id); break;
            }
            forceReload();
        }
    };


    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentEntity(null);
    };

    const handleSave = () => {
        if (!currentEntity) return;

        switch (activeTab) {
            case 'students':
                const student = currentEntity as Partial<Student>;
                if (!student.rollNo || !student.name) return alert('Roll No and Name are required.');
                if (isEditing) {
                    studentService.update(student.rollNo, student);
                } else {
                    studentService.add(student as Student);
                }
                break;

            case 'faculty':
                const fac = currentEntity as Partial<Faculty>;
                if (!fac.name || !fac.email) return alert('Name and Email are required.');
                if (isEditing && fac.id) {
                    const dataToSave: Partial<Faculty> = {...fac};
                    if(!dataToSave.password) delete dataToSave.password;
                    facultyService.update(fac.id, dataToSave);
                } else {
                    if (!fac.password) return alert('Password is required for new faculty.');
                    facultyService.add({ ...fac, id: `FAC${Date.now()}` } as Faculty);
                }
                break;

            case 'mentors':
                const mentor = currentEntity as Partial<Mentor>;
                if (!mentor.name || !mentor.email || !mentor.mentorId) return alert('Name, Email, and Mentor ID are required.');
                 if (isEditing && mentor.id) {
                    const dataToSave: Partial<Mentor> = {...mentor};
                    if(!dataToSave.password) delete dataToSave.password;
                    mentorService.update(mentor.id, dataToSave);
                } else {
                    if (!mentor.password) return alert('Password is required for new mentor.');
                    mentorService.add({ ...mentor, id: `MENTOR${Date.now()}` } as Mentor);
                }
                break;
        }
        forceReload();
        handleCloseModal();
    };
    
    const handleStatusToggle = (userToToggle: Faculty | Mentor) => {
        const service = 'mentorId' in userToToggle ? mentorService : facultyService;
        if (window.confirm(`Are you sure you want to ${userToToggle.isActive ? 'deactivate' : 'activate'} ${userToToggle.name}?`)) {
            service.update(userToToggle.id, { isActive: !userToToggle.isActive });
            forceReload();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentEntity(prev => prev ? ({ ...prev, [name]: value }) : null);
    };
     const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setCurrentEntity(prev => prev ? ({ ...prev, [name]: checked }) : null);
    };

    const TabButton: React.FC<{ tab: ActiveTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
                activeTab === tab 
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            {label}
        </button>
    );

    const renderTable = () => {
        switch (activeTab) {
            case 'students':
                return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="th">Roll No</th>
                                <th className="th">Name</th>
                                <th className="th">Section</th>
                                <th className="th">Mentor ID</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map(s => (
                                <tr key={s.rollNo}>
                                    <td className="td font-medium">{s.rollNo}</td>
                                    <td className="td">{s.name}</td>
                                    <td className="td">{s.section}</td>
                                    <td className="td">{s.mentorId}</td>
                                    <td className="td-actions">
                                        <button className="action-link text-red-600 hover:text-red-800" onClick={() => handleDelete(s.rollNo)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'faculty':
                 return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="th">Name</th>
                                <th className="th">Email</th>
                                <th className="th">Status</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {faculty.map(f => (
                                <tr key={f.id}>
                                    <td className="td font-medium">{f.name}</td>
                                    <td className="td">{f.email}</td>
                                    <td className="td">
                                        <span className={`status-pill ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {f.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        <button className="action-link text-blue-600 hover:text-blue-800" onClick={() => openEditModal(f)}>Edit</button>
                                        <button className={`action-link ${f.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`} onClick={() => handleStatusToggle(f)}>
                                            {f.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                         <button className="action-link text-red-600 hover:text-red-800" onClick={() => handleDelete(f.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'mentors':
                 return (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="th">Name</th>
                                <th className="th">Mentor ID</th>
                                <th className="th">Email</th>
                                <th className="th">Status</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {mentors.map(m => (
                                <tr key={m.id}>
                                    <td className="td font-medium">{m.name}</td>
                                     <td className="td">{m.mentorId}</td>
                                    <td className="td">{m.email}</td>
                                    <td className="td">
                                         <span className={`status-pill ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {m.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        <button className="action-link text-blue-600 hover:text-blue-800" onClick={() => openEditModal(m)}>Edit</button>
                                        <button className={`action-link ${m.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`} onClick={() => handleStatusToggle(m)}>
                                            {m.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button className="action-link text-red-600 hover:text-red-800" onClick={() => handleDelete(m.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
        }
    };
    
    const renderModalContent = () => {
        if (!currentEntity) return null;
        switch (activeTab) {
            case 'students':
                const student = currentEntity as Partial<Student>;
                return (
                    <div className="space-y-4">
                        <Input label="Roll No" name="rollNo" value={student.rollNo || ''} onChange={handleInputChange} required disabled={isEditing} variant="dark"/>
                        <Input label="Full Name" name="name" value={student.name || ''} onChange={handleInputChange} required variant="dark"/>
                        <Input label="Parent Contact" name="parentContact" value={student.parentContact || ''} onChange={handleInputChange} variant="dark"/>
                        <Input label="Mentor ID" name="mentorId" value={student.mentorId || ''} onChange={handleInputChange} required variant="dark"/>
                        <div>
                            <label htmlFor="section" className="block text-sm font-medium text-gray-300 mb-1">Section</label>
                            <select name="section" value={student.section || 'A'} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md shadow-sm bg-gray-800 border-gray-600 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                <option>A</option>
                                <option>B</option>
                            </select>
                        </div>
                        <Input label="Department" name="department" value={student.department || ''} disabled variant="light" />
                    </div>
                );
            case 'faculty':
                const fac = currentEntity as Partial<Faculty>;
                return (
                     <div className="space-y-4">
                        <Input label="Full Name" name="name" value={fac.name || ''} onChange={handleInputChange} required variant="dark"/>
                        <Input label="Email" type="email" name="email" value={fac.email || ''} onChange={handleInputChange} required variant="dark"/>
                        <Input label="Password" type="password" name="password" onChange={handleInputChange} placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter password"} required={!isEditing} variant="dark"/>
                        <Input label="Department" name="department" value={fac.department || ''} disabled variant="light" />
                         <div className="flex items-center">
                            <input type="checkbox" id="isActive" name="isActive" checked={fac.isActive} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">Account Active</label>
                        </div>
                    </div>
                );
             case 'mentors':
                const mentor = currentEntity as Partial<Mentor>;
                return (
                     <div className="space-y-4">
                        <Input label="Full Name" name="name" value={mentor.name || ''} onChange={handleInputChange} required variant="dark"/>
                        <Input label="Mentor ID" name="mentorId" value={mentor.mentorId || ''} onChange={handleInputChange} required variant="dark" placeholder="e.g. MENTOR_CSE_1"/>
                        <Input label="Email" type="email" name="email" value={mentor.email || ''} onChange={handleInputChange} required variant="dark"/>
                        <Input label="Password" type="password" name="password" onChange={handleInputChange} placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter password"} required={!isEditing} variant="dark"/>
                        <Input label="Department" name="department" value={mentor.department || ''} disabled variant="light" />
                         <div className="flex items-center">
                            <input type="checkbox" id="isActive" name="isActive" checked={mentor.isActive} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">Account Active</label>
                        </div>
                    </div>
                );
        }
    };
    
    const modalTitle = isEditing 
        ? `Edit ${activeTab.slice(0, 1).toUpperCase()}${activeTab.slice(1, -1)}`
        : `Add New ${activeTab.slice(0, 1).toUpperCase()}${activeTab.slice(1, -1)}`;

    return (
        <Layout>
             <style>{`
                .th { @apply px-6 py-3 text-left text-xs font-semibold text-slate-800 uppercase tracking-wider; }
                .td { @apply px-6 py-4 whitespace-nowrap text-sm text-gray-700; }
                .td-actions { @apply px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4; }
                .action-link { @apply font-semibold transition-colors duration-200; }
                .status-pill { @apply px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full; }
            `}</style>
            <div className="p-4 md:p-6">
              <Card>
                  <div className="p-6 flex flex-wrap justify-between items-center border-b gap-4">
                      <div>
                          <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Back to Dashboard
                          </button>
                          <h2 className="text-2xl font-bold capitalize">Manage {activeTab}</h2>
                      </div>
                      <Button onClick={openAddModal}>Add New {activeTab.slice(0, -1)}</Button>
                  </div>

                  <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                          <TabButton tab="students" label="Students" />
                          <TabButton tab="faculty" label="Faculty" />
                          <TabButton tab="mentors" label="Mentors" />
                      </nav>
                  </div>
                  
                  <div className="overflow-x-auto">
                      {renderTable()}
                  </div>
              </Card>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalTitle}>
                {renderModalContent()}
                <div className="mt-6 flex justify-end gap-4">
                    <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleSave}>{isEditing ? 'Save Changes' : `Add ${activeTab.slice(0, -1)}`}</Button>
                </div>
            </Modal>
        </Layout>
    );
};

export default AdminManagement;