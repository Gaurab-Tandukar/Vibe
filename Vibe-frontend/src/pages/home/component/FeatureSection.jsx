import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faMagnifyingGlass,
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
    icon: <FontAwesomeIcon icon={faUserPlus} />,
    iconBg: ICON_COLORS.orange,
    title: "Add Friends",
    description:
      "Quickly expand your network. Search by username or email and connect instantly.",
  },
  {
    icon: <FontAwesomeIcon icon={faMagnifyingGlass} />,
    iconBg: ICON_COLORS.mint,
    title: "Search Friends",
    description:
      "A powerful global search interface to find colleagues and teammates effortlessly.",
  },
  {
    icon: <FontAwesomeIcon icon={faUserGroup} />,
    iconBg: ICON_COLORS.peach,
    title: "Create Groups",
    description:
      "Collaborate on projects or keep up with your inner circle with advanced group management.",
  },
  {
    icon: <FontAwesomeIcon icon={faCircle} />,
    iconBg: ICON_COLORS.mint,
    title: "Status Indicators",
    description:
      "See who's online, away, or busy with ultra-fast real-time presence tracking.",
  },
  {
    icon: <FontAwesomeIcon icon={faImage} />,
    iconBg: ICON_COLORS.orange,
    title: "Image Sharing",
    description:
      "Drag and drop high-quality images directly into chats with instant cloud processing.",
  },
  {
    icon: <FontAwesomeIcon icon={faBolt} />,
    iconBg: ICON_COLORS.mint,
    title: "Real-Time Messaging",
    description:
      "Zero latency delivery. Messages reach their destination as fast as you hit enter.",
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
            Message with Vibe
          </h2>
          <p
            className="mt-3 mb-0"
            style={{ color: "#6B7280", fontSize: "1rem" }}
          >
            Built with performance in mind. Loopline leverages the MERN stack
            for a lag-free, scalable experience.
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
