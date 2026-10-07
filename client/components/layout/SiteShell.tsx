'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';
import Footer from '@/components/layout/Footer';
import InstagramFab from '@/components/layout/InstagramFab';

/**
 * Renders the public site chrome (announcement banner + Navbar + Footer +
 * floating Instagram button) only outside /admin routes. Admin pages provide
 * their own chrome via the shadcn sidebar layout.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && (
        <>
          <AnnouncementBanner />
          <Navbar />
        </>
      )}
      <main className="flex-grow">{children}</main>
      {!isAdmin && (
        <>
          <Footer />
          <InstagramFab />
        </>
      )}
    </>
  );
}
