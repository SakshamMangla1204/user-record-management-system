import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { setToken } from "../auth";
import { apiRequest } from "../api";
import AuthCard from "../components/AuthCard";
import StatusMessage from "../components/StatusMessage";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
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

    if (!formData.email.trim() || !formData.password.trim()) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      console.log("[login] success:", data);
      if (!data.access_token) {
        throw new Error("Login response did not include access_token");
      }

      setToken(data.access_token);
      setMessageType("success");
      setMessage("Login successful. Redirecting...");
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      console.error("[login] failed:", error);
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="User Record Management System"
      title="Login"
      description="Access your account to manage your record securely."
      footer={
        <>
          <span className="muted">Need an account?</span>
          <Link to="/register">Create account</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
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

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </label>

        <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <StatusMessage message={message} type={messageType} />
    </AuthCard>
  );
}
