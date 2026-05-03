
import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  Plus, 
  ArrowUpRight, 
  Search,
  Bell,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';
import StudentRegistrationModal from './StudentRegistrationModal';
import { Student } from '../types';

interface DashboardProps {
  userName: string;
  theme: string;
  onNavigate: (view: string) => void;
  stats: {
    students: number;
    admissions: number;
    tuition: number;
    events: number;
  };
  onAddStudent: (student: Student) => void;
  onAddTransaction: (amt: number) => void;
}

const revenueTrend = [
  { month: 'Jan', revenue: 120000 },
  { month: 'Feb', revenue: 145000 },
  { month: 'Mar', revenue: 210000 },
  { month: 'Apr', revenue: 190000 },
  { month: 'May', revenue: 250000 },
  { month: 'Jun', revenue: 389000 },
];

const Dashboard: React.FC<DashboardProps> = ({ userName, theme, onNavigate, stats, onAddStudent, onAddTransaction }) => {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const [activeModal, setActiveModal] = useState<'attendance' | 'transaction' | 'sms' | null>(null);
  const [isStudentRegistrationOpen, setIsStudentRegistrationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, msg: string}>({ show: false, msg: '' });
  
  const [formData, setFormData] = useState({
    studentName: '',
    transactionAmount: '',
    smsMessage: '',
    attendanceCourse: 'CS101'
  });

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setFormData({ studentName: '', transactionAmount: '', smsMessage: '', attendanceCourse: 'CS101' });
    setIsLoading(false);
  };

  const handleStudentEnrolled = (student: Student) => {
    onAddStudent(student);
    showToast(`Institutional Record committed to registry.`);
    setIsStudentRegistrationOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Sticky Header - Compact & Padded */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm min-h-[60px]">
        <div className="pl-14 w-full md:w-auto">
          <h1 className="text-base md:text-lg font-black text-[#2E004F] dark:text-white tracking-tighter uppercase leading-none">
            Executive Dashboard
          </h1>
          <p className="text-[8px] md:text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-widest">
            {userName} • {currentDate}
          </p>
        </div>
        <div className="flex gap-3 pl-14 md:pl-0 w-full md:w-auto justify-end">
           <button className="p-1.5 bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-[#4B0082] transition-colors relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
           </button>
           <button 
             onClick={() => setIsStudentRegistrationOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-[#4B0082] text-white rounded-none shadow-xl hover:bg-black transition-all font-black text-[9px] uppercase tracking-widest border border-[#FFD700]/30"
           >
             <Plus size={12} className="text-[#FFD700]" /> New Admission
           </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Students" 
            value={stats.students.toLocaleString()} 
            subText="+12% from last term" 
            color="purple" 
            icon={<Users size={24} className="text-white" />} 
          />
          <StatCard 
            title="YTD Revenue" 
            value={`$${stats.tuition.toLocaleString()}`} 
            subText="+8.4% fiscal growth" 
            color="amber" 
            icon={<DollarSign size={24} className="text-[#4B0082]" />} 
          />
          <StatCard 
            title="New Admissions" 
            value={stats.admissions.toString()} 
            subText="Current intake cycle" 
            color="emerald" 
            icon={<GraduationCap size={24} className="text-emerald-600" />} 
          />
          <StatCard 
            title="Upcoming Events" 
            value={stats.events.toString()} 
            subText="Next 7 days" 
            color="blue" 
            icon={<Calendar size={24} className="text-blue-600" />} 
          />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Financial Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-[0.25em] text-gray-900 dark:text-white flex items-center gap-2">
                   <TrendingUp size={16} className="text-[#4B0082]" /> Financial Performance
                </h3>
                <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-[#4B0082]">View Report</button>
             </div>
             <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4B0082" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4B0082" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      cursor={{ stroke: '#4B0082', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4B0082" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Quick Actions & Activity */}
          <div className="space-y-6">
             <div className="bg-[#4B0082] p-8 text-white relative overflow-hidden shadow-xl border-l-4 border-[#FFD700]">
                <div className="relative z-10">
                   <h3 className="font-black text-lg uppercase tracking-tight mb-2">Chancellor's Note</h3>
                   <p className="text-xs font-medium leading-relaxed opacity-90 mb-6">
                      "Excellence is not an act, but a habit. Ensure all departmental audits are submitted by Friday."
                   </p>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFD700] hover:underline">
                      View Directive <ArrowUpRight size={14} />
                   </button>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10">
                   <GraduationCap size={120} />
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-[0.25em] text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                   <Activity size={16} className="text-[#4B0082]" /> Recent Activity
                </h3>
                <div className="space-y-6">
                   {[
                     { action: 'New Student Registered', time: '2 mins ago', user: 'Admin', icon: CheckCircle2, color: 'text-emerald-500' },
                     { action: 'Tuition Payment ($2,500)', time: '15 mins ago', user: 'Finance', icon: DollarSign, color: 'text-blue-500' },
                     { action: 'Server Maintenance Alert', time: '1 hr ago', user: 'System', icon: Activity, color: 'text-amber-500' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-start gap-4 group">
                        <div className={`mt-0.5 ${item.color}`}>
                           <item.icon size={16} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-tight group-hover:text-[#4B0082] transition-colors">{item.action}</p>
                           <p className="text-[10px] text-gray-400 font-medium">{item.user} • {item.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <StudentRegistrationModal 
        isOpen={isStudentRegistrationOpen}
        onClose={() => setIsStudentRegistrationOpen(false)}
        onSuccess={handleStudentEnrolled}
      />

      {/* Toast */}
      {toast.show && (
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[150] animate-fade-in">
             <div className="bg-gray-900 text-[#FFD700] px-10 py-5 rounded-none shadow-2xl flex items-center gap-4 border-2 border-[#FFD700] backdrop-blur-xl">
               <CheckCircle2 size={24} className="animate-pulse" />
               <span className="font-black text-xs uppercase tracking-[0.15em]">{toast.msg}</span>
             </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
