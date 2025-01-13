import { create } from 'zustand';

export const useTransitionStore = create((set) => ({
    sourceRect: null,
    targetId: null,
    setTransitionData: (rect, id) => set(() => ({
        sourceRect: rect,
        targetId: id
    })),
    clearTransitionData: () => set(() => ({
        sourceRect: null,
        targetId: null
    })),
}));
