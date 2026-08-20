import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./css/Legal.css";

const LAST_UPDATED = "August 20, 2026";

const SECTIONS = [
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use-information", title: "How We Use Your Information" },
  { id: "messages-and-encryption", title: "Messages & Encryption" },
  { id: "calls-and-webrtc", title: "Audio & Video Calls" },
  { id: "cookies-and-local-storage", title: "Cookies & Local Storage" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights & Choices" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "security", title: "Security" },
  { id: "changes-to-policy", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <Navbar />

      <header className="legal-hero">
        <h1>Privacy Policy</h1>
        <p className="text-muted mb-0">
          How Vibe collects, uses, and protects your information.
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
              Vibe ("we," "us," or "our") operates a real-time messaging and
              calling application. This Privacy Policy explains what information
              we collect when you use Vibe, why we collect it, and the choices
              you have. By creating an account or using Vibe, you agree to the
              practices described here.
            </p>
          </div>

          <section
            id="information-we-collect"
            className="legal-section card p-4"
          >
            <h2>
              <span className="legal-section-num">01</span>
              Information We Collect
            </h2>
            <h3>Account information</h3>
            <p>
              When you register, we collect your username, email address, and
              password. Your password is never stored in plain text — it's
              hashed before it ever touches our database.
            </p>
            <h3>Profile content</h3>
            <p>
              Anything you choose to add to your profile — display name, avatar,
              banner image, and status — is stored so it can be shown to the
              people you chat with.
            </p>
            <h3>Messages and attachments</h3>
            <p>
              We store the messages you send, along with any files, images, or
              documents you attach, so they can be delivered and remain
              available in your conversation history.
            </p>
            <h3>Usage and presence data</h3>
            <ul>
              <li>Online/away/offline status and "last seen" timestamps</li>
              <li>
                Typing indicators, shown live to other participants in a chat
              </li>
              <li>Read receipts (who has seen a message, and when)</li>
            </ul>
          </section>

          <section
            id="how-we-use-information"
            className="legal-section card p-4"
          >
            <h2>
              <span className="legal-section-num">02</span>
              How We Use Your Information
            </h2>
            <ul>
              <li>
                To create and maintain your account, and keep you signed in
              </li>
              <li>
                To deliver messages, notifications, and call signaling in real
                time
              </li>
              <li>
                To display presence (online status) and typing indicators to
                your contacts
              </li>
              <li>
                To let you manage groups — adding/removing members, admin roles,
                and nicknames
              </li>
              <li>
                To troubleshoot issues and keep the service secure and reliable
              </li>
            </ul>
            <p className="mb-0">
              We do not sell your personal information, and we do not use your
              message content to serve you ads.
            </p>
          </section>

          <section
            id="messages-and-encryption"
            className="legal-section card p-4"
          >
            <h2>
              <span className="legal-section-num">03</span>
              Messages & Encryption
            </h2>
            <p>
              Message content is encrypted before it's written to our database,
              so it isn't stored as readable plain text at rest. Deleting a
              message replaces its content rather than merely hiding it, so
              deleted messages aren't recoverable from our systems.
            </p>
            <p className="mb-0">
              Keep in mind that anyone you send a message to can see it within
              the app, and group members can see messages sent to the group —
              encryption protects your data at rest and in transit, but it
              doesn't change who you've chosen to share a message with.
            </p>
          </section>

          <section id="calls-and-webrtc" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">04</span>
              Audio & Video Calls
            </h2>
            <p>
              Vibe uses WebRTC to connect calls directly between participants
              wherever possible, meaning your call's audio and video typically
              travel peer-to-peer rather than through our servers. Our server is
              only used to "introduce" the two sides of a call (signaling) —
              who's calling whom, and the technical handshake needed to
              establish the connection.
            </p>
            <p className="mb-0">
              When a direct peer-to-peer connection isn't possible (for example,
              due to a restrictive network), call media may be relayed through a
              TURN server operated by our infrastructure provider, Metered.ca,
              solely to keep the call connected. We do not record or store the
              contents of your calls.
            </p>
          </section>

          <section
            id="cookies-and-local-storage"
            className="legal-section card p-4"
          >
            <h2>
              <span className="legal-section-num">05</span>
              Cookies & Local Storage
            </h2>
            <p className="mb-0">
              Vibe uses your browser's local storage — not tracking cookies — to
              keep you signed in between visits. This includes your
              authentication token and basic session details. Clearing your
              browser's site data will sign you out.
            </p>
          </section>

          <section id="third-party-services" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">06</span>
              Third-Party Services
            </h2>
            <p>
              We rely on a small number of infrastructure providers to run Vibe:
            </p>
            <ul>
              <li>
                <strong>Database hosting</strong> — your account, message, and
                file metadata are stored with our database provider.
              </li>
              <li>
                <strong>Metered.ca</strong> — provides STUN/TURN servers that
                help establish and, when necessary, relay audio/video calls.
              </li>
            </ul>
            <p className="mb-0">
              These providers process data only as needed to operate the
              features described above, and are not permitted to use it for
              their own purposes.
            </p>
          </section>

          <section id="data-retention" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">07</span>
              Data Retention
            </h2>
            <p className="mb-0">
              We keep your account and message data for as long as your account
              is active, so your conversation history stays available to you. If
              you delete your account, we remove or anonymize your personal
              information within a reasonable period, except where we're
              required to retain it for legal or security reasons.
            </p>
          </section>

          <section id="your-rights" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">08</span>
              Your Rights & Choices
            </h2>
            <ul>
              <li>
                Access or update your profile information at any time from your
                account settings
              </li>
              <li>Delete individual messages you've sent</li>
              <li>
                Leave a group or block another user to stop receiving messages
                from them
              </li>
              <li>
                Request a copy of your data, or request deletion of your
                account, by contacting us
              </li>
            </ul>
          </section>

          <section id="childrens-privacy" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">09</span>
              Children's Privacy
            </h2>
            <p className="mb-0">
              Vibe is not directed at children, and we do not knowingly collect
              personal information from children under the age required by their
              local law to consent to use of this kind of service. If you
              believe a child has provided us with personal information, please
              contact us so we can remove it.
            </p>
          </section>

          <section id="security" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">10</span>
              Security
            </h2>
            <p className="mb-0">
              We use industry-standard measures — including password hashing,
              authenticated API access, and message encryption at rest — to
              protect your information. No method of transmission or storage is
              100% secure, but we work to continually improve how we safeguard
              your data.
            </p>
          </section>

          <section id="changes-to-policy" className="legal-section card p-4">
            <h2>
              <span className="legal-section-num">11</span>
              Changes to This Policy
            </h2>
            <p className="mb-0">
              We may update this Privacy Policy from time to time. If we make
              material changes, we'll update the "Last updated" date above and,
              where appropriate, notify you within the app.
            </p>
          </section>

          <section
            id="contact"
            className="legal-section card p-4 legal-contact"
          >
            <h2 className="justify-content-center">
              <span className="legal-section-num">12</span>
              Contact Us
            </h2>
            <p className="mb-0">
              Questions about this Privacy Policy? Reach out via the{" "}
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
