'use client';

import { ThemeProvider } from '@/lib/ThemeContext';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
