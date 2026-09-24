import { create } from 'zustand';
import { SelfCheckReport } from '../types/self-check';
import { readStorage, storageKeys, writeStorage } from '../utils/storage';

interface SelfCheckState {
  reports: Record<string, SelfCheckReport>;
  saveReport: (report: SelfCheckReport) => void;
}

export const useSelfCheckStore = create<SelfCheckState>((set, get) => ({
  reports: readStorage<Record<string, SelfCheckReport>>(storageKeys.selfCheck, {}),
  saveReport: (report) => {
    set((state) => ({ reports: { ...state.reports, [report.resumeId]: report } }));
    writeStorage(storageKeys.selfCheck, get().reports);
  },
}));
