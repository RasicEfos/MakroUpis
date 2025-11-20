import React from 'react';
import { Student, GraphGrade, CalcGrade, GRAPH_QUESTIONS, CALC_QUESTIONS, QuestionKey } from '../types';
import { AlertTriangle } from 'lucide-react';

interface StudentRowProps {
  student: Student;
  onUpdate: (studentId: string, qKey: QuestionKey, grade: GraphGrade | CalcGrade) => void;
}

const StudentRow: React.FC<StudentRowProps> = React.memo(({ student, onUpdate }) => {
  
  const renderCell = (key: QuestionKey, isGraph: boolean) => {
    const qData = student[key];
    const isDiscrepancy = qData.isDiscrepancy;
    const currentGrade = qData.manualGrade;
    const currentPoints = qData.manualPoints;
    const originalVal = qData.originalValue;
    
    // Background Logic
    let cellBg = '';
    // Priority 1: Critical Mismatch (Orig 1 -> New 0)
    if (originalVal === 1 && currentPoints === 0) {
        cellBg = 'bg-red-200';
    } 
    // Priority 2: Excellent Score (1.25)
    else if (currentPoints === 1.25) {
        cellBg = 'bg-emerald-100';
    }
    // Priority 3: General Discrepancy
    else if (isDiscrepancy) {
        cellBg = 'bg-amber-50';
    }
    
    const textColor = (originalVal === 1 && currentPoints === 0) ? 'text-red-900' : (isDiscrepancy ? 'text-gray-900' : 'text-gray-700');

    // Graph Buttons Configuration - Removed 0.25 option as requested
    const graphButtons = [
      { label: '0', value: GraphGrade.NO_DRAWING, points: 0, color: 'hover:bg-red-100 hover:text-red-700 hover:border-red-300', active: 'bg-red-500 text-white border-red-600' },
      { label: '1', value: GraphGrade.GOOD, points: 1, color: 'hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300', active: 'bg-blue-500 text-white border-blue-600' },
      { label: '★', value: GraphGrade.EXCELLENT, points: 1.25, color: 'hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300', active: 'bg-emerald-500 text-white border-emerald-600' },
    ];

    // Calc Buttons Configuration
    const calcButtons = [
      { label: '0', value: CalcGrade.NOT_SOLVED, points: 0, color: 'hover:bg-red-100 hover:text-red-700 hover:border-red-300', active: 'bg-red-500 text-white border-red-600' },
      { label: '1', value: CalcGrade.CORRECT, points: 1, color: 'hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300', active: 'bg-blue-500 text-white border-blue-600' },
    ];

    const buttons = isGraph ? graphButtons : calcButtons;

    return (
      <td key={key} className={`px-2 py-2 border-b border-gray-200 align-top transition-colors duration-200 ${cellBg}`}>
        <div className="flex flex-col gap-1 min-w-[130px]">
          {/* Quick Action Buttons */}
          <div className="flex rounded-md shadow-sm gap-1" role="group">
            {buttons.map((btn) => {
              const isActive = currentGrade === btn.value;
              return (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => onUpdate(student.id, key, btn.value)}
                  title={`${btn.value} (${btn.points} pts)`}
                  className={`
                    flex-1 py-1.5 px-1 text-xs font-bold border rounded-md transition-all duration-75 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                    ${isActive ? btn.active : 'bg-white/80 hover:bg-white text-gray-600 border-gray-300 ' + btn.color}
                  `}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
          
          {/* Info Row */}
          <div className="flex justify-between items-center px-1 mt-1 h-5">
             {/* Increased visibility for Origin */}
             <span title="Original value from Excel" className="text-gray-500 text-xs font-medium tabular-nums">
               Orig: {qData.originalValue}
             </span>
             
             {/* Display current points */}
             <div className="flex items-center gap-1">
                <span className={`font-bold text-sm tabular-nums ${textColor}`}>
                    {qData.manualPoints}
                </span>
                {isDiscrepancy && (
                    <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${originalVal === 1 && currentPoints === 0 ? 'text-red-600' : 'text-amber-500'}`} title="Mismatch" />
                )}
             </div>
          </div>
        </div>
      </td>
    );
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Sticky Identity Columns - Fixed Widths */}
      <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 border-b border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[180px] min-w-[180px] max-w-[180px] truncate">
        {student.surname}
      </td>
      <td className="sticky left-[180px] z-20 bg-white group-hover:bg-gray-50 px-4 py-3 text-sm text-gray-600 border-b border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[150px] min-w-[150px] max-w-[150px] truncate">
        {student.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-200 font-mono">
        {student.studentId}
      </td>

      {/* Base Score */}
      <td className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200 bg-gray-50/50 text-center">
        {student.baseScore.toFixed(2)}
      </td>

      {/* Graphs Q21-25 */}
      {GRAPH_QUESTIONS.map(k => renderCell(k, true))}

      {/* Calcs Q26-30 */}
      {CALC_QUESTIONS.map(k => renderCell(k, false))}

      {/* Stats */}
      <td className="px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-200 bg-blue-50/30 font-mono text-right">
        {student.totalGraphPoints.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-200 bg-blue-50/30 font-mono text-right">
        {student.totalCalcPoints.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-base font-bold text-indigo-700 border-b border-gray-200 bg-indigo-50/50 font-mono text-right">
        {student.finalResult.toFixed(2)}
      </td>
    </tr>
  );
});

export default StudentRow;