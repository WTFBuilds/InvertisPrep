import Hero from '@/components/layout/Hero';
import ResumeShowcase from '@/components/layout/ResumeShowcase';
import PyqMarketing from '@/components/layout/PyqMarketing';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/seo';

// Home metadata inherits the rich keyword-focused defaults from app/layout.tsx.
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <JsonLd schemas={[organizationSchema(), websiteSchema()]} />
      <Hero />
      <PyqMarketing />
      <ResumeShowcase />
    </div>
  );
}
