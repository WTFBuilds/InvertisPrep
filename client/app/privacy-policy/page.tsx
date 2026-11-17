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
        We may update this privacy policy periodically. We will notify you of significant changes by updating the "Last updated" date at the top of this page.
      </p>
    ),
  },
  {
    id: 'advertising',
    title: 'Advertising and Third-Party Services',
    children: (
      <>
        <p className="mb-4">
          InvertisPrep may display advertisements to support the operation and maintenance of the platform. We use Google AdSense and other third-party advertising services to serve ads. These advertising partners may collect and use information about your visits to this and other websites (not including personally identifiable information such as your name, address, email, or phone number) to provide advertisements about goods and services of interest to you.
        </p>
        <p className="mb-4">
          <strong>Google AdSense:</strong> Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. You may opt out of the use of the DART cookie by visiting the <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google ad and content network privacy policy</a>.
        </p>
        <p className="mb-4">
          <strong>Cookies and Tracking Technologies:</strong> We and our advertising partners may use cookies, web beacons, and similar tracking technologies to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Collect information about your browsing activities on our site</li>
          <li>Serve personalized advertisements based on your interests</li>
          <li>Measure and analyze the effectiveness of advertising campaigns</li>
          <li>Prevent fraud and invalid click activity</li>
        </ul>
        <p className="mb-4">
          <strong>Opt-Out Options:</strong> You can opt out of personalized advertising by:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Visiting <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a> to manage your ad preferences</li>
          <li>Visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative Opt-Out Page</a></li>
          <li>Visiting <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance Opt-Out Page</a></li>
          <li>Enabling "Do Not Track" in your browser settings (though this may not prevent all tracking)</li>
        </ul>
        <p className="mb-4">
          <strong>Data Sharing with Advertisers:</strong> We do not share personally identifiable information (such as your name, email, or contact details) with advertisers. We may share aggregated, non-personally identifiable information with third-party advertisers and ad networks for the purpose of serving relevant ads and measuring ad performance.
        </p>
        <p>
          By using InvertisPrep, you consent to the collection and use of your non-personally identifiable information by third-party advertising partners as described above. If you do not wish to have this information used for the purpose of serving you targeted ads, you may opt out using the links provided above.
        </p>
      </>
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