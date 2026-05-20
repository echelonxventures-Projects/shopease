// Privacy Policy — ShopEase
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
        <p className="text-gray-700 mb-2">We collect the following personal data when you use our services:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Account data:</strong> name, email address, phone number, password (hashed)</li>
          <li><strong>Address data:</strong> street address, city, state, zip code, country (for order fulfillment)</li>
          <li><strong>Order data:</strong> products purchased, quantities, prices, payment method, shipping address</li>
          <li><strong>Device data:</strong> IP address, browser type, operating system (in audit logs)</li>
          <li><strong>Usage data:</strong> pages viewed, products browsed, cart activity</li>
          <li><strong>Support data:</strong> content of support tickets and messages</li>
          <li><strong>Consent records:</strong> which policies you agreed to and when</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. Legal Basis for Processing (GDPR Article 6)</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Contract fulfillment:</strong> We process your data to process orders, deliver products, and handle returns.</li>
          <li><strong>Legal obligation:</strong> We retain order records for accounting and tax compliance (up to 7 years).</li>
          <li><strong>Legitimate interest:</strong> We use audit logs to prevent fraud and secure our platform.</li>
          <li><strong>Consent:</strong> We process marketing data and analytics cookies based on your explicit consent.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. How Long We Keep Your Data</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Account data:</strong> Until you delete your account</li>
          <li><strong>Order records:</strong> 7 years (accounting/tax legal requirement)</li>
          <li><strong>Audit logs:</strong> 2 years</li>
          <li><strong>Consent records:</strong> Indefinite (required for compliance proof)</li>
          <li><strong>Cart items:</strong> 30 days of inactivity</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">4. Your Rights (GDPR Articles 15-22)</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Right to access:</strong> Download all personal data we hold about you from your account profile.</li>
          <li><strong>Right to rectification:</strong> Update your name, phone, and address in your account settings.</li>
          <li><strong>Right to erasure:</strong> Request deletion of your account and personal data from your profile.</li>
          <li><strong>Right to portability:</strong> Export your data in machine-readable JSON format.</li>
          <li><strong>Right to restrict processing:</strong> Withdraw marketing consent at any time.</li>
          <li><strong>Right to object:</strong> Object to processing by contacting our DPO.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">5. Cookies</h2>
        <p className="text-gray-700">We use the following cookies:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
          <li><strong>Essential:</strong> Session authentication (required, no consent needed)</li>
          <li><strong>Functional:</strong> Locale and region preferences (required for service)</li>
          <li><strong>Analytics:</strong> Anonymous usage statistics (with your consent)</li>
          <li><strong>Marketing:</strong> Ad targeting and personalization (with your consent)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">6. Third-Party Sharing</h2>
        <p className="text-gray-700">We share your data only with:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
          <li><strong>Payment gateways</strong> — to process transactions</li>
          <li><strong>Shipping providers</strong> — to deliver orders</li>
          <li><strong>Legal authorities</strong> — when required by law</li>
        </ul>
        <p className="text-gray-700 mt-2">All third parties are bound by data processing agreements.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">7. International Transfers</h2>
        <p className="text-gray-700">Your data may be processed outside the EEA. Where this occurs, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">8. Contact Our DPO</h2>
        <p className="text-gray-700">For any data protection inquiries, contact our Data Protection Officer:</p>
        <p className="text-gray-700 mt-2">
          Email: <a href="mailto:dpo@shopease.com" className="text-blue-600 underline">dpo@shopease.com</a>
        </p>
        <p className="text-gray-700">
          You also have the right to lodge a complaint with your national supervisory authority.
        </p>
      </section>
    </div>
  );
}
