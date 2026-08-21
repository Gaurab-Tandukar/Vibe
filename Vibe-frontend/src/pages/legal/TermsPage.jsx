import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import "./css/Legal.css";

const LAST_UPDATED = "August 20, 2026";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "eligibility", title: "Eligibility" },
  { id: "your-account", title: "Your Account" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "your-content", title: "Your Content" },
  { id: "groups-and-admins", title: "Groups & Admin Roles" },
  { id: "calls", title: "Audio & Video Calls" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "termination", title: "Suspension & Termination" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "limitation-of-liability", title: "Limitation of Liability" },
  { id: "changes-to-terms", title: "Changes to These Terms" },
  { id: "contact", title: "Contact Us" },
];

export default function TermsPage() {
  return (
    <div className="legal-page">
      <Navbar />

      <header className="legal-hero">
        <h1>Terms &amp; Conditions</h1>
        <p className="text-muted mb-0">
          The rules for using Vibe — please read them before you dive in.
        </p>
        <span className="legal-updated">Last updated: {LAST_UPDATED}</span>
      </header>

      <div className="legal-body">
        <nav className="legal-toc" aria-label="Table of contents">
          <h6>On this page</h6>
          <ol>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-sections">
          <div className="card p-4">
            <p className="mb-0">
              These Terms &amp; Conditions ("Terms") govern your access to
              and use of Vibe, including messaging, group chats,
              attachments, notifications, and audio/video calling. By
              creating an account or otherwise using Vibe, you agree to be
              bound by these Terms. If you don't agree, please don't use
              the service.
            </p>
          </div>

          <section id="acceptance" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">01</span>
              Acceptance of Terms
            </h2>
            <p className="mb-0">
              By registering for an account, you confirm that you've read,
              understood, and agree to these Terms and our{" "}
              <a href="/privacy">Privacy Policy</a>. We may update these
              Terms from time to time, as described in{" "}
              <a href="#changes-to-terms">Section 12</a> below.
            </p>
          </section>

          <section id="eligibility" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">02</span>
              Eligibility
            </h2>
            <p className="mb-0">
              You must be old enough to legally consent to use of an online
              messaging service in your country of residence to create a
              Vibe account. By registering, you confirm that you meet this
              requirement.
            </p>
          </section>

          <section id="your-account" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">03</span>
              Your Account
            </h2>
            <ul>
              <li>You're responsible for keeping your password confidential and for all activity under your account</li>
              <li>Provide accurate information when registering and keep your profile up to date</li>
              <li>Notify us promptly if you believe your account has been compromised</li>
              <li>One person, one account — don't create accounts to impersonate others or evade a block/removal</li>
            </ul>
          </section>

          <section id="acceptable-use" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">04</span>
              Acceptable Use
            </h2>
            <p>When using Vibe, you agree not to:</p>
            <ul>
              <li>Send content that is illegal, harassing, hateful, threatening, or sexually exploitative, including of minors</li>
              <li>Upload malware, or attachments intended to harm another user's device or account</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with someone</li>
              <li>Attempt to access another user's account, or interfere with the security or operation of the service</li>
              <li>Use Vibe to send spam, unsolicited bulk messages, or automated abuse</li>
              <li>Use group chats or calls to harass, dox, or coordinate harm against other users</li>
            </ul>
            <p className="mb-0">
              Violating this section may result in message removal, group
              removal, or suspension or termination of your account, as
              described in <a href="#termination">Section 9</a>.
            </p>
          </section>

          <section id="your-content" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">05</span>
              Your Content
            </h2>
            <p>
              You retain ownership of the messages, images, and files you
              send through Vibe ("your content"). By sending content, you
              grant us a limited license to store, transmit, and display
              it solely for the purpose of operating the service — for
              example, delivering it to the recipients you chose.
            </p>
            <p className="mb-0">
              You're solely responsible for the content you send and for
              having the right to share any files or images you upload.
            </p>
          </section>

          <section id="groups-and-admins" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">06</span>
              Groups & Admin Roles
            </h2>
            <p className="mb-0">
              Group creators start as admins and can add or remove members,
              rename the group, and transfer admin rights. If you're a
              group admin, you're responsible for moderating the members
              and content of groups you manage, consistent with{" "}
              <a href="#acceptable-use">Section 4</a>.
            </p>
          </section>

          <section id="calls" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">07</span>
              Audio & Video Calls
            </h2>
            <p>
              Vibe's calling feature uses your device's microphone and, for
              video calls, camera. Call quality depends on your network
              connection and the connection of the person you're calling,
              and we can't guarantee uninterrupted or error-free calls.
            </p>
            <p className="mb-0">
              Vibe is not designed or intended for emergency communications
              of any kind. Do not rely on Vibe calling to contact emergency
              services.
            </p>
          </section>

          <section id="intellectual-property" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">08</span>
              Intellectual Property
            </h2>
            <p className="mb-0">
              The Vibe name, logo, and application (excluding your content)
              are owned by us or our licensors and are protected by
              applicable intellectual property laws. You may not copy,
              modify, or distribute any part of the service without our
              prior written permission.
            </p>
          </section>

          <section id="termination" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">09</span>
              Suspension & Termination
            </h2>
            <p className="mb-0">
              You may stop using Vibe and delete your account at any time.
              We may suspend or terminate your access if you violate these
              Terms, misuse the service, or where required by law. Where
              reasonably possible, we'll try to let you know why.
            </p>
          </section>

          <section id="disclaimers" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">10</span>
              Disclaimers
            </h2>
            <p className="mb-0">
              Vibe is provided "as is" and "as available," without
              warranties of any kind, express or implied, including
              warranties of merchantability, fitness for a particular
              purpose, or non-infringement. We don't guarantee the service
              will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section id="limitation-of-liability" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">11</span>
              Limitation of Liability
            </h2>
            <p className="mb-0">
              To the fullest extent permitted by law, Vibe and its
              operators won't be liable for any indirect, incidental,
              special, or consequential damages arising from your use of,
              or inability to use, the service — including loss of data,
              messages, or profits.
            </p>
          </section>

          <section id="changes-to-terms" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">12</span>
              Changes to These Terms
            </h2>
            <p className="mb-0">
              We may revise these Terms from time to time. If we make
              material changes, we'll update the "Last updated" date above
              and, where appropriate, notify you within the app. Continuing
              to use Vibe after changes take effect means you accept the
              updated Terms.
            </p>
          </section>

          <section id="contact" className="legal-section card p-4 legal-contact">
            <h2 className="justify-content-center">
              <span className="legal-section-num">13</span>
              Contact Us
            </h2>
            <p className="mb-0">
              Questions about these Terms? Reach out via the{" "}
              <a href="/contact">Contact page</a>.
            </p>
          </section>

          <div className="text-center">
            <a href="#top" className="legal-back-to-top">
              ↑ Back to top
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}