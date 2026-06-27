import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/site/LegalShell";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Vighnaharta Solutions" },
      { name: "description", content: `Terms and conditions for using ${COMPANY.brand}, operated by ${COMPANY.legalName}.` },
      { property: "og:title", content: "Terms & Conditions — Vighnaharta Solutions" },
      { property: "og:description", content: "Service usage rules, payment terms and liability for Vighnaharta Solutions." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell
      title="Terms & Conditions"
      subtitle={`These terms govern your use of ${COMPANY.brand} and the services offered by ${COMPANY.legalName}.`}
      updated={new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
    >
      <p>
        Please read these Terms &amp; Conditions (“Terms”) carefully before using the
        <strong> {COMPANY.brand}</strong> platform (“the Platform”), operated by{" "}
        <strong>{COMPANY.legalName}</strong> (“we”, “us”, “our”). By accessing the Platform or
        using any of our services, you agree to be bound by these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        The Platform is intended for retailers, distributors and authorised business users in India.
        You must be at least 18 years of age and capable of entering into a binding contract.
      </p>

      <h2>2. Service usage rules</h2>
      <ul>
        <li>Use the Platform only for lawful purposes and only to assist your own customers.</li>
        <li>Do not attempt to reverse engineer, scrape, overload or compromise the Platform.</li>
        <li>Information submitted for any service (PAN, DL, RC, Aadhaar, Ration Card, etc.) must
            be collected with the customer's consent and used solely to fulfil that service.</li>
        <li>Resale of API output, automated bulk fetching, or use of the Platform for impersonation
            is strictly prohibited.</li>
      </ul>

      <h2>3. User responsibilities</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
        <li>You are responsible for the accuracy of any data you submit to the Platform.</li>
        <li>You must comply with all applicable laws including the Information Technology Act, 2000,
            the Digital Personal Data Protection Act, 2023 and the regulations of any document
            issuing authority.</li>
      </ul>

      <h2>4. Payments and wallet</h2>
      <ul>
        <li>Service charges are deducted from your prepaid wallet at the time of each request.</li>
        <li>Wallet recharges are processed through Paytm Payment Gateway. By initiating a recharge
            you agree to Paytm's terms.</li>
        <li>Pricing for each service is displayed on the Platform and may change with notice.</li>
        <li>Distributor commissions, where applicable, are credited automatically per the active
            commission schedule.</li>
      </ul>

      <h2>5. Refund policy</h2>
      <p>
        Refunds for failed or duplicate transactions are governed by our{" "}
        <a href="/refund-policy">Refund &amp; Cancellation Policy</a>, which forms part of these Terms.
      </p>

      <h2>6. Service availability</h2>
      <p>
        Several services depend on third-party government or aggregator APIs. We do not guarantee
        100% uptime or availability of any individual service. We may suspend, modify or discontinue
        any service at any time, with or without notice, for security or operational reasons.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, <strong>{COMPANY.legalName}</strong> shall not be
        liable for any indirect, incidental, consequential, special or punitive damages, or for
        loss of profits, revenue, data or business opportunity arising out of or in connection
        with your use of the Platform. Our total aggregate liability for any claim shall not
        exceed the amount paid by you to us for the specific service giving rise to the claim
        during the preceding 30 days.
      </p>

      <h2>8. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless {COMPANY.legalName}, its directors, employees and
        partners from any claim arising out of your breach of these Terms, misuse of the Platform,
        or violation of any law or third-party right.
      </p>

      <h2>9. Account suspension and termination</h2>
      <p>
        We may suspend or terminate your account, at our sole discretion, if we suspect fraud,
        misuse, breach of these Terms, or if required by law or our service providers. On
        termination, remaining wallet balance (less any chargeback amounts) will be refunded to
        the original funding source after reasonable verification.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        All trademarks, logos, software, text and design elements on the Platform are the property
        of {COMPANY.legalName} or its licensors. You may not copy or reuse them without prior
        written permission.
      </p>

      <h2>11. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Platform after an
        update constitutes acceptance of the revised Terms.
      </p>

      <h2>12. Governing law and jurisdiction</h2>
      <p>
        These Terms are governed by the laws of <strong>India</strong>. Any dispute will be
        subject to the exclusive jurisdiction of the courts at <strong>{COMPANY.jurisdiction}</strong>.
      </p>

      <h2>13. Contact</h2>
      <p>
        For any question about these Terms, write to{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call{" "}
        <a href={`tel:${COMPANY.mobile}`}>{COMPANY.mobile}</a>.
      </p>
    </LegalShell>
  );
}
