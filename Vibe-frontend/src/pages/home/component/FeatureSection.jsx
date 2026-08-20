import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faLock,
  faUserGroup,
  faCircle,
  faImage,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import FeatureCard from "./FeatureCard";

const ICON_COLORS = {
  orange: "#F17A47",
  mint: "#9FE3CC",
  peach: "#F3BFA0",
};

const FEATURES = [
  {
    icon: <FontAwesomeIcon icon={faPhone} />,
    iconBg: ICON_COLORS.orange,
    title: "HD Audio & Video Calls",
    description:
      "Crystal clear WebRTC peer-to-peer audio and video calls with instant calling timer and controls.",
  },
  {
    icon: <FontAwesomeIcon icon={faLock} />,
    iconBg: ICON_COLORS.mint,
    title: "End-to-End Chat Privacy",
    description:
      "Modern encrypted messaging pipeline ensuring your personal and group discussions remain private.",
  },
  {
    icon: <FontAwesomeIcon icon={faUserGroup} />,
    iconBg: ICON_COLORS.peach,
    title: "Dynamic Groups",
    description:
      "Collaborate in dynamic group spaces with custom avatars, role permissions, and member profiles.",
  },
  {
    icon: <FontAwesomeIcon icon={faCircle} />,
    iconBg: ICON_COLORS.mint,
    title: "Live Presence & Status",
    description:
      "Real-time online, away, and offline indicators with live typing notifications and activity badges.",
  },
  {
    icon: <FontAwesomeIcon icon={faImage} />,
    iconBg: ICON_COLORS.orange,
    title: "Rich Media & File Sharing",
    description:
      "Share high-res images, videos, and documents seamlessly with instant in-chat media previews.",
  },
  {
    icon: <FontAwesomeIcon icon={faBolt} />,
    iconBg: ICON_COLORS.mint,
    title: "Tabbed IDE Workspace",
    description:
      "Multi-tab docking chat layout inspired by modern IDEs to manage multiple conversations effortlessly.",
  },
];

export default function FeatureSection() {
  return (
    <section className="feature-section bg-white py-5" id="features">
      <div className="container" style={{ maxWidth: "1152px" }}>
        <div className="text-center mx-auto mb-5" style={{ maxWidth: "640px" }}>
          <h2
            className="fw-bold"
            style={{ fontSize: "2.25rem", color: "#111827" }}
          >
            Experience the Vibe
          </h2>
          <p
            className="mt-3 mb-0"
            style={{ color: "#6B7280", fontSize: "1rem" }}
          >
            Built with modern performance in mind. Vibe leverages a powerful real-time
            stack for an instant, responsive, and secure communication experience.
          </p>
        </div>

        <div className="row g-4">
          {FEATURES.map((feature) => (
            <div className="col-12 col-md-6 col-lg-4" key={feature.title}>
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
