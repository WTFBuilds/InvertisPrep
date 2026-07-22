import { PolicyLayout } from '@/components/layout/PolicyLayout';

const sections = [
  {
    id: 'agreement',
    title: 'Agreement to Terms',
    children: (
      <p>
        By accessing and using the InvertisPrep website and services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
      </p>
    ),
  },
  {
    id: 'use-license',
    title: 'Use License',
    children: (
      <>
        <p className="mb-4">
          Permission is granted to temporarily download one copy of the materials (information or software) on InvertisPrep for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or for any public display</li>
          <li>Attempt to decompile or reverse engineer any software</li>
          <li>Remove any copyright or other proprietary notations</li>
          <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
        </ul>
      </>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    children: (
      <p>
        The materials on InvertisPrep are provided on an &apos;as is&apos; basis. InvertisPrep makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
      </p>
    ),
  },
  {
    id: 'limitations',
    title: 'Limitations',
    children: (
      <p>
        In no event shall InvertisPrep or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on InvertisPrep, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
      </p>
    ),
  },
  {
    id: 'accuracy',
    title: 'Accuracy of Materials',
    children: (
      <p>
        The materials appearing on InvertisPrep could include technical, typographical, or photographic errors. InvertisPrep does not warrant that any of the materials on our website are accurate, complete, or current. We may make changes to the materials contained on our website at any time without notice.
      </p>
    ),
  },
  {
    id: 'content',
    title: 'Materials and Content',
    children: (
      <>
        <p className="mb-4">
          InvertisPrep does not endorse any user-submitted content. Users are solely responsible for the content they upload, download, or share. The PYQ (Previous Year Questions) papers provided are for educational purposes only.
        </p>
        <p className="mb-4">By uploading content, you represent and warrant that:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>You own or have necessary rights to the content</li>
          <li>The content does not violate any intellectual property rights</li>
          <li>The content is not illegal, offensive, or harmful</li>
          <li>The content is accurate and relevant</li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitations of Liability',
    children: (
      <p>
        In no case shall InvertisPrep, its officers, directors, employees, or agents, be liable to you for any indirect, incidental, special, consequential, or punitive damages resulting from any cause, including but not limited to claims arising from the use or inability to use the services.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    children: (
      <>
        <p className="mb-4">When you create an account using Google OAuth:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>You are responsible for maintaining the confidentiality of your account</li>
          <li>You agree not to share your login credentials</li>
          <li>You are responsible for all activities under your account</li>
          <li>You must use the service only for lawful purposes</li>
        </ul>
      </>
    ),
  },
  {
    id: 'prohibited',
    title: 'Prohibited Activities',
    children: (
      <>
        <p className="mb-4">You agree not to:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Access or use the service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Use the service to distribute malware or harmful content</li>
          <li>Violate any intellectual property rights</li>
          <li>Spam or send unsolicited messages</li>
          <li>Attempt to manipulate or exploit the platform</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual Property Rights',
    children: (
      <p>
        The content, materials, and code on InvertisPrep are the property of InvertisPrep or its content suppliers and are protected by international copyright laws. The compilation, arrangement, and assembly of all content on InvertisPrep is the exclusive property of InvertisPrep and protected by copyright laws.
      </p>
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    children: (
      <p>
        You agree to defend, indemnify, and hold harmless InvertisPrep, its officers, directors, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including attorney fees) arising from or related to your use of the service or violation of these terms.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    children: (
      <p>
        InvertisPrep may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    children: (
      <p>
        These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in Bareilly, Uttar Pradesh, India.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      description="Please read these terms carefully before using InvertisPrep."
      lastUpdated="May 12, 2026"
      badgeText="Terms"
      sections={sections}
    />
  );
}