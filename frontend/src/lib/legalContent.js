// GuidHer — Legal content
// Terms of Service and Privacy Notice rendered inside in-page modals.
// Last reviewed: July 2026.

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  effectiveDate: 'July 2026',
  sections: [
    {
      heading: '1. About GuidHer',
      body: `GuidHer is a community-sourced commute safety guide built for women and trans women navigating the Polytechnic University of the Philippines (PUP) Sta. Mesa commute zone. The platform helps commuters check road conditions — such as lighting, crowd levels, and recent incidents — before they leave, based on reports submitted by verified members of the community.\n\nGuidHer is a prototype service provided for informational and community-use purposes only. It is not a law enforcement tool, a real-time emergency dispatch system, or a substitute for professional safety advice.`,
    },
    {
      heading: '2. Acceptance of Terms',
      body: `By creating a GuidHer account or using the platform in any capacity, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Notice. If you do not agree, you must not create an account or submit reports.\n\nWe may update these terms from time to time. Continued use of GuidHer after an update constitutes your acceptance of the revised terms.`,
    },
    {
      heading: '3. Eligibility',
      body: `You must be at least 13 years of age to use GuidHer. By registering, you represent that you meet this requirement and that all information you provide during registration is accurate and truthful.\n\nGuidHer is primarily intended for students and commuters in the PUP Sta. Mesa zone. Accounts may be reviewed and suspended if found to be misrepresenting affiliation or using the platform outside its intended scope.`,
    },
    {
      heading: '4. Account Creation and Management',
      body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately if you suspect unauthorised access to your account.\n\nYou may not share your account with others, create multiple accounts for the same person, or use the account of another user without their explicit permission.\n\nGuidHer accounts are personal and non-transferable.`,
    },
    {
      heading: '5. Community Reports and Acceptable Use',
      body: `GuidHer exists to share factual, observable commute conditions. When submitting a report, you agree to:\n\n• Describe only observable, verifiable conditions — poor lighting, sparse crowds, recent incidents — not personal opinions about neighbourhoods or demographic groups.\n• Never submit false, fabricated, or misleading reports.\n• Never use GuidHer to harass, defame, or target any individual or group.\n• Never introduce crime labels, neighbourhood ratings, or ethnicity/demographic profiling into any report or note field.\n• Never use the platform to coordinate, advertise, or facilitate unlawful activity.\n\nGuidHer uses AI-assisted moderation to classify and review reports. Submissions that violate these rules may be rejected, removed, or result in account suspension without prior notice.`,
    },
    {
      heading: '6. No Emergency Services',
      body: `GuidHer is not an emergency service. The platform does not offer real-time rescue, SOS dispatch, or any form of emergency response coordination. In an emergency, contact the Philippine National Police (PNP) at 911 or your campus security office.\n\nDo not rely on GuidHer as your sole means of ensuring personal safety.`,
    },
    {
      heading: '7. Intellectual Property',
      body: `All platform code, design, branding (including the GuidHer name and marks), and AI-generated content are the intellectual property of the GuidHer development team and its contributors, protected under applicable law.\n\nUser-submitted reports are licensed by you to GuidHer on a non-exclusive, royalty-free, worldwide basis for the purpose of operating and improving the service. You retain ownership of your original submission content but warrant that it does not infringe any third-party rights.\n\nYou may not copy, reproduce, scrape, distribute, or create derivative works from GuidHer's platform or AI-generated outputs without prior written permission.`,
    },
    {
      heading: '8. Limitation of Liability',
      body: `GuidHer provides community-sourced information on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the accuracy, completeness, timeliness, or fitness for purpose of any report or route recommendation on the platform.\n\nTo the maximum extent permitted by law, GuidHer and its contributors shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of, or inability to use, the platform — including but not limited to decisions made in reliance on GuidHer reports.\n\nYou use GuidHer at your own risk and exercise independent judgment regarding your personal safety.`,
    },
    {
      heading: '9. Single-Zone Scope',
      body: `GuidHer currently covers only the PUP Sta. Mesa commute zone. Reports, route checks, and safety data are scoped to this zone only. We make no representations about conditions outside this area.`,
    },
    {
      heading: '10. Account Suspension and Termination',
      body: `We reserve the right to suspend or permanently terminate your account at our discretion if:\n\n• You violate these Terms of Service.\n• You submit false, harmful, or abusive reports.\n• We detect fraudulent or automated account activity.\n• We are required to do so by law or regulation.\n\nYou may request deletion of your account by contacting us at the address listed in the Privacy Notice. Upon termination, your public submissions may be retained in anonymised form to preserve the integrity of the community dataset.`,
    },
    {
      heading: '11. Governing Law',
      body: `These Terms of Service are governed by and construed in accordance with the laws of the Republic of the Philippines, including the Cybercrime Prevention Act of 2012 (Republic Act No. 10175) and the Data Privacy Act of 2012 (Republic Act No. 10173), without regard to conflict-of-law principles.`,
    },
    {
      heading: '12. Contact',
      body: `If you have questions about these Terms of Service, please contact the GuidHer team at: guidher.support@pup.edu.ph`,
    },
  ],
};

export const PRIVACY_NOTICE = {
  title: 'Privacy Notice',
  effectiveDate: 'July 2026',
  intro: `GuidHer is committed to protecting your personal data in accordance with the Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations, as well as internationally recognised data protection principles. This Privacy Notice explains what data we collect, why we collect it, how we use and protect it, and the rights you hold over your information.`,
  sections: [
    {
      heading: '1. Data Controller',
      body: `The data controller for GuidHer is the GuidHer development team, operating as a student project prototype under PUP Sta. Mesa. For privacy-related inquiries, contact: guidher.privacy@pup.edu.ph`,
    },
    {
      heading: '2. Personal Data We Collect',
      body: `We collect the following categories of personal data:\n\n• Account data: full name and email address provided during registration.\n• Authentication data: hashed passwords, or OAuth tokens if you sign in via Google.\n• Commute preference data: self-selected campus affiliation and transport mode preferences (LRT, jeepney, walking, night commute).\n• Report data: conditions you flag (type, free-text note, timestamp, and approximate location within the coverage zone). Photo attachments are optional and have EXIF metadata stripped before storage.\n• Usage data: page visits and feature interactions, collected via Firebase Analytics in aggregated, anonymised form.\n• Device data: browser type and operating system, collected automatically by Firebase for error monitoring.`,
    },
    {
      heading: '3. Why We Collect Your Data',
      body: `We collect personal data for the following specific purposes:\n\n• Account management: to create, maintain, and secure your GuidHer account.\n• Service delivery: to allow you to submit commute condition reports and access community safety data.\n• AI moderation: to pass report content (not your name or email) to our Gemini-powered backend for severity classification, duplicate detection, and spam rejection.\n• Safety and integrity: to detect and prevent abuse, fraudulent reports, and policy violations.\n• Platform improvement: to understand aggregate usage patterns and improve the product.\n\nWe do not collect data for advertising, profiling, or sale to third parties.`,
    },
    {
      heading: '4. Legal Basis for Processing',
      body: `Under the Data Privacy Act of 2012, we process your personal data on the following bases:\n\n• Consent: you provide explicit consent at account creation by agreeing to these terms.\n• Contractual necessity: processing is necessary to provide the services you requested.\n• Legitimate interests: security monitoring, spam detection, and platform integrity, provided these do not override your rights.\n\nYou may withdraw consent at any time by deleting your account (see Section 8).`,
    },
    {
      heading: '5. How We Use and Share Your Data',
      body: `Your data is used only as described in Section 3. We share data with the following third-party service providers, all bound by data processing agreements:\n\n• Firebase (Google LLC): authentication, Firestore database, and optional file storage. Firebase processes data under Google's standard data processing terms.\n• Google Gemini API: report text (stripped of personally identifying information where possible) is sent to Gemini for AI classification. Requests are made server-side; your raw data never touches the Gemini API directly from your browser.\n• Render (Render Services, Inc.): our Express backend server is hosted on Render, which processes data in transit.\n• Vercel (Vercel Inc.): the frontend web application is hosted on Vercel.\n\nWe do not sell, rent, or trade your personal data. We do not share data with third parties beyond those listed above, except when required by law or court order.`,
    },
    {
      heading: '6. Data Retention',
      body: `We retain your personal data for as long as your account is active, plus a reasonable period thereafter for legal, audit, and security purposes (not to exceed 12 months post-deletion).\n\nReport content may be retained in anonymised, aggregated form indefinitely to preserve the integrity and historical accuracy of the community safety dataset, even after account deletion.\n\nYou may request earlier deletion of your personal data at any time (see Section 8).`,
    },
    {
      heading: '7. Security Measures',
      body: `We implement reasonable technical and organisational measures to protect your personal data, including:\n\n• Passwords are hashed and never stored in plain text.\n• All data in transit is encrypted using TLS.\n• Firestore Security Rules prevent any client-side direct writes to the reports collection; all writes go through our authenticated backend.\n• The Gemini API key and Firebase service account credentials are stored server-side only and are never exposed to the browser.\n• Photo attachments (when enabled) have EXIF GPS and camera metadata stripped client-side before upload, protecting bystander location privacy.\n\nNo system is completely secure. In the event of a data breach affecting your rights, we will notify affected users as required by law.`,
    },
    {
      heading: '8. Your Rights',
      body: `Under the Data Privacy Act of 2012 and applicable regulations, you have the right to:\n\n• Access: request a copy of the personal data we hold about you.\n• Rectification: correct inaccurate or incomplete data.\n• Erasure: request deletion of your personal data (subject to retention obligations).\n• Data portability: receive your data in a structured, commonly used format.\n• Object: object to processing based on legitimate interests.\n• Withdraw consent: withdraw consent at any time without affecting the lawfulness of prior processing.\n\nTo exercise any of these rights, email us at guidher.privacy@pup.edu.ph. We will respond within 15 business days.`,
    },
    {
      heading: '9. Cookies and Tracking',
      body: `GuidHer uses browser localStorage and session storage to maintain your authentication state and user preferences. We do not use third-party advertising cookies. Firebase may set functional cookies required for Authentication and Analytics. You can block these via your browser settings, but doing so may affect your ability to log in.`,
    },
    {
      heading: '10. Children\'s Privacy',
      body: `GuidHer is not directed at children under 13. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has created an account, we will promptly delete their data. If you believe a child under 13 has registered, contact us at guidher.privacy@pup.edu.ph.`,
    },
    {
      heading: '11. Changes to this Privacy Notice',
      body: `We may update this Privacy Notice to reflect changes in our practices or applicable law. We will notify registered users by email or in-app notification at least 7 days before material changes take effect. Continued use of GuidHer after the effective date of changes constitutes your acceptance of the revised notice.`,
    },
    {
      heading: '12. Contact and Complaints',
      body: `For any privacy concerns, contact our Data Protection Officer at: guidher.privacy@pup.edu.ph\n\nIf you believe your data privacy rights have been violated, you also have the right to lodge a complaint with the National Privacy Commission (NPC) of the Philippines at privacy.gov.ph.`,
    },
  ],
};
