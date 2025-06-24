
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/Navbar';
import CurrentYear from '@/components/CurrentYear'; // Import the new component

export const metadata: Metadata = {
  title: '智能點餐AI',
  description: 'AI驅動的餐廳點餐系統',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
        <Toaster />
        <footer className="text-center p-4 text-sm text-muted-foreground">
          © <CurrentYear /> 智能點餐AI. 版權所有.
        </footer>
      </body>
    </html>
  );
}
