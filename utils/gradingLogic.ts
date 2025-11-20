import { GraphGrade, CalcGrade, Student, QuestionKey, GRAPH_QUESTIONS, CALC_QUESTIONS } from '../types';

export const getPointsForGraph = (grade: GraphGrade | null): number => {
  switch (grade) {
    case GraphGrade.NO_DRAWING: return 0;
    case GraphGrade.BAD: return 0;
    case GraphGrade.PARTIAL: return 0.25;
    case GraphGrade.GOOD: return 1;
    case GraphGrade.EXCELLENT: return 1.25;
    default: return 0;
  }
};

export const getPointsForCalc = (grade: CalcGrade | null): number => {
  switch (grade) {
    case CalcGrade.NOT_SOLVED: return 0;
    case CalcGrade.CORRECT: return 1;
    default: return 0;
  }
};

// Helper to determine initial enum based on Excel number (reverse engineering)
export const inferGraphGrade = (val: number): GraphGrade | null => {
  if (val === 1.25) return GraphGrade.EXCELLENT;
  if (val === 1) return GraphGrade.GOOD;
  if (val === 0.25) return GraphGrade.PARTIAL;
  if (val === 0) return GraphGrade.NO_DRAWING; // Defaulting to "No drawing" for 0, user can change to "Bad"
  return null;
};

export const inferCalcGrade = (val: number): CalcGrade | null => {
  if (val === 1) return CalcGrade.CORRECT;
  if (val === 0) return CalcGrade.NOT_SOLVED;
  return null;
};

export const calculateStudentTotals = (student: Student): Student => {
  // Create a shallow copy of the student to start
  const newStudent = { ...student };
  
  let graphSum = 0;
  let calcSum = 0;

  // Calculate Graphs - Create new objects for questions to avoid mutation
  GRAPH_QUESTIONS.forEach((key) => {
    const currentQ = newStudent[key];
    const points = getPointsForGraph(currentQ.manualGrade as GraphGrade);
    
    newStudent[key] = {
      ...currentQ,
      manualPoints: points,
      isDiscrepancy: points !== currentQ.originalValue
    };
    
    graphSum += points;
  });

  // Calculate Calcs
  CALC_QUESTIONS.forEach((key) => {
    const currentQ = newStudent[key];
    const points = getPointsForCalc(currentQ.manualGrade as CalcGrade);
    
    newStudent[key] = {
      ...currentQ,
      manualPoints: points,
      isDiscrepancy: points !== currentQ.originalValue
    };

    calcSum += points;
  });

  const totalCorrection = graphSum + calcSum;
  
  // Final = Base + Correction.
  const finalResult = newStudent.baseScore + totalCorrection;

  return {
    ...newStudent,
    totalGraphPoints: parseFloat(graphSum.toFixed(2)),
    totalCalcPoints: parseFloat(calcSum.toFixed(2)),
    totalCorrection: parseFloat(totalCorrection.toFixed(2)),
    finalResult: parseFloat(finalResult.toFixed(2)),
  };
};