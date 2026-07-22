import { PolicyLayout } from '@/components/layout/PolicyLayout';

const sections = [
  {
    id: 'digital-delivery',
    title: 'Digital Delivery',
    children: (
      <p>
        InvertisPrep is a fully digital platform. All products and services — including PYQ papers, resume templates, study materials, and digital tools — are delivered electronically. No physical products are shipped or delivered. Once a purchase or download is completed, access to the digital content is granted immediately through your account.
      </p>
    ),
  },
  {
    id: 'delivery-timeframes',
    title: 'Delivery Timeframes',
    children: (
      <>
        <p className="mb-4">All digital products are available for instant access:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>PYQ Papers:</strong> Available for download immediately after login</li>
          <li><strong>Resume Builder:</strong> Accessible instantly; exports and downloads are generated in real-time</li>
          <li><strong>QCoins & Digital Credits:</strong> Added to your wallet immediately upon successful payment</li>
          <li><strong>Premium Subscriptions:</strong> Activate instantly and grant access to all included features</li>
        </ul>
      </>
    ),
  },
  {
    id: 'access-availability',
    title: 'Access & Availability',
    children: (
      <p>
        Digital content is available 24/7, subject to scheduled maintenance windows. You can access your purchased content from any device with an internet connection by logging into your InvertisPrep account. Your purchase history and digital assets are tied to your account and can be accessed at any time.
      </p>
    ),
  },
  {
    id: 'technical-requirements',
    title: 'Technical Requirements',
    children: (
      <>
        <p className="mb-4">To access and use our digital services, you need:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>A modern web browser (Chrome, Firefox, Safari, or Edge — latest version recommended)</li>
          <li>A stable internet connection</li>
          <li>JavaScript enabled in your browser</li>
          <li>A Google account for authentication</li>
        </ul>
        <p className="mt-4">
          InvertisPrep is not responsible for any issues arising from your device, browser, or internet connection that prevent access to our services.
        </p>
      </>
    ),
  },
  {
    id: 'service-availability',
    title: 'Service Availability',
    children: (
      <p>
        We strive to maintain 99.9% uptime for our platform. However, we do not guarantee uninterrupted access. Scheduled maintenance windows will be communicated in advance when possible. In the event of a service disruption, we will work to restore access as quickly as possible.
      </p>
    ),
  },
  {
    id: 'delivery-issues',
    title: 'Delivery Issues',
    children: (
      <p>
        If you experience any issues accessing your purchased content, please contact our support team at <strong>invertisprep@gmail.com</strong>. We will investigate and resolve the issue promptly. Common issues include payment processing delays, which typically resolve within a few minutes. If your QCoins or content are not available within 30 minutes of purchase, please reach out to us.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      description="Since InvertisPrep is a digital platform, all products and services are delivered electronically with instant access."
      lastUpdated="July 22, 2026"
      badgeText="Shipping"
      sections={sections}
    />
  );
}