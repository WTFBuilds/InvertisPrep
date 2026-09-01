'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/layout/Footer';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";

/**
 * Renders the public site chrome (Global Sidebar + Footer) only outside excluded routes.
 * Admin pages provide their own chrome via the shadcn sidebar layout.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAdmin = pathname.startsWith('/admin');
  const isViewRoute = pathname.startsWith('/view/');
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isQuizGameRoute = !!pathname.match(/^\/quizz0\/(play|match|room)/);

  const hideSidebar = isAdmin || isViewRoute || isAuthRoute || isQuizGameRoute;

  // 1. Exclude routes that don't need the global layout
  if (hideSidebar) {
    return (
      <>
        {/* Preserved the old Navbar import just in case, but it's hidden on these focus routes */}
        <main className="flex-grow">{children}</main>
        {(!isAdmin && !isViewRoute && !isQuizGameRoute) && <Footer />}
      </>
    );
  }

  // 2. Wrap public routes with Sidebar Provider
  return (
    <SidebarProvider>
      <GlobalSidebar />
      <SidebarInset className="flex flex-col flex-1 w-full min-w-0 bg-transparent">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:hidden border-b border-slate-100 bg-white/95 sticky top-0 z-40 backdrop-blur-md">
          <SidebarTrigger className="-ml-2 text-slate-500" />
          <div 
            className="flex-1 flex justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tighter text-xl pr-6"
            style={{
               fontFamily: "Inter, sans-serif",
               WebkitTextStroke: "0.6px currentColor",
               paintOrder: "stroke fill",
            }}
          >
             INVERTISPREP
          </div>
        </header>

        <main className="flex-1">{children}</main>
        
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
