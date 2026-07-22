import { PolicyLayout } from '@/components/layout/PolicyLayout';

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    children: (
      <p>
        InvertisPrep ("we," "our," or "us") operates the InvertisPrep website and mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
      </p>
    ),
  },
  {
    id: 'information-collected',
    title: 'Information We Collect',
    children: (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
          <p className="mb-2">When you create an account using Google OAuth, we collect:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Profile picture (if provided)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">2.2 Information Collected Automatically</h3>
          <p className="mb-2">When you use our services, we automatically collect:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Device information</li>
            <li>Usage patterns and analytics</li>
            <li>Download and view counts for PYQ papers</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">2.3 Cookies</h3>
          <p>
            We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    children: (
      <>
        <p className="mb-4">We use the collected information for:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Account creation and authentication</li>
          <li>Providing and improving our services</li>
          <li>Personalizing your experience</li>
          <li>Tracking downloads and analytics</li>
          <li>Sending service-related updates</li>
          <li>Compliance with legal obligations</li>
          <li>Fraud detection and prevention</li>
        </ul>
      </>
    ),
  },
  {
    id: 'google-oauth',
    title: 'Google OAuth Information',
    children: (
      <>
        <p className="mb-4">We use Google OAuth 2.0 for user authentication. When you sign in with Google:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>You&apos;re redirected to Google&apos;s secure login page</li>
          <li>We only receive your ID token and authenticated information</li>
          <li>We do NOT have access to your Google password</li>
          <li>Your Google account remains under Google&apos;s control and privacy policy</li>
          <li>You can revoke our access at any time through your Google account settings</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    children: (
      <>
        <p className="mb-4">We do not sell, trade, or rent your personal information. We may share information:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>With service providers who assist in operating our website</li>
          <li>When required by law or legal process</li>
          <li>To protect our rights and safety</li>
          <li>For analytics purposes (anonymized data)</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    children: (
      <p>
        We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    children: (
      <>
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Opt-out of marketing communications</li>
          <li>Revoke access permissions</li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Retention',
    children: (
      <p>
        We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-Party Links',
    children: (
      <p>
        Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    children: (
      <p>
        We may update this privacy policy periodically. We will notify you of significant changes by updating the &quot;Last updated&quot; date at the top of this page.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      description="Learn how we collect, use, and protect your personal information."
      lastUpdated="May 12, 2026"
      badgeText="Privacy"
      sections={sections}
    />
  );
}