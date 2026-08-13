import Navbar from "../../components/Navbar";
import ContactImage from "../../assets/contact-img.png";
import ContactForm from "./component/ContactForm";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <div
        className="container-fluid d-flex align-items-center gap-3"
        style={{ minHeight: "84vh" }}
      >
        <div className="col-12 col-md-6 d-flex align-items-center justify-content-center p-4">
          <ContactForm />
        </div>

        <div className="row flex-grow-1 w-100 g-0">
          <div className="col-12 col-md-6">
            <img
              src={ContactImage}
              alt="Contact"
              className="w-90 h-90"
              style={{ objectFit: "fit" }}
            />
          </div>
        </div>
      </div>
      ;
    </>
  );
}
