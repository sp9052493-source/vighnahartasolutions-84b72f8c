import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/site/LegalShell";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Vighnaharta Solutions" },
      { name: "description", content: `Refund and cancellation policy for ${COMPANY.brand}. Failed transactions are refunded within ${COMPANY.refundDays}.` },
      { property: "og:title", content: "Refund & Cancellation Policy — Vighnaharta Solutions" },
      { property: "og:description", content: `How refunds and cancellations work on ${COMPANY.brand}.` },
      { property: "og:url", content: "/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "/refund-policy" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalShell
      title="Refund & Cancellation Policy"
      subtitle={`How ${COMPANY.brand} handles failed transactions, duplicate payments and cancellations.`}
      updated={new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
    >
      <p>
        We want every transaction on <strong>{COMPANY.brand}</strong> to be smooth. If something
        does go wrong, the rules below explain when and how a refund is provided.
      </p>

      <h2>1. Failed transactions</h2>
      <p>
        If a wallet recharge is debited from your bank or card account but does not reflect in
        your Vighnaharta Solutions wallet, the amount is automatically refunded to the original payment
        instrument within <strong>{COMPANY.refundDays}</strong> from the date of the transaction.
        No service fee is charged for failed recharges.
      </p>

      <h2>2. Duplicate payments</h2>
      <p>
        If you are charged twice for the same wallet recharge, the duplicate amount will be
        refunded to the original payment instrument within <strong>{COMPANY.refundDays}</strong>{" "}
        after verification. Please raise a ticket at {COMPANY.email} with both order IDs and
        bank statement evidence.
      </p>

      <h2>3. Service-level failures</h2>
      <p>
        If a document service request fails on our side (for example, the API returns a server
        error before any document is produced), the wallet is not debited. If, in rare cases,
        the wallet was debited but no document was delivered, the amount will be re-credited
        to your wallet within <strong>2 business days</strong>.
      </p>

      <h2>4. Non-refundable charges</h2>
      <ul>
        <li>Government fees, statutory charges and gateway charges already paid to a third party
            on your behalf are non-refundable.</li>
        <li>Service charges for requests that returned a valid document or a “no record found”
            verdict from the official source are non-refundable, as the lookup has been performed.</li>
        <li>Convenience fees, taxes (GST) and processing fees are non-refundable once the
            corresponding service has been delivered.</li>
      </ul>

      <h2>5. Cancellation rules</h2>
      <ul>
        <li>Document service requests are processed in real time and cannot be cancelled once
            submitted.</li>
        <li>Wallet recharges cannot be cancelled after the payment confirmation; the wallet
            balance can however be used for any service.</li>
        <li>Account closure requests will be honoured within 7 business days; any non-refundable
            balance will be communicated at that time.</li>
      </ul>

      <h2>6. How to claim a refund</h2>
      <ol>
        <li>Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from your registered
            email ID within <strong>15 days</strong> of the transaction.</li>
        <li>Include the order ID, service name, transaction date and bank reference number.</li>
        <li>Our team will review and respond within 2 business days.</li>
        <li>Approved refunds are processed via Paytm to the original payment instrument and
            settle within <strong>{COMPANY.refundDays}</strong>.</li>
      </ol>

      <h2>7. Chargebacks</h2>
      <p>
        Please contact us before raising a chargeback with your bank — most disputes are resolved
        faster directly with our team. Frivolous chargebacks may lead to suspension of the account.
      </p>

      <h2>8. Support contact</h2>
      <p>
        <strong>{COMPANY.legalName}</strong> · {COMPANY.supportHours}<br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />
        Phone: <a href={`tel:${COMPANY.mobile}`}>{COMPANY.mobile}</a><br />
        Office: {COMPANY.addressLine1}, {COMPANY.addressLine2}, {COMPANY.city}, {COMPANY.state} – {COMPANY.pincode}
      </p>
    </LegalShell>
  );
}
