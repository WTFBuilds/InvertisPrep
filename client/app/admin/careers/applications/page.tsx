import { Metadata } from 'next';
import CareersApplicationsClient from './CareersApplicationsClient';

export const metadata: Metadata = {
  title: 'Career Applications | Admin Dashboard',
  description: 'View and manage career applications for InvertisPrep',
};

export const dynamic = 'force-dynamic';

export default function CareersApplicationsPage() {
  return <CareersApplicationsClient />;
}