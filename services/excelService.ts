
import * as XLSX from 'xlsx';
import { WorkbookData, SheetData, Student, QuestionKey, GRAPH_QUESTIONS, CALC_QUESTIONS } from '../types';
import { inferGraphGrade, inferCalcGrade, calculateStudentTotals } from '../utils/gradingLogic';

// Map Excel column headers to internal logic
const COL_MAP = {
  SURNAME: "Prezime",
  NAME: "Ime",
  ID: "ID broj",
  BASE_SCORE: "Ocjena/30,00",
};

// Helper to generate keys P21...P30
const getQCol = (num: number) => `P: ${num} /1,00`;

// Column names for summary stats
const COL_CORRECTION_GRAPH = "Korekcija graf";
const COL_CORRECTION_CALC = "KOREKCIJA RAČ";
const COL_CORRECTION_TOTAL = "KOREKCIJA -  Ukupna";
const COL_FINAL = "KONAČNI REZULTAT";

export const parseExcelFile = async (file: File): Promise<WorkbookData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // Use defaults to parse data
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          const students: Student[] = jsonData.map((row, index) => {
            const initialStudent: any = {
              id: crypto.randomUUID(),
              originalRowIndex: index, // This corresponds to index in sheet_to_json array
              studentId: row[COL_MAP.ID] || "",
              surname: row[COL_MAP.SURNAME] || "",
              name: row[COL_MAP.NAME] || "",
              baseScore: parseFloat(row[COL_MAP.BASE_SCORE]) || 0,
              rawRow: row, // Store original data
              
              // Initialize placeholders
              totalGraphPoints: 0,
              totalCalcPoints: 0,
              totalCorrection: 0,
              finalResult: 0
            };

            // Populate Question Data
            [...GRAPH_QUESTIONS, ...CALC_QUESTIONS].forEach((key) => {
                const qNum = parseInt(key.substring(1));
                const colKey = getQCol(qNum);
                const originalVal = parseFloat(row[colKey]) || 0;
                
                let inferredGrade = null;
                if (qNum <= 25) {
                    inferredGrade = inferGraphGrade(originalVal);
                } else {
                    inferredGrade = inferCalcGrade(originalVal);
                }

                initialStudent[key] = {
                    originalValue: originalVal,
                    manualGrade: inferredGrade,
                    manualPoints: originalVal,
                    isDiscrepancy: false
                };
            });

            // Calculate initial totals
            return calculateStudentTotals(initialStudent as Student);
          });

          return { name: sheetName, students };
        });

        resolve({ filename: file.name, sheets });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = async (originalFile: File, workbookData: WorkbookData) => {
  // 1. Read the original file deeply to preserve styles/structure
  const arrayBuffer = await originalFile.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true, cellStyles: true, cellNF: true });

  // 2. Iterate over our app data
  workbookData.sheets.forEach(sheetData => {
    const ws = wb.Sheets[sheetData.name];
    if (!ws || !ws['!ref']) return;

    // 3. Map Headers to Column Indices (0-based)
    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = range.s.r; // Assuming header is at the start of the range
    
    const headers: { [key: string]: number } = {};
    
    // Scan the header row to find where our target columns are
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
      const cell = ws[cellAddr];
      if (cell && cell.v) {
        const headerVal = String(cell.v).trim();
        headers[headerVal] = C;
      }
    }

    // 4. Update Student Rows
    sheetData.students.forEach(student => {
      // Calculate the actual Excel row index.
      // sheet_to_json (default) reads from the range. Index 0 is the first row AFTER header.
      // So Actual Row = HeaderRow + 1 + originalRowIndex
      const rowIndex = headerRowIndex + 1 + student.originalRowIndex;

      // Helper to update a cell
      const updateCell = (colName: string, val: number) => {
        const colIndex = headers[colName];
        if (colIndex !== undefined) {
          const cellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          
          // If cell doesn't exist, create it
          if (!ws[cellAddr]) {
            ws[cellAddr] = { t: 'n', v: val };
          } else {
            // Update existing cell
            ws[cellAddr].v = val;
            ws[cellAddr].t = 'n'; // Ensure type is number
            // We leave .s (style) and other props intact if they exist
          }
        }
      };

      // Update Questions 21-30
      [...GRAPH_QUESTIONS, ...CALC_QUESTIONS].forEach((key) => {
        const qNum = parseInt(key.substring(1));
        const colName = getQCol(qNum);
        updateCell(colName, student[key as QuestionKey].manualPoints);
      });

      // Update Summary Stats
      updateCell(COL_CORRECTION_GRAPH, student.totalGraphPoints);
      updateCell(COL_CORRECTION_CALC, student.totalCalcPoints);
      updateCell(COL_CORRECTION_TOTAL, student.totalCorrection);
      updateCell(COL_FINAL, student.finalResult);
    });
  });

  // 5. Write and Download
  XLSX.writeFile(wb, `Graded_${workbookData.filename}`, { bookSST: true, type: 'binary' });
};
