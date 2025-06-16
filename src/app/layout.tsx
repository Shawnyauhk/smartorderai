import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SmartOrder AI',
  description: 'AI-powered restaurant ordering system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
          © {new Date().getFullYear()} SmartOrder AI. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
