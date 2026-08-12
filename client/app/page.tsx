import Hero from '@/components/layout/Hero';
import ResumeShowcase from '@/components/layout/ResumeShowcase';
import PyqMarketing from '@/components/layout/PyqMarketing';

// Home metadata inherits the rich keyword-focused defaults from app/layout.tsx.
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <PyqMarketing />
      <ResumeShowcase />
    </div>
  );
}
