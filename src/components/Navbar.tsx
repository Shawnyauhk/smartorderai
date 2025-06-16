"use client";

import Link from 'next/link';
import { Home, ShoppingBasket, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '點餐', icon: ShoppingBasket },
    { href: '/admin/products', label: '管理產品', icon: Settings },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary group-hover:text-accent transition-colors duration-300">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.522c0 .318.22.6.523.707A9.733 9.733 0 0 0 6 21a9.707 9.707 0 0 0 5.25-1.533c.29-.159.29-.547 0-.706A8.207 8.207 0 0 1 9 18a8.235 8.235 0 0 1-3-.555.75.75 0 0 1-.5-.707V6.222c0-.318.22-.6.523-.707A8.233 8.233 0 0 1 9 3c1.645 0 3.18.483 4.5 1.333a.75.75 0 0 0 .75-.181V3.03a.75.75 0 0 0-.684-.745ZM12.75 4.533A9.707 9.707 0 0 1 18 3a9.735 9.735 0 0 1 3.25.555.75.75 0 0 1 .5.707v14.522c0 .318-.22.6-.523.707A9.733 9.733 0 0 1 18 21a9.707 9.707 0 0 1-5.25-1.533c-.29-.159-.29-.547 0-.706A8.207 8.207 0 0 0 15 18a8.235 8.235 0 0 0 3-.555.75.75 0 0 0 .5-.707V6.222c0-.318.22-.6-.523-.707A8.233 8.233 0 0 0 15 3c-1.645 0-3.18.483-4.5 1.333a.75.75 0 0 1-.75-.181V3.03a.75.75 0 0 1 .684-.745Z" />
            </svg>
            <h1 className="text-3xl font-headline font-bold text-primary group-hover:text-accent transition-colors duration-300">智能點餐AI</h1>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} legacyBehavior passHref>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn(
                    "font-medium transition-all duration-300 ease-in-out",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground scale-105 shadow-lg" 
                      : "text-foreground/80 hover:text-foreground"
                  )}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <item.icon className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
