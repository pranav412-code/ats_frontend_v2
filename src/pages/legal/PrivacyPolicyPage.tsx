import React from 'react';
import { LegalLayout } from './LegalLayout';

/**
 * Privacy Policy — drafted to align with India's Digital Personal Data
 * Protection Act, 2023 (DPDPA) plus widely recognised principles from GDPR.
 *
 * Operator identity intentionally kept abstract ("the operator") and contact
 * routed through the in-app Feedback form. No personal name, registered
 * address, or specific vendor names are disclosed.
 */
export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      kicker="Legal · Privacy"
      title="Privacy Policy"
      lastUpdated="June 03, 2026"
    >
      <p>
        This policy explains how ResumeCraft ("we", "our", "us", "the service") collects, uses,
        stores, and protects your personal data. We act as a Data Fiduciary under the Digital
        Personal Data Protection Act, 2023 (DPDPA) of India. By using the service, you consent
        to the practices described below.
      </p>

      <h2>1. Data We Collect</h2>

      <h3>1.1 Account data</h3>
      <ul>
        <li>Email address (sign-in, password reset, transactional emails)</li>
        <li>Display name or other profile metadata you choose to provide</li>
        <li>Authentication tokens managed by our auth provider</li>
      </ul>

      <h3>1.2 Resume content</h3>
      <ul>
        <li>Uploaded resume files (PDF, DOCX)</li>
        <li>Parsed and optimized resume JSON, ATS scores, version history</li>
        <li>Job descriptions you paste for tailoring</li>
      </ul>

      <h3>1.3 Payment data</h3>
      <ul>
        <li>All card, UPI, and netbanking data is processed by our PCI-DSS compliant payment processor — we never see or store raw payment instrument data</li>
        <li>We retain transaction metadata (amount, currency, reference id, status, timestamp) for accounting and tax compliance</li>
      </ul>

      <h3>1.4 Technical data</h3>
      <ul>
        <li>IP address (used for currency selection and fraud prevention; not used for ad tracking)</li>
        <li>Browser type, device class, approximate geographic region</li>
        <li>Server logs (HTTP requests, error traces) retained up to 30 days for incident response</li>
      </ul>

      <h2>2. Purpose of Processing</h2>
      <p>We process the above data strictly for the following purposes:</p>
      <ul>
        <li>Operating the resume parsing, scoring, optimization, and export pipeline</li>
        <li>Persisting your resumes and history so you can return and edit</li>
        <li>Charging correctly and preventing fraud</li>
        <li>Sending essential transactional emails (account verification, payment receipts)</li>
        <li>Improving service quality using aggregated, non-identifying metrics</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your data, run advertising on your data, or use it for
        any purpose materially different from those stated above without seeking fresh consent.
      </p>

      <h2>3. Third-Party Processors (Data Processors)</h2>
      <p>
        We work with carefully chosen third-party service providers strictly as needed to
        deliver the service. We disclose categories rather than specific vendor names; the
        operator can confirm details upon a verified data-subject request.
      </p>
      <ul>
        <li><strong>Authentication and database</strong> — used for sign-in, storing resumes, and ledger</li>
        <li><strong>Payment processor</strong> — used for collecting and refunding charges</li>
        <li><strong>AI inference providers</strong> — your resume content is sent securely over TLS to large-language-model providers to run optimization. We use providers that contractually do not train on customer prompts</li>
        <li><strong>Hosting and content delivery</strong> — used to serve the application</li>
        <li><strong>IP-to-region service</strong> — used only for currency detection</li>
      </ul>
      <p>
        Each processor is bound by its own data protection terms equivalent to or stronger than
        those we offer you. None receives data beyond what is necessary for its specific
        function.
      </p>

      <h2>4. AI Processing</h2>
      <p>
        Resume content is sent to large-language-model providers strictly to generate
        optimization output. We:
      </p>
      <ul>
        <li>Disable training opt-in where the provider exposes that setting</li>
        <li>Cache responses locally for up to seven days to reduce repeat calls and cost</li>
        <li>Do not link inference requests to your identity on the provider side beyond the request itself</li>
      </ul>

      <h2>5. Data Retention</h2>
      <ul>
        <li>Resumes and history — retained until you delete them or close your account</li>
        <li>Account — retained while active; deleted on request or after 24 months of inactivity</li>
        <li>Payment records — retained for the period required by Indian tax law (up to 7 years)</li>
        <li>Server logs — rolling 30 days</li>
        <li>Cached AI responses — rolling 7 days</li>
      </ul>

      <h2>6. Your Rights as a Data Principal</h2>
      <p>Under the DPDPA, 2023 and applicable laws you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — receive a summary of the personal data we process about you</li>
        <li><strong>Correct</strong> — update inaccurate or incomplete data</li>
        <li><strong>Erase</strong> — request deletion of your account and associated data</li>
        <li><strong>Nominate</strong> — appoint someone to exercise these rights in case of incapacity or death</li>
        <li><strong>Withdraw consent</strong> — at any time, with future effect</li>
        <li><strong>Grievance redressal</strong> — submit a complaint to our Grievance Officer (see Section 11)</li>
      </ul>
      <p>
        Most rights can be exercised directly from inside the app (export, delete resume,
        cancel subscription). For requests not covered by an in-app control, use the Feedback
        form and select category <em>Privacy</em>.
      </p>

      <h2>7. Security Measures</h2>
      <ul>
        <li>All traffic encrypted in transit (TLS 1.2+)</li>
        <li>Database encrypted at rest by the auth/database provider</li>
        <li>JWT-based authentication; tokens rotated automatically</li>
        <li>HTTP responses set <code>Cache-Control: no-store</code> to prevent cross-user browser cache leaks</li>
        <li>Industry-standard security headers (X-Frame-Options, X-Content-Type-Options, HSTS in production, Referrer-Policy, Permissions-Policy)</li>
        <li>Server-side authorization checks ensure one user cannot access another's data</li>
      </ul>
      <p>
        No system is perfectly secure. If you suspect a breach affecting your account, contact
        us via the Feedback form (category <em>Security</em>) immediately.
      </p>

      <h2>8. Cookies and Storage</h2>
      <p>
        We use only essential cookies and browser localStorage for authentication state and
        user preferences (theme, currency, last open resume). No third-party tracking,
        analytics, or advertising cookies are loaded.
      </p>

      <h2>9. Cross-Border Transfer</h2>
      <p>
        Some of our processors operate servers outside India. Where personal data is
        transferred internationally, that transfer happens only to jurisdictions not restricted
        by Indian central-government notification, and only under contractual safeguards
        equivalent to applicable Indian standards.
      </p>

      <h2>10. Children's Data</h2>
      <p>
        ResumeCraft is intended for users aged 16 and older. We do not knowingly collect
        personal data from children under 16. If you believe a minor has registered, contact us
        and we will delete the account.
      </p>

      <h2>11. Grievance Officer</h2>
      <p>
        As required by the DPDPA, we provide a Grievance Officer for data-protection complaints
        and queries. Submit a grievance via the in-app Feedback form (category <em>Privacy</em>)
        with the subject line "Grievance". We acknowledge within 7 days and resolve within 30
        days as mandated by law.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Policy. Material changes will be announced via in-app notice at
        least 14 days before they take effect.
      </p>

      <h2>13. How to Contact Us</h2>
      <p>
        Privacy-related requests and grievances: use the in-app{' '}
        <strong>Feedback form</strong> and select category <em>Privacy</em>. Submissions are
        tracked with a ticket id and reviewed within the timelines specified above.
      </p>
    </LegalLayout>
  );
}
