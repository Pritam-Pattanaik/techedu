import React, { useState, useEffect, useMemo } from 'react';
import {
    BookOpen, Users, Download, Lock, LogOut,
    LayoutDashboard, Settings, FileText, ChevronRight,
    TrendingUp, Activity, Search, X,
    Phone, Mail, MapPin, Plus, Trash2, Save, ArrowLeft, LogIn
} from 'lucide-react';

// --- Configuration & Constants ---

// API Helper
const api = {
    get: async (endpoint) => {
        const res = await fetch(`/api${endpoint}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'API Error');
        }
        return res.json();
    },
    post: async (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const options = {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data)
        };
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        const res = await fetch(`/api${endpoint}`, options);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'API Error');
        }
        return res.json();
    },
    put: async (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const options = {
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data)
        };
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        const res = await fetch(`/api${endpoint}`, options);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'API Error');
        }
        return res.json();
    },
    delete: async (endpoint) => {
        const res = await fetch(`/api${endpoint}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.message || 'API Error');
        }
        return res.json();
    }
};



// --- Components ---

const Hero = () => (
    <div className="relative overflow-hidden bg-indigo-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 opacity-90"></div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl animate-slide-up">
                Master the Future with <span className="text-indigo-400">TechEdu</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-indigo-200 max-w-2xl mx-auto animate-fade-in delay-100">
                Industry-leading courses in Python, AI, and Full Stack Development.
                Download our comprehensive syllabus and start your journey today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in delay-200">
                <a href="#courses" className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all hover:scale-105">
                    Explore Courses
                </a>
            </div>
        </div>
    </div>
);

const CourseCard = ({ course, onDownload }) => (
    <div className="glass-card flex flex-col h-full group">
        <div className="h-48 overflow-hidden">
            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
            <p className="text-gray-600 mb-4 flex-1">{course.description}</p>
            <button
                onClick={() => onDownload(course)}
                className="mt-auto flex items-center justify-center w-full gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-medium rounded-lg transition-colors border border-transparent hover:border-indigo-200"
            >
                <Download size={18} />
                Download Syllabus
            </button>
        </div>
    </div>
);

const LeadModal = ({ isOpen, onClose, course, onSubmit }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ ...formData, courseId: course.id, courseTitle: course.title });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Download className="text-indigo-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Get the Syllabus</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Complete the form to download the syllabus for <span className="font-semibold text-indigo-600">{course?.title}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            required
                            type="tel"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Download Now'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- New Public Pages ---

const AboutPage = () => (
    <div className="max-w-7xl mx-auto px-6 py-24 animate-fade-in">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">About TechEdu</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Bridging the gap between academia and industry with cutting-edge technical training.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                    alt="Team collaboration"
                    className="rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-500"
                />
            </div>
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                    Founded in 2024, TechEdu was built on the belief that premium technology education should be accessible, practical, and career-oriented. We partner with industry leaders to design curriculums that prepare students for the real world.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="p-4 bg-indigo-50 rounded-xl">
                        <h4 className="font-bold text-indigo-700 text-3xl mb-1">500+</h4>
                        <p className="text-sm text-indigo-600">Graduates Placed</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                        <h4 className="font-bold text-purple-700 text-3xl mb-1">50+</h4>
                        <p className="text-sm text-purple-600">Corporate Partners</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ContactPage = () => (
    <div className="max-w-7xl mx-auto px-6 py-24 animate-fade-in">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Get in Touch</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Have questions about our courses or corporate training? We'd love to hear from you.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Visit Us</h3>
                        <p className="text-gray-600 mt-1">123 Tech Park, Innovation Blvd<br />San Francisco, CA 94105</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Email Us</h3>
                        <p className="text-gray-600 mt-1">admissions@techedu.com<br />support@techedu.com</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Phone size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Call Us</h3>
                        <p className="text-gray-600 mt-1">+1 (555) 123-4567<br />Mon-Fri, 9am - 6pm PST</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Message sent!"); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Doe" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="How can we help you?"></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    </div>
);

// --- Admin Components ---

const AdminLogin = ({ onLogin, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await onLogin(email, password);
            if (result.success) {
                // success handled by onLogin redirection or state update
            } else {
                setError(result.message || 'Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Lock className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            autoComplete="email"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            autoComplete="current-password"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Website
                    </button>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ leads, courses }) => {
    const stats = useMemo(() => {
        const totalLeads = leads.length;
        const last24h = leads.filter(l => {
            const date = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
            return (new Date() - date) < 24 * 60 * 60 * 1000;
        }).length;

        // Calculate most popular course
        const counts = {};
        leads.forEach(l => {
            counts[l.courseTitle] = (counts[l.courseTitle] || 0) + 1;
        });
        const popular = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

        return { totalLeads, last24h, popular: popular ? popular[0] : 'N/A' };
    }, [leads]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Leads</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalLeads}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Leads (24h)</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.last24h}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Top Course</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate max-w-[150px]" title={stats.popular}>
                                {stats.popular}
                            </h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {leads.slice(0, 5).map((lead, idx) => (
                        <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{lead.name}</p>
                                    <p className="text-sm text-slate-500">Downloaded {lead.courseTitle}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Just now'}
                            </span>
                        </div>
                    ))}
                    {leads.length === 0 && (
                        <div className="px-6 py-8 text-center text-slate-500">No leads yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LeadsTable = ({ leads }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">All Leads</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Interest</th>
                        <th className="px-6 py-3">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                            <td className="px-6 py-4">{lead.email}</td>
                            <td className="px-6 py-4">{lead.phone}</td>
                            <td className="px-6 py-4">{lead.courseTitle}</td>
                            <td className="px-6 py-4 text-slate-500">
                                {new Date(lead.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                    {leads.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No leads found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);



const CourseManager = ({ courses, onAddCourse, onEditCourse, onDeleteCourse }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [courseData, setCourseData] = useState({ title: '', description: '', image: '', syllabus: null, syllabusName: '' });
    const [loading, setLoading] = useState(false);

    // Reset form when opening/closing
    useEffect(() => {
        if (!isFormOpen) {
            setEditingId(null);
            setCourseData({ title: '', description: '', image: '', syllabus: null, syllabusName: '' });
        }
    }, [isFormOpen]);

    const handleEditClick = (course) => {
        setEditingId(course.id);
        setCourseData({
            title: course.title,
            description: course.description,
            image: course.image,
            syllabus: null, // Don't pre-fill file
            syllabusName: course.syllabusName || '' // Show existing file name
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Mandatory PDF for new courses
        if (!editingId && !courseData.syllabus) {
            alert("Please upload a syllabus PDF.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('title', courseData.title);
        formData.append('description', courseData.description);
        formData.append('image', courseData.image);
        if (courseData.syllabus) {
            formData.append('syllabus', courseData.syllabus);
        }

        if (editingId) {
            await onEditCourse(editingId, formData);
        } else {
            await onAddCourse(formData);
        }

        setLoading(false);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Course Management</h3>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                    {isFormOpen ? 'Cancel' : 'Add New Course'}
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-slide-up">
                    <div className="mb-4 text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                        {editingId ? 'Editing Course' : 'New Course Details'}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                <input required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={courseData.image} onChange={e => setCourseData({ ...courseData, image: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea required rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus PDF {editingId && '(Optional to update)'}</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                onChange={e => setCourseData({ ...courseData, syllabus: e.target.files[0] })}
                            />
                            {/* Show current file name */}
                            {(courseData.syllabus || courseData.syllabusName) && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Current file: <span className="font-semibold">{courseData.syllabus ? courseData.syllabus.name : courseData.syllabusName}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Course'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-100 flex gap-4 group hover:shadow-md transition-all">
                        <img src={course.image} alt={course.title} className="w-24 h-24 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{course.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{course.description}</p>
                            <div className="mt-3 flex gap-2">
                                {course.syllabusUrl && (
                                    <a href={course.syllabusUrl} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">View Syllabus</a>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleEditClick(course)} className="text-gray-400 hover:text-indigo-600 p-2 transition-colors">
                                <Settings size={18} />
                            </button>
                            <button onClick={() => onDeleteCourse(course.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsPanel = () => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [uploading, setUploading] = useState(false);
    const [ts] = useState(Date.now());

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/config/password', { password });
            setStatus({ type: 'success', msg: 'Password updated successfully' });
            setPassword('');
        } catch (err) {
            setStatus({ type: 'error', msg: 'Failed to update password' });
        }
        setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    };

    const handleAssetUpload = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('key', key);
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('/config/assets', formData);
            setStatus({ type: 'success', msg: `${key === 'site_logo' ? 'Logo' : 'Favicon'} updated! Reloading...` });
            // Force reload to see changes
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            setStatus({ type: 'error', msg: 'Upload failed' });
        }
        setUploading(false);
        setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Website Logo</label>
                        <div className="flex items-center gap-4">
                            <img src={`/api/assets/site_logo?t=${ts}`} onError={(e) => e.target.style.display = 'none'} className="h-10 w-10 object-contain border rounded p-1" />
                            <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'site_logo')}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Browser Favicon</label>
                        <div className="flex items-center gap-4">
                            <img src={`/api/assets/site_favicon?t=${ts}`} onError={(e) => e.target.style.display = 'none'} className="h-10 w-10 object-contain border rounded p-1" />
                            <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'site_favicon')}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">Security</h3>
                <form onSubmit={handleUpdatePassword} className="max-w-md">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Change Admin Password</label>
                    <div className="flex gap-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none flex-1"
                            placeholder="New password"
                            required
                        />
                        <button type="submit" disabled={uploading} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                            Update
                        </button>
                    </div>
                </form>
            </div>

            {status.msg && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium animate-fade-in ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {status.msg}
                </div>
            )}
        </div>
    );
};

const AdminPanel = ({ onLogout, courses, onAddCourse, onEditCourse, onDeleteCourse, ts }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [leads, setLeads] = useState([]);

    // Real-time listener for leads
    // Real-time listener for leads (Polling for MVP)
    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const data = await api.get('/leads');
                setLeads(data);
            } catch (err) {
                console.error("Fetch leads error", err);
            }
        };
        fetchLeads();
        const interval = setInterval(fetchLeads, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard leads={leads} />;
            case 'leads': return <LeadsTable leads={leads} />;
            case 'courses': return <CourseManager courses={courses} onAddCourse={onAddCourse} onEditCourse={onEditCourse} onDeleteCourse={onDeleteCourse} />;
            case 'settings': return <SettingsPanel />;
            default: return null;
        }
    };

    const NavItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === id
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
        >
            <Icon size={20} />
            {label}
        </button>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <img src={`/api/assets/site_logo?t=${ts}`} onError={(e) => e.target.style.display = 'none'} className="h-8 w-auto max-w-[150px]" alt="Logo" />
                    {/* Fallback Text if image fails loading or not set, managed via css/js ideally or simple toggle. For now, keep text as backup or main if no logo */}
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TechEdu</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="leads" icon={Users} label="Leads" />
                    <NavItem id="courses" icon={BookOpen} label="Courses" />
                    <NavItem id="settings" icon={Settings} label="Settings" />
                </nav>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-auto"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">Admin User</span>
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
                    </div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
};

// --- Main App Component ---

function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [activePage, setActivePage] = useState('home');
    const [courses, setCourses] = useState([]);
    const [ts] = useState(Date.now());

    // Initial load of courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await api.get('/courses');
                // If DB empty, fallback to empty array or show skeleton
                setCourses(data);
            } catch (err) {
                console.error("Fetch courses error", err);
            }
        };
        fetchCourses();
    }, []);

    // Dynamic Favicon Effect
    useEffect(() => {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = `/api/assets/site_favicon?t=${Date.now()}`;
        document.getElementsByTagName('head')[0].appendChild(link);
    }, []);

    // Scroll to section helper
    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    // We'll separate logic to act as a proper controller
    const handleSaveCourse = async (formData) => {
        try {
            const savedCourse = await api.post('/courses', formData);
            setCourses(prev => [...prev, savedCourse]);
        } catch (err) {
            alert("Failed to save course");
        }
    };

    const handleEditCourse = async (id, formData) => {
        try {
            const updated = await api.put(`/courses/${id}`, formData);
            setCourses(prev => prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            alert("Failed to update course");
        }
    };

    const handleDeleteCourse = async (id) => {
        if (confirm('Are you sure you want to delete this course?')) {
            try {
                await api.delete(`/courses/${id}`);
                setCourses(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                alert("Failed to delete course");
            }
        }
    };

    // In a real app, this would be fetched from Firestore
    // const courses = INITIAL_COURSES;

    const handleLeadSubmit = async (data) => {
        try {
            await api.post('/leads', data);

            // Force browser download
            const link = document.createElement('a');
            link.href = '/syllabus.pdf'; // Use local dummy PDF
            link.download = `Syllabus-${data.courseTitle.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`Thank you! The syllabus for ${data.courseTitle} has been downloaded.`);
        } catch (error) {
            console.error("Error submitting lead:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    const handleAdminLogin = async (email, password) => {
        try {
            // Basic hardcoded check for email, DB check for password as per requirements
            if (email !== 'admin@techedu.com') return false;

            const res = await api.post('/login', { password });
            if (res.success) {
                setIsAdmin(true);
                setShowAdminLogin(false);
                return { success: true };
            }
            return { success: false, message: res.message || 'Invalid credentials' };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Server error. Check DB connection.' };
        }
    };

    // Route logic (simple mock routing)
    const path = window.location.pathname;
    if (path === '/admin' && !isAdmin && !showAdminLogin) {
        setShowAdminLogin(true);
    }

    if (isAdmin) {
        return <AdminPanel
            ts={ts}
            onLogout={() => setIsAdmin(false)}
            courses={courses}
            onAddCourse={handleSaveCourse}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
        />;
    }

    if (showAdminLogin) {
        return <AdminLogin onLogin={handleAdminLogin} onBack={() => setShowAdminLogin(false)} />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={`/api/assets/site_logo?t=${ts}`} onError={(e) => e.target.style.display = 'none'} className="h-8 w-auto max-w-[150px]" alt="Logo" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            TechEdu
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActivePage('home')} className={`text-sm font-medium transition-colors ${activePage === 'home' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>Courses</button>
                        <button onClick={() => setActivePage('about')} className={`text-sm font-medium transition-colors ${activePage === 'about' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>About</button>
                        <button onClick={() => setActivePage('contact')} className={`text-sm font-medium transition-colors ${activePage === 'contact' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>Contact</button>
                        <button
                            onClick={() => setShowAdminLogin(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <LogIn size={16} /> Log In
                        </button>
                    </div>
                </div>
            </nav>

            {activePage === 'home' && (
                <>
                    <Hero />
                    <main className="max-w-7xl mx-auto px-6 py-24" id="courses">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Our Popular Courses</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Industry-relevant curriculum designed by experts. Download the syllabus to learn more about what we offer.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    onDownload={(c) => {
                                        setSelectedCourse(c);
                                        setShowLeadModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    </main>
                </>
            )}

            {activePage === 'about' && <AboutPage />}
            {activePage === 'contact' && <ContactPage />}

            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="text-indigo-400" />
                            <span className="text-xl font-bold">TechEdu</span>
                        </div>
                        <p className="text-slate-400 text-sm">Empowering the next generation of tech leaders.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-indigo-200">Courses</h4>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><button onClick={() => setActivePage('home')} className="hover:text-white transition-colors">Python Full Stack</button></li>
                            <li><button onClick={() => setActivePage('home')} className="hover:text-white transition-colors">Data Science</button></li>
                            <li><button onClick={() => setActivePage('home')} className="hover:text-white transition-colors">Java Enterprise</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-indigo-200">Company</h4>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><button onClick={() => setActivePage('about')} className="hover:text-white transition-colors">About Us</button></li>
                            <li><button onClick={() => setActivePage('contact')} className="hover:text-white transition-colors">Contact</button></li>
                            <li><button onClick={() => setActivePage('contact')} className="hover:text-white transition-colors">Careers</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 text-indigo-200">Connect</h4>
                        <div className="flex gap-4">
                            {/* Social icons would go here */}
                        </div>
                    </div>
                </div>
            </footer>

            <LeadModal
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                course={selectedCourse}
                onSubmit={handleLeadSubmit}
            />
        </div>
    );
}

export default App;
