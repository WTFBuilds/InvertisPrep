export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: May 12, 2026</p>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              InvertisPrep ("we," "our," or "us") operates the InvertisPrep website and mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">2.1 Information You Provide</h3>
                <p>When you create an account using Google OAuth, we collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Email address</li>
                  <li>Name (if provided)</li>
                  <li>Profile picture (if provided)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2.2 Information Collected Automatically</h3>
                <p>When you use our services, we automatically collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>Device information</li>
                  <li>Usage patterns and analytics</li>
                  <li>Download and view counts for PYQ papers</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2.3 Cookies</h3>
                <p>We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the collected information for:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
              <li>Account creation and authentication</li>
              <li>Providing and improving our services</li>
              <li>Personalizing your experience</li>
              <li>Tracking downloads and analytics</li>
              <li>Sending service-related updates</li>
              <li>Compliance with legal obligations</li>
              <li>Fraud detection and prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Google OAuth Information</h2>
            <p className="text-gray-700 mb-4">
              We use Google OAuth 2.0 for user authentication. When you sign in with Google:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
              <li>You're redirected to Google's secure login page</li>
              <li>We only receive your ID token and authenticated information</li>
              <li>We do NOT have access to your Google password</li>
              <li>Your Google account remains under Google's control and privacy policy</li>
              <li>You can revoke our access at any time through your Google account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information. We may share information:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
              <li>With service providers who assist in operating our website</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights and safety</li>
              <li>For analytics purposes (anonymized data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Revoke access permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700">
              Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy periodically. We will notify you of significant changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p className="text-gray-700">
                <strong>Email:</strong> support@invertisprep.in<br/>
                <strong>Address:</strong> Invertis University, Bareilly, Uttar Pradesh, India
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
