import { Metadata } from 'next';
import CareersClient from './CareersClient';

export const metadata: Metadata = {
  title: 'Careers at InvertisPrep | Join Our Team',
  description: 'Explore open roles at InvertisPrep. We are hiring passionate individuals to help students achieve academic excellence. View requirements and apply online.',
};

export default function CareersPage() {
  return <CareersClient />;
}