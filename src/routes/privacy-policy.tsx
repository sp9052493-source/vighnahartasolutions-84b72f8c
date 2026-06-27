import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/site/LegalShell";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vighnaharta Solutions" },
      { name: "description", content: `Privacy policy for ${COMPANY.brand}, operated by ${COMPANY.legalName}. Learn how we collect, use, store and protect your data.` },
      { property: "og:title", content: "Privacy Policy — Vighnaharta Solutions" },
      { property: "og:description", content: "How Vighnaharta Solutions handles personal data, security and cookies." },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle={`How ${COMPANY.legalName} collects, uses and protects information on the ${COMPANY.brand}.`}
      updated={new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
    >
      <p>
        This Privacy Policy describes how <strong>{COMPANY.legalName}</strong> (“we”, “us”, “our”),
        the operator of <strong>{COMPANY.brand}</strong> (“the Platform”), collects, uses,
        discloses and safeguards your personal information when you use our website and services.
        By using the Platform you agree to the practices described below.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, business name, email, mobile number, address and KYC details.</li>
        <li><strong>Transaction data:</strong> wallet recharges, service charges, order references and payment status returned by the payment gateway.</li>
        <li><strong>Service inputs:</strong> identifiers such as PAN, DL, RC, Ration Card numbers or supporting documents you submit to deliver a service to your customer.</li>
        <li><strong>Device data:</strong> IP address, browser type, operating system and basic usage logs for security and analytics.</li>
        <li><strong>Cookies:</strong> small text files used for sign-in sessions and preference storage.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To create and operate your account and provide the services you request.</li>
        <li>To process wallet recharges, deduct service charges and pay distributor commissions.</li>
        <li>To verify identity, prevent fraud and comply with applicable laws.</li>
        <li>To send service notifications, receipts and important policy updates.</li>
        <li>To improve the Platform, troubleshoot bugs and develop new features.</li>
      </ul>

      <h2>3. Sharing of information</h2>
      <p>We share information only with:</p>
      <ul>
        <li><strong>Government / regulatory APIs</strong> (for example, identifier lookups) strictly to fulfil the service requested.</li>
        <li><strong>Payment processors</strong> such as Paytm Payment Gateway to complete wallet recharges.</li>
        <li><strong>Cloud and infrastructure providers</strong> who host the Platform under written contracts.</li>
        <li><strong>Law enforcement or regulators</strong> when required by law or a valid legal process.</li>
      </ul>
      <p>We never sell your personal data to third parties.</p>

      <h2>4. Data security</h2>
      <p>
        We use industry-standard safeguards including HTTPS, row-level security on our databases,
        access controls, password hashing and encrypted document storage. Despite these measures,
        no system on the Internet can be guaranteed 100% secure; you are responsible for keeping
        your sign-in credentials confidential.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain account, transaction and service records for as long as your account is active
        and for the period required by law (typically 8 years for tax and financial records).
        You may request earlier deletion of non-statutory data by writing to {COMPANY.email}.
      </p>

      <h2>6. Cookies and analytics</h2>
      <p>
        The Platform uses essential cookies for authentication and session continuity, and may
        use limited analytics cookies to understand aggregate usage. You can disable cookies in
        your browser, but parts of the Platform will not work without them.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        Some pages load content or process data through third parties such as Paytm Payment
        Gateway, Google Maps and Lovable Cloud infrastructure. Their use of your data is
        governed by their own privacy policies.
      </p>

      <h2>8. Your rights</h2>
      <ul>
        <li>Access, correct or update your account information from the dashboard.</li>
        <li>Request a copy or deletion of your personal data by emailing {COMPANY.email}.</li>
        <li>Withdraw consent for non-essential processing at any time.</li>
      </ul>

      <h2>9. Children</h2>
      <p>
        The Platform is intended for businesses and adults. We do not knowingly collect personal
        information from individuals under the age of 18.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated by
        email or a prominent notice on the Platform.
      </p>

      <h2>11. Contact</h2>
      <p>
        For any privacy-related questions or requests, please write to:
        <br />
        <strong>{COMPANY.legalName}</strong><br />
        {COMPANY.addressLine1}, {COMPANY.addressLine2},<br />
        {COMPANY.city}, {COMPANY.state} – {COMPANY.pincode}, {COMPANY.country}<br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> · Phone: <a href={`tel:${COMPANY.mobile}`}>{COMPANY.mobile}</a>
      </p>
    </LegalShell>
  );
}
