import React from "react";

const Legal = () => (
  <div className="max-w-4xl mx-auto p-8 bg-white shadow rounded-lg">
    <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">Privacy & Terms</h1>
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-2">Privacy Policy</h2>
      <p className="text-gray-700 leading-relaxed">
        We value your privacy and only collect the minimum information required to provide our services. Any data you share with us will never be sold and is used solely to improve your experience.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-semibold mb-2">Terms of Service</h2>
      <p className="text-gray-700 leading-relaxed">
        By using this application you agree to use it responsibly and comply with all applicable laws. We reserve the right to update these terms at any time.
      </p>
    </section>
  </div>
);

export default Legal;
