import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Student } from '../types';
import { FileSpreadsheet, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatsDashboardProps {
  students: Student[];
  sheetName: string;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ students, sheetName }) => {
  const totalStudents = students.length;
  const passedStudents = students.filter(s => s.finalResult >= 15).length; // Assuming 50% pass for demo
  const discrepancies = students.reduce((acc, s) => {
    const hasDisc = Object.values(s).some(v => (typeof v === 'object' && v !== null && 'isDiscrepancy' in v && v.isDiscrepancy));
    return acc + (hasDisc ? 1 : 0);
  }, 0);

  const averageScore = students.reduce((acc, s) => acc + s.finalResult, 0) / (totalStudents || 1);

  // Distribution Data
  const distribution = [
    { name: '0-10', count: students.filter(s => s.finalResult < 10).length },
    { name: '10-15', count: students.filter(s => s.finalResult >= 10 && s.finalResult < 15).length },
    { name: '15-20', count: students.filter(s => s.finalResult >= 15 && s.finalResult < 20).length },
    { name: '20-25', count: students.filter(s => s.finalResult >= 20 && s.finalResult < 25).length },
    { name: '25-30', count: students.filter(s => s.finalResult >= 25).length },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      {/* Cards */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="p-3 bg-green-100 rounded-full text-green-600">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Discrepancies</p>
          <p className="text-2xl font-bold text-gray-900">{discrepancies}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1 h-32 lg:h-auto flex flex-col justify-center">
         <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Score Distribution</h4>
         <ResponsiveContainer width="100%" height={100}>
            <BarChart data={distribution}>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index > 2 ? '#4f46e5' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsDashboard;