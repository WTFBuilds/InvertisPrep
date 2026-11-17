import { Metadata } from 'next';
import CareersApplyClient from './CareersApplyClient';

export const metadata: Metadata = {
  title: 'Apply to InvertisPrep | Career Application',
  description: 'Submit your application to join the InvertisPrep team. Multi-step form covering personal info, skills, resume, and more.',
};

export const dynamic = 'force-dynamic';

export default function CareersApplyPage() {
  return <CareersApplyClient />;
}