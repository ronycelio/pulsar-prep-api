import { create } from "zustand";

interface OnboardingState {
    track: "enem" | "vestibular" | "medicina" | null;
    level: "1" | "2" | "3" | "avancado" | null;
    dailyGoal: number | null;
    setTrack: (track: "enem" | "vestibular" | "medicina") => void;
    setLevel: (level: "1" | "2" | "3" | "avancado") => void;
    setDailyGoal: (goal: number) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    track: null,
    level: null,
    dailyGoal: null, // Default base goal

    setTrack: (track) => set({ track }),
    setLevel: (level) => set({ level }),
    setDailyGoal: (dailyGoal) => set({ dailyGoal }),

    reset: () => set({ track: null, level: null, dailyGoal: 10 }),
}));
