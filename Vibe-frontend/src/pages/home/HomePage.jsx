import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Hero from "./component/Hero";
import heroBg from "../../assets/Hero-img.jpg";
import HeroNavBtn from "./component/HeroNavBtn";
import FloatingMessages from "./component/FloatingMessage";
import FeatureSection from "./component/FeatureSection";
import HowItWorks from "./component/HowItWorks";
import StatsStrip from "./component/Statsstrip";
import Testimonials from "./component/Testimonials";
import Footer from "./component/Footer";

export default function HomePage() {
  return (
    <>
      <Hero backgroundImage={heroBg}>
        <Navbar />

        {/*
          Positioned near the phone in the background image. Adjust
          anchorBottom/anchorLeft to line up with your actual artwork -
          these are percentages of the Hero section, which is the nearest
          "position: relative" ancestor.
        */}
        <FloatingMessages anchorBottom="40%" anchorLeft="62%" />

        <div
          className="container text-white"
          style={{ paddingTop: "6rem", paddingBottom: "6rem" }}
        >
          <h1 className="display-4 fw-bold">Stay in the vibe.</h1>
          <p className="lead" style={{ maxWidth: "480px" }}>
            Message your friends, anywhere, anytime.
          </p>
          <div className="d-flex gap-2 mt-4">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
        <div
          className="d-flex justify-content-center gap-5"
          style={{
            position: "absolute",
            bottom: "2rem",
            left: 0,
            right: 0,
          }}
        >
          <HeroNavBtn to="#features">Explore Features</HeroNavBtn>
          <HeroNavBtn to="#testimonials">Reviews</HeroNavBtn>
        </div>
      </Hero>

      <HowItWorks />

      <StatsStrip />

      {/* feature section */}
      <FeatureSection />

      <Testimonials />

      <Footer />
    </>
  );
}
