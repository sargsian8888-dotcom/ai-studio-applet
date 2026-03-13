import type {Metadata} from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono, Noto_Sans_Armenian } from 'next/font/google';
import './globals.css'; // Global styles
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const notoSansArmenian = Noto_Sans_Armenian({
  subsets: ['armenian'],
  variable: '--font-armenian',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Qayl | The Future of Hiring',
  description: 'Tinder-style job-matching platform connecting Candidates and Employers.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansArmenian.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white antialiased selection:bg-orange-500/30 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
