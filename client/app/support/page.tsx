export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
        <p className="text-gray-600 mb-12">Get answers to your questions about InvertisPrep</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* FAQs */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How do I sign up?</h3>
                <p className="text-gray-700">
                  Click the "Sign In" button and use your Google account to authenticate. Your account will be created automatically on first login.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How do I download PYQ papers?</h3>
                <p className="text-gray-700">
                  Browse to the desired department and use the filters to find the papers you need. Click the "Download PDF" button to download the paper.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Are the papers free?</h3>
                <p className="text-gray-700">
                  Yes! All PYQ papers on InvertisPrep are completely free to download and use for educational purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I upload papers?</h3>
                <p className="text-gray-700">
                  Only admin users can upload papers. If you'd like to contribute, please contact us.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is my data safe?</h3>
                <p className="text-gray-700">
                  Yes, we use industry-standard security measures and OAuth 2.0 for authentication. See our Privacy Policy for more details.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Information */}
          <div className="space-y-6">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Us</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <a 
                    href="mailto:support@invertisprep.in"
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    support@invertisprep.in
                  </a>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Address</label>
                  <p className="text-gray-700">
                    Invertis University<br/>
                    Bareilly, Uttar Pradesh<br/>
                    India
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Response Time</label>
                  <p className="text-gray-700">
                    We typically respond to support inquiries within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Resources</h2>
              <ul className="space-y-3">
                <li>
                  <a href="/privacy-policy" className="text-purple-600 hover:text-purple-700 font-medium">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="text-purple-600 hover:text-purple-700 font-medium">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/pyq" className="text-purple-600 hover:text-purple-700 font-medium">
                    Browse PYQ Papers
                  </a>
                </li>
                <li>
                  <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                    Home Page
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Common Issues & Solutions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Login Issues</h3>
              <p className="text-gray-700 mb-3">
                <strong>Problem:</strong> Can't sign in with Google
              </p>
              <p className="text-gray-700">
                <strong>Solution:</strong> Make sure you're using the correct Google account and allow permissions when prompted. Clear your browser cache and try again.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Download Issues</h3>
              <p className="text-gray-700 mb-3">
                <strong>Problem:</strong> Paper won't download
              </p>
              <p className="text-gray-700">
                <strong>Solution:</strong> Check your internet connection and ensure pop-ups are not blocked. Try a different browser if the issue persists.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Paper Not Found</h3>
              <p className="text-gray-700 mb-3">
                <strong>Problem:</strong> Can't find a specific paper
              </p>
              <p className="text-gray-700">
                <strong>Solution:</strong> Use the filters to search by branch, semester, and exam type. Check if the paper has been verified by admins.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Account Issues</h3>
              <p className="text-gray-700 mb-3">
                <strong>Problem:</strong> Want to delete account
              </p>
              <p className="text-gray-700">
                <strong>Solution:</strong> Email us at support@invertisprep.in with your account details and we'll help you delete it.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Request */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-8 border border-purple-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Have a Feature Request?</h2>
          <p className="text-gray-700 mb-4">
            We're always looking to improve InvertisPrep. If you have suggestions for new features or improvements, please email us at:
          </p>
          <a 
            href="mailto:support@invertisprep.in?subject=Feature%20Request"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Send Feature Request
          </a>
        </div>
      </div>
    </div>
  );
}
