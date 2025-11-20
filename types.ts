
export enum GraphGrade {
  NO_DRAWING = "Nema crteža", // 0 pts
  BAD = "Loše", // 0 pts
  PARTIAL = "Djelomično", // 0.25 pts
  GOOD = "Dobro", // 1 pt
  EXCELLENT = "Odlično" // 1.25 pts
}

export enum CalcGrade {
  NOT_SOLVED = "Nije riješio", // 0 pts
  CORRECT = "Točno" // 1 pt
}

export interface QuestionScore {
  originalValue: number; // Value from Excel
  manualGrade: GraphGrade | CalcGrade | null; // Selected by user
  manualPoints: number; // Calculated points based on grade
  isDiscrepancy: boolean; // true if manualPoints != originalValue
}

export interface Student {
  id: string; // Internal UUID
  studentId: string; // "ID broj" from Excel
  surname: string;
  name: string;
  baseScore: number; // "Ocjena/30,00" (first 20 Qs)
  
  // Questions 21-25 (Graphs)
  q21: QuestionScore;
  q22: QuestionScore;
  q23: QuestionScore;
  q24: QuestionScore;
  q25: QuestionScore;

  // Questions 26-30 (Calculations)
  q26: QuestionScore;
  q27: QuestionScore;
  q28: QuestionScore;
  q29: QuestionScore;
  q30: QuestionScore;

  // Calculated Totals
  totalGraphPoints: number;
  totalCalcPoints: number;
  totalCorrection: number;
  finalResult: number;
  
  // Metadata
  originalRowIndex: number; // To help with export mapping
  rawRow?: any; // Store original data to preserve extra columns/structure
}

export interface SheetData {
  name: string;
  students: Student[];
}

export interface WorkbookData {
  filename: string;
  sheets: SheetData[];
}

// Mapping keys to make code cleaner
export type QuestionKey = 'q21' | 'q22' | 'q23' | 'q24' | 'q25' | 'q26' | 'q27' | 'q28' | 'q29' | 'q30';

export const GRAPH_QUESTIONS: QuestionKey[] = ['q21', 'q22', 'q23', 'q24', 'q25'];
export const CALC_QUESTIONS: QuestionKey[] = ['q26', 'q27', 'q28', 'q29', 'q30'];
