import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../api";
import { getPendingEmail, removePendingEmail } from "../auth";
import AuthCard from "../components/AuthCard";
import StatusMessage from "../components/StatusMessage";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", otp_code: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const pendingEmail = getPendingEmail();
    if (pendingEmail) {
      setFormData((current) => ({ ...current, email: pendingEmail }));
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!formData.email.trim() || !formData.otp_code.trim()) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/register/verify_otp", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim(),
          otp_code: formData.otp_code.trim(),
        }),
      });

      console.log("[verify] OTP verification successful");
      removePendingEmail();
      setMessageType("success");
      setMessage("Verification successful. Redirecting to login...");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 700);
    } catch (error) {
      console.error("[verify] OTP verification failed:", error);
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="OTP Verification"
      title="Verify your account"
      description="Enter the email and OTP sent to complete registration."
      footer={
        <>
          <span className="muted">Need to request OTP again?</span>
          <Link to="/register">Return to registration</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            id="verify-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>OTP Code</span>
          <input
            id="otp_code"
            type="text"
            name="otp_code"
            value={formData.otp_code}
            onChange={handleChange}
            placeholder="Enter OTP code"
            required
          />
        </label>

        <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
      </form>

      <StatusMessage message={message} type={messageType} />
    </AuthCard>
  );
}
