/**
 * BMI UMS — Student Portal
 * Self-service view for role === 'student'
 * Shows own grades, transcript summary, and fee balance.
 */
import React, { useEffect, useState } from 'react';
import {
  GraduationCap, BookOpen, DollarSign, User,
  ChevronRight, TrendingUp, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authFetch } from '../services/authService';
import type { Grade } from '../services/gradeService';

interface FeeSummary {
  paid: number;
  pending: number;
  balance: number;
}

const StudentPortal: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [fees, setFees] = useState<FeeSummary>({ paid: 0, pending: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [gradesRes, txRes] = await Promise.all([
          authFetch(`/api/v1/grades?perPage=50`),
          authFetch(`/api/v1/finance/transactions?perPage=200`),
        ]);

        if (!cancelled) {
          const gradesJson = await gradesRes.json();
          if (gradesJson.success) setGrades(gradesJson.data?.items ?? []);

          const txJson = await txRes.json();
          if (txJson.success) {
            const txItems: Array<{status:string;amt:number}> = txJson.data ?? [];
            const paid    = txItems.filter(t => t.status === 'Paid').reduce((s,t) => s + t.amt, 0);
            const pending = txItems.filter(t => t.status === 'Pending').reduce((s,t) => s + t.amt, 0);
            setFees({ paid, pending, balance: pending });
          }
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load portal data. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Compute GPA from grades
  const gpa = grades.length
    ? (grades.reduce((s, g) => s + (g.gpa ?? 0), 0) / grades.length).toFixed(2)
    : '—';

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm">
        <div className="pl-14">
          <h1 className="text-lg font-black text-[#2E004F] dark:text-white uppercase tracking-tighter">
            Student Portal
          </h1>
          <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-widest">
            {user?.name} · Self-Service Academic Dashboard
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-none">
              <TrendingUp size={22} className="text-[#4B0082]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cumulative GPA</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{gpa}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-none">
              <BookOpen size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Courses Completed</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{grades.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-none">
              <DollarSign size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fee Balance</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                ${fees.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Grade table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <GraduationCap size={16} className="text-[#4B0082]" />
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">
              Academic Record
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-[#4B0082] rounded-full animate-spin" />
            </div>
          ) : grades.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm font-medium">
              No grade records found yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/40 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-semibold text-gray-800 dark:text-gray-200">
                      {g.courseName || g.courseCode}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{g.semester} {g.academicYear}</td>
                    <td className="px-6 py-3">{g.percentage ?? g.numericGrade ?? '—'}%</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-none ${
                        g.letterGrade?.startsWith('A') ? 'bg-emerald-100 text-emerald-700'
                        : g.letterGrade?.startsWith('B') ? 'bg-blue-100 text-blue-700'
                        : g.letterGrade?.startsWith('C') ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {g.letterGrade ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-[#4B0082] dark:text-purple-300">
                      {g.gpa?.toFixed(1) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fee status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign size={16} className="text-[#4B0082]" />
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Fee Account</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Paid</p>
              <p className="text-xl font-black text-emerald-600">${fees.paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Outstanding</p>
              <p className={`text-xl font-black ${fees.pending > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${fees.pending.toLocaleString()}
              </p>
            </div>
          </div>
          {fees.pending === 0 && (
            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <CheckCircle size={14} /> Account is clear — no outstanding balance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
