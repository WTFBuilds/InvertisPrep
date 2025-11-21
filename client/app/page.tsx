import Hero from '@/components/layout/Hero';
import Features from '@/components/layout/Features';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
