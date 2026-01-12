
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  ollamaHost: string;
  ollamaModel: string;
  toggleTheme: () => void;
  setOllamaConfig: (host: string, model: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      // Default to env var or localhost
      ollamaHost: (import.meta as any).env?.VITE_OLLAMA_HOST || 'http://localhost:11434',
      ollamaModel: (import.meta as any).env?.VITE_OLLAMA_MODEL || 'qwen3:8b',
      
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setOllamaConfig: (host, model) => set({ ollamaHost: host, ollamaModel: model }),
    }),
    {
      name: 'edi-insight-storage',
    }
  )
);
