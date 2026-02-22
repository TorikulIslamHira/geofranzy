import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>(
  persist(
    (set, get) => ({
      theme: 'system',
      isDark: false,

      initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const theme = savedTheme || 'system';
        
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        set({ theme, isDark });
        updateDOMTheme(isDark);
      },

      toggleTheme: () => {
        const { isDark } = get();
        const newTheme: Theme = isDark ? 'light' : 'dark';
        set({ theme: newTheme, isDark: !isDark });
        updateDOMTheme(!isDark);
      },

      setTheme: (newTheme: Theme) => {
        const isDark =
          newTheme === 'dark' ||
          (newTheme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        set({ theme: newTheme, isDark });
        updateDOMTheme(isDark);
      },
    }),
    {
      name: 'theme-store',
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
        },
      },
    }
  )
);

// Helper function to update DOM theme
function updateDOMTheme(isDark: boolean) {
  const htmlElement = document.documentElement;
  if (isDark) {
    htmlElement.classList.add('dark');
    htmlElement.style.colorScheme = 'dark';
  } else {
    htmlElement.classList.remove('dark');
    htmlElement.style.colorScheme = 'light';
  }
}

// Listen to system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      store.setTheme('system');
    }
  });
}
