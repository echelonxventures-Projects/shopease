// Terms of Service — ShopEase
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-700">By accessing or using ShopEase, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. You must be at least 18 years old to create an account.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. Account Registration</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your password.</li>
          <li>You must notify us immediately of any unauthorized use of your account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. Orders and Acceptance</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Placing an order constitutes an offer to purchase. We reserve the right to accept or reject any order.</li>
          <li>Order confirmation does not constitute acceptance. Acceptance occurs when we ship the product.</li>
          <li>Prices are subject to change without notice.</li>
          <li>Product availability is not guaranteed.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">4. Payment</h2>
        <p className="text-gray-700">Payment must be made through our accepted payment methods. All prices are inclusive of applicable taxes unless otherwise stated. Payment is processed at the time of order placement.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">5. Shipping and Delivery</h2>
        <p className="text-gray-700">Shipping times are estimates and not guaranteed. Risk of loss passes to you upon delivery. We are not responsible for delays caused by shipping carriers or force majeure events.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">6. Returns and Refunds</h2>
        <p className="text-gray-700">Products may be returned within the period specified in our Return Policy. Items must be unused, in original packaging, and accompanied by proof of purchase. Refunds are processed within 14 business days of receiving returned items.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">7. Intellectual Property</h2>
        <p className="text-gray-700">All content, logos, and designs on ShopEase are our intellectual property. You may not reproduce, distribute, or create derivative works without our written permission.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">8. Limitation of Liability</h2>
        <p className="text-gray-700">To the maximum extent permitted by law, ShopEase shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount you paid for the product in question.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">9. Governing Law</h2>
        <p className="text-gray-700">These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Mumbai, Maharashtra. For EU customers, mandatory consumer protection laws of your jurisdiction apply.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">10. Changes to Terms</h2>
        <p className="text-gray-700">We may update these terms at any time. Material changes will be communicated via email or site notice. Continued use after changes constitutes acceptance of the new terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">11. Contact</h2>
        <p className="text-gray-700">
          For questions about these terms, contact us at{" "}
          <a href="mailto:legal@shopease.com" className="text-blue-600 underline">legal@shopease.com</a>
        </p>
      </section>
    </div>
  );
}
