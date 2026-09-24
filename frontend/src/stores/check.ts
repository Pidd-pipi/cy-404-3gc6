import { create } from 'zustand';
import { CheckReport } from '../utils/resume-check';

interface CheckState {
  reports: Record<string, CheckReport>;
  saveReport: (resumeId: string, report: CheckReport) => void;
}

export const useCheckStore = create<CheckState>((set) => ({
  reports: {},
  saveReport: (resumeId, report) =>
    set((state) => ({ reports: { ...state.reports, [resumeId]: report } })),
}));
