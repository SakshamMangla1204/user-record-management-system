import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../api";
import { setPendingEmail } from "../auth";
import StatusMessage from "../components/StatusMessage";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  department: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const isInvalid = Object.values(formData).some((value) => !value.trim());
    if (isInvalid) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/register/request-otp", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          department: formData.department.trim(),
        }),
      });

      setPendingEmail(formData.email.trim());
      setMessageType("success");
      setMessage("OTP sent successfully. Redirecting...");
      window.setTimeout(() => {
        navigate("/verify", { replace: true });
      }, 700);
    } catch (error) {
      console.error("[register] request OTP failed:", error);
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card auth-card auth-card-wide">
        <div className="card-header">
          <span className="eyebrow">Registration</span>
          <h1>Create account request</h1>
          <p className="subtext">Submit your details to receive an OTP for account verification.</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>Name</span>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" required />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Phone</span>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" required />
            </label>

            <label className="field">
              <span>Department</span>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Department"
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Address</span>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              required
            />
          </label>

          <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
            {isSubmitting ? "Requesting OTP..." : "Request OTP"}
          </button>
        </form>

        <StatusMessage message={message} type={messageType} />

        <div className="footer-link-row">
          <span className="muted">Already have credentials?</span>
          <Link to="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
