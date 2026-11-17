import { PolicyLayout } from '@/components/layout/PolicyLayout';

const sections = [
  {
    id: 'refund-eligibility',
    title: 'Refund Eligibility',
    children: (
      <>
        <p>
          We want you to be satisfied with your InvertisPrep experience. Refunds are available under the following circumstances:
        </p>
        <ul className="list-disc list-inside space-y-3 text-gray-700 mt-4">
          <li>
            <strong>Technical Issues:</strong> If you experience persistent technical problems that prevent you from accessing purchased content and our support team cannot resolve the issue within 48 hours.
          </li>
          <li>
            <strong>Duplicate Purchase:</strong> If you accidentally purchase the same item or subscription twice.
          </li>
          <li>
            <strong>Unauthorized Transaction:</strong> If a charge was made without your authorization (subject to verification).
          </li>
          <li>
            <strong>Service Not as Described:</strong> If a premium feature or service does not function as advertised on our platform.
          </li>
        </ul>
        <p className="mt-4">
          <strong>Refund requests must be submitted within 14 days of the original purchase.</strong> Requests beyond this period will be reviewed on a case-by-case basis.
        </p>
      </>
    ),
  },
  {
    id: 'how-to-request',
    title: 'How to Request a Refund',
    children: (
      <>
        <p className="mb-4">To request a refund, please email us at <strong>support@invertisprep.in</strong> with the following information:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Your registered email address</li>
          <li>Order/Transaction ID (from your wallet history or payment confirmation)</li>
          <li>Date of purchase</li>
          <li>Reason for the refund request</li>
          <li>Any supporting screenshots or details</li>
        </ul>
        <p className="mt-4">
          Our support team will review your request within 2 business days and respond with a decision.
        </p>
      </>
    ),
  },
  {
    id: 'qcoins-virtual',
    title: 'QCoins &amp; Virtual Currency',
    children: (
      <>
        <p className="mb-4">QCoins are a virtual currency used on InvertisPrep for:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Resume builder premium downloads (watermark-free PDFs)</li>
          <li>Premium content access</li>
          <li>Other platform features as introduced</li>
        </ul>
        <p className="mb-4"><strong>QCoins are non-refundable once purchased.</strong> This is standard practice for virtual currencies on digital platforms.</p>
        <p className="mb-4">
          <strong>Exception:</strong> If QCoins were purchased as part of a bundle that includes a refundable item, only the non-QCoin portion may be eligible for refund.
        </p>
      </>
    ),
  },
  {
    id: 'resume-downloads',
    title: 'Resume Builder Downloads',
    children: (
      <>
        <p className="mb-4">Resume downloads on InvertisPrep include:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li><strong>Watermark PDF:</strong> Free (with visible watermark)</li>
          <li><strong>Clean PDF (Free Trial):</strong> One-time free clean download per account</li>
          <li><strong>Clean PDF (QCoins):</strong> 200 QCoins per download</li>
          <li><strong>Clean PDF (Razorpay):</strong> Direct payment option (coming soon)</li>
        </ul>
        <p className="mb-4">
          <strong>Refunds for resume downloads:</strong> Since the clean PDF is generated and delivered instantly upon payment, these downloads are non-refundable once the download has been initiated. If the download fails due to a technical error on our end, we will restore your QCoins or free download count.
        </p>
      </>
    ),
  },
  {
    id: 'processing-time',
    title: 'Processing Time',
    children: (
      <ul className="list-disc list-inside space-y-3 text-gray-700">
        <li><strong>Approval:</strong> 2 business days after submission</li>
        <li><strong>Refund to Original Payment Method:</strong> 5–10 business days (depends on your bank/payment provider)</li>
        <li><strong>QCoin Restoration:</strong> Instant upon approval</li>
        <li><strong>Free Download Restoration:</strong> Instant upon approval</li>
      </ul>
    ),
  },
  {
    id: 'non-refundable',
    title: 'Non-Refundable Items',
    children: (
      <>
        <p className="mb-4">The following are non-refundable:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>QCoins and virtual currency purchases</li>
          <li>Clean PDF downloads (watermark-free resume exports)</li>
          <li>Subscription fees for periods already used</li>
          <li>Free trial downloads once used</li>
          <li>Digital content that has been accessed or downloaded</li>
        </ul>
      </>
    ),
  },
  {
    id: 'payment-disputes',
    title: 'Payment Disputes &amp; Chargebacks',
    children: (
      <>
        <p>
          If you file a chargeback or payment dispute with your bank/card issuer without contacting us first, your InvertisPrep account may be temporarily suspended pending investigation. We strongly encourage you to contact our support team first — we can usually resolve issues faster than a formal dispute process.
        </p>
        <p className="mt-4">
          If a chargeback is found to be invalid (i.e., the service was delivered as described), we reserve the right to contest it and may permanently suspend the associated account.
        </p>
      </>
    ),
  },
  {
    id: 'contact-refunds',
    title: 'Contact for Refunds',
    children: (
      <>
        <p>
          For any refund-related questions or to submit a refund request, please contact us:
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <p><strong>Email:</strong> <a href="mailto:support@invertisprep.in" className="text-indigo-600 hover:underline">support@invertisprep.in</a></p>
          <p><strong>Subject Line:</strong> &quot;Refund Request – [Your Email] – [Transaction ID]&quot;</p>
          <p className="text-sm text-gray-600">We aim to respond to all refund inquiries within 2 business days.</p>
        </div>
      </>
    ),
  },
];

export default function CancellationAndRefundsPage() {
  return (
    <PolicyLayout
      title="Cancellation &amp; Refunds"
      description="Our refund policy for digital products, QCoins, resume downloads, and premium subscriptions."
      lastUpdated="July 22, 2026"
      badgeText="Refunds"
      sections={sections}
    />
  );
}