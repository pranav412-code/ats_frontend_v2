import React from 'react';
import { LegalLayout } from './LegalLayout';

export function RefundPolicyPage() {
  return (
    <LegalLayout
      kicker="Legal · Billing"
      title="Refund & Cancellation Policy"
      lastUpdated="June 03, 2026"
    >
      <p>
        We want you to be happy with ResumeCraft. This policy explains when refunds are
        available, when they are not, and how cancellations work.
      </p>

      <h2>1. Automatic Refunds (Built into the App)</h2>
      <p>
        Several refund paths fire automatically — no request needed. Credits return to your
        balance instantly and you receive a notification:
      </p>
      <ul>
        <li><strong>No improvement</strong> — if an optimization run produces zero score gain, the full charge is refunded</li>
        <li><strong>Already at target</strong> — if your resume already meets the target ATS score, the full charge is refunded</li>
        <li><strong>Optimization cancelled</strong> — if you cancel mid-run, the full remaining charge is refunded</li>
        <li><strong>System error</strong> — if our pipeline fails (timeout, AI provider outage), the full charge is refunded</li>
        <li><strong>Save failed</strong> — if your optimized resume cannot be persisted to history, the full charge is refunded</li>
      </ul>
      <p>
        These refunds happen at the credit level and reflect immediately in your balance. No
        money is returned to your card — the credits you originally purchased simply remain
        usable.
      </p>

      <h2>2. Refunds on Real Money (Bank / Card)</h2>

      <h3>Eligible for full refund within 7 days of purchase</h3>
      <ul>
        <li>Duplicate payment caused by a system glitch</li>
        <li>Payment was captured but credits were not granted within 24 hours and we cannot resolve the issue otherwise</li>
        <li>Service was unusable due to a confirmed bug, and you used zero credits from that purchase</li>
      </ul>

      <h3>Not eligible for refund</h3>
      <ul>
        <li>You used the credits and changed your mind</li>
        <li>You purchased the wrong pack and want to switch</li>
        <li>You did not like the optimized output (the in-app no-improvement automatic refund covers this case)</li>
        <li>Resume rejection by any specific employer or applicant tracking system — we do not guarantee outcomes</li>
        <li>Subscription charges after the first 7 days of activation</li>
      </ul>

      <h2>3. Subscription Cancellation</h2>
      <ul>
        <li>Open the <strong>Subscription</strong> page and click <strong>Cancel renewal</strong></li>
        <li>You retain access and your monthly credit grant until the end of the current billing period</li>
        <li>Auto-renewal stops; no further charges</li>
        <li>If you cancel within 7 days of the first payment and have used fewer than 5 credits, a pro-rata refund may be issued — submit the request via the Feedback form, category <em>Billing</em></li>
        <li>Multi-month commitments cannot be partially refunded after month 1; only the unused commitment period is refundable in exceptional cases at our sole discretion</li>
      </ul>

      <h2>4. How to Request a Refund</h2>
      <ol className="list-decimal pl-6 space-y-2 text-[15px]">
        <li>Open the in-app <strong>Feedback</strong> form (link in footer)</li>
        <li>Select category <em>Billing</em></li>
        <li>Include: transaction reference id (from the Transactions page), date of purchase, and reason</li>
        <li>You will receive a ticket id immediately; we respond within 2 business days</li>
        <li>Approved refunds are processed via the payment processor back to the original payment method within 5–7 business days</li>
      </ol>

      <h2>5. Disputes and Chargebacks</h2>
      <p>
        Filing a chargeback with your bank before contacting us forfeits your account access
        while the dispute is resolved. Please use the Feedback form first — almost every
        billing issue is solvable within 48 hours.
      </p>

      <h2>6. Currency and FX</h2>
      <p>
        Refunds are issued in the original transaction currency. We are not responsible for
        FX-rate differences between purchase and refund dates, nor for any conversion fees your
        bank may charge.
      </p>

      <h2>7. Service Delivery</h2>
      <p>
        ResumeCraft is a digital service. There is no physical shipping. Credits and
        subscription benefits are activated instantly on successful payment confirmation by
        the payment processor.
      </p>

      <h2>8. Contact for Refund Issues</h2>
      <p>
        Use the in-app <strong>Feedback form</strong> and select category <em>Billing</em>.
        Each submission is tagged with a ticket id you can reference in follow-ups.
      </p>
    </LegalLayout>
  );
}
