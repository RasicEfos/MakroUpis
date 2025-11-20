import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Download, Filter, Search, Layers } from 'lucide-react';
import { WorkbookData, GraphGrade, CalcGrade, QuestionKey } from './types';
import { parseExcelFile, exportToExcel } from './services/excelService';
import { calculateStudentTotals } from './utils/gradingLogic';
import StudentRow from './components/StudentRow';
import StatsDashboard from './components/StatsDashboard';

function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookData | null>(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscrepancy, setFilterDiscrepancy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalFile(file);
      setIsLoading(true);
      try {
        const data = await parseExcelFile(file);
        setWorkbook(data);
        setActiveSheetIndex(0);
      } catch (error) {
        console.error("Failed to parse", error);
        alert("Error parsing Excel file. Please ensure columns match the template.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Student Update
  const handleStudentUpdate = useCallback((studentId: string, qKey: QuestionKey, grade: GraphGrade | CalcGrade) => {
    setWorkbook((prev) => {
      if (!prev) return null;

      // 1. Copy the sheets array
      const newSheets = [...prev.sheets];
      const currentSheetIndex = activeSheetIndex;
      
      // 2. Copy the specific sheet object
      const currentSheet = { ...newSheets[currentSheetIndex] };
      
      // 3. Copy the students array
      const newStudents = [...currentSheet.students];
      
      const studentIndex = newStudents.findIndex(s => s.id === studentId);
      if (studentIndex === -1) return prev;

      // 4. Copy the student object and the specific question object to be updated
      const studentToUpdate = { ...newStudents[studentIndex] };
      studentToUpdate[qKey] = {
        ...studentToUpdate[qKey],
        manualGrade: grade
      };

      // 5. Recalculate totals (this returns a new student object with updated point values)
      const recalculatedStudent = calculateStudentTotals(studentToUpdate);
      
      // 6. Update the structure
      newStudents[studentIndex] = recalculatedStudent;
      currentSheet.students = newStudents;
      newSheets[currentSheetIndex] = currentSheet;
      
      return { ...prev, sheets: newSheets };
    });
  }, [activeSheetIndex]);

  // Handle Export
  const handleExport = async () => {
    if (!originalFile || !workbook) return;
    setIsExporting(true);
    try {
      await exportToExcel(originalFile, workbook);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filter Logic
  const activeSheet = workbook?.sheets[activeSheetIndex];
  
  const filteredStudents = useMemo(() => {
    if (!activeSheet) return [];
    return activeSheet.students.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDiscrepancy = filterDiscrepancy 
        ? Object.values(s).some(v => (typeof v === 'object' && v !== null && 'isDiscrepancy' in v && v.isDiscrepancy))
        : true;

      return matchesSearch && matchesDiscrepancy;
    });
  }, [activeSheet, searchQuery, filterDiscrepancy]);

  // Render Empty State
  if (!workbook) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <Layers className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GradeMaster Pro</h1>
          <p className="text-gray-500 mb-8">Upload your exam Excel file to start grading graphs and calculations with automated scoring.</p>
          
          <label className="relative cursor-pointer bg-white rounded-xl px-8 py-6 shadow-sm border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex flex-col items-center">
            <Upload className="w-10 h-10 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Select Excel File</span>
            <span className="text-xs text-gray-400 mt-1">.xlsx supported</span>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          {isLoading && <p className="mt-4 text-indigo-600 animate-pulse">Processing workbook...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div className="flex items-center gap-3">
           <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Layers className="text-white w-5 h-5" />
           </div>
           <h1 className="text-xl font-bold text-gray-900 tracking-tight">GradeMaster <span className="text-indigo-600">Pro</span></h1>
           <span className="text-sm text-gray-400 border-l border-gray-300 pl-3 ml-3">{workbook.filename}</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
             <label className="cursor-pointer">
               <select 
                 className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1 pl-2 pr-8"
                 value={activeSheetIndex}
                 onChange={(e) => setActiveSheetIndex(Number(e.target.value))}
               >
                 {workbook.sheets.map((s, i) => (
                   <option key={i} value={i}>{s.name}</option>
                 ))}
               </select>
             </label>
           </div>
           <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
           >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? 'Saving...' : 'Export Excel'}
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-gray-50 flex flex-col relative">
        
        {/* Toolbar */}
        <div className="px-6 py-4 shrink-0">
          <StatsDashboard students={activeSheet?.students || []} sheetName={activeSheet?.name || ''} />

          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search ID or Name..." 
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setFilterDiscrepancy(!filterDiscrepancy)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${filterDiscrepancy ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Filter size={16} />
                {filterDiscrepancy ? 'Showing Discrepancies' : 'Filter Issues'}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredStudents.length} of {activeSheet?.students.length} students
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto px-6 pb-6 custom-scrollbar">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
              <table className="w-full whitespace-nowrap text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="sticky top-0 left-0 z-50 bg-gray-50 w-[180px] min-w-[180px] px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Surname</th>
                    <th rowSpan={2} className="sticky top-0 left-[180px] z-50 bg-gray-50 w-[150px] min-w-[150px] px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Name</th>
                    <th rowSpan={2} className="sticky top-0 z-40 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">ID</th>
                    <th rowSpan={2} className="sticky top-0 z-40 bg-gray-50 px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Score<br/>/30</th>
                    
                    <th colSpan={5} className="sticky top-0 z-40 px-4 py-2 text-xs font-bold text-center text-indigo-600 uppercase tracking-wider bg-indigo-50 border-b border-indigo-100 border-l border-r h-[40px]">
                      Graphs (Q21-25)
                    </th>
                    <th colSpan={5} className="sticky top-0 z-40 px-4 py-2 text-xs font-bold text-center text-blue-600 uppercase tracking-wider bg-blue-50 border-b border-blue-100 border-r h-[40px]">
                      Calculations (Q26-30)
                    </th>

                    <th rowSpan={2} className="sticky top-0 z-40 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-50 border-b border-gray-200">Graph Σ</th>
                    <th rowSpan={2} className="sticky top-0 z-40 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-50 border-b border-gray-200">Calc Σ</th>
                    <th rowSpan={2} className="sticky top-0 z-40 px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wider text-right bg-indigo-50 border-b border-gray-200">Final</th>
                  </tr>
                  <tr>
                    {/* Sub-headers for questions - Sticky Top needs to account for the row above */}
                    {['21', '22', '23', '24', '25'].map(n => (
                      <th key={n} className="sticky top-[40px] z-30 px-2 py-2 text-[10px] text-center text-gray-500 font-medium border-b border-gray-200 bg-indigo-50/50 w-36 border-r border-dashed border-indigo-200 last:border-r-0">P:{n}</th>
                    ))}
                    {['26', '27', '28', '29', '30'].map(n => (
                      <th key={n} className="sticky top-[40px] z-30 px-2 py-2 text-[10px] text-center text-gray-500 font-medium border-b border-gray-200 bg-blue-50/50 w-36 border-r border-dashed border-blue-200 last:border-r-0">P:{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <StudentRow 
                        key={student.id} 
                        student={student} 
                        onUpdate={handleStudentUpdate} 
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={16} className="px-6 py-10 text-center text-gray-500">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;