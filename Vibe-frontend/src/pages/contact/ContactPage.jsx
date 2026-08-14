import Navbar from "../../components/Navbar";
import ContactImage from "../../assets/contact-img.png";
import ContactForm from "./component/ContactForm";
import doodlePattern from "../../assets/doodle-pattern.svg";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <div
        className="contact-section container-fluid d-flex align-items-center"
        style={{
          minHeight: "88vh",
          backgroundImage: `url(${doodlePattern})`,
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
          backgroundColor: "#eef3ea",
          justifyContent: "center",
        }}
      >
        <div className="row w-100 g-4 align-items-center">
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-center p-4">
            <ContactForm />
          </div>

          <div className="col-12 col-md-6 d-flex align-items-center justify-content-center">
            <img
              src={ContactImage}
              alt="Contact"
              className="img-fluid"
              style={{ maxHeight: "80vh", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
