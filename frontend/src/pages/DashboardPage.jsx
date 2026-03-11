import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest, authorizedHeaders } from "../api";
import { getToken, removeToken } from "../auth";
import StatusMessage from "../components/StatusMessage";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  department: "",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const token = getToken();
      console.log("[dashboard] token from localStorage:", token);

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const user = await apiRequest("/user/me", {
          method: "GET",
          headers: authorizedHeaders(),
        });

        console.log("[dashboard] profile loaded:", user);
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          department: user.department || "",
        });
        setMessageType("success");
        setMessage("Profile loaded successfully.");
      } catch (error) {
        console.error("[dashboard] failed to load profile:", error);
        setMessageType("error");
        setMessage(error.message);

        if (error.status === 401 || error.status === 403) {
          removeToken();
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleLogout() {
    removeToken();
    navigate("/login", { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!formData.name.trim()) {
      setMessageType("error");
      setMessage("Name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest("/user/me", {
        method: "PUT",
        headers: authorizedHeaders(),
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          department: formData.department.trim(),
        }),
      });

      setMessageType("success");
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("[dashboard] update failed:", error);
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete your account permanently?");
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiRequest("/user/me", {
        method: "DELETE",
        headers: authorizedHeaders(),
        body: JSON.stringify({
          email: formData.email.trim(),
          confirm: true,
        }),
      });

      removeToken();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("[dashboard] delete failed:", error);
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="page-shell page-shell-dashboard">
      <section className="dashboard-layout">
        <header className="card dashboard-header">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>User profile</h1>
            <p className="subtext">View and manage your account details.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section className="card">
          <div className="section-heading">
            <h2>Profile details</h2>
            <p className="subtext">This data is loaded from your authenticated account.</p>
          </div>

          <StatusMessage message={message} type={messageType} />

          {isLoading ? (
            <p className="muted loading-copy">Loading profile...</p>
          ) : (
            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input name="name" value={formData.name} onChange={handleChange} required />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input name="email" value={formData.email} readOnly />
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Phone</span>
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </label>

                <label className="field">
                  <span>Department</span>
                  <input name="department" value={formData.department} onChange={handleChange} />
                </label>
              </div>

              <label className="field">
                <span>Address</span>
                <textarea name="address" rows="4" value={formData.address} onChange={handleChange} />
              </label>

              <div className="button-row">
                <button type="submit" className="button button-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Update Profile"}
                </button>
                <button type="button" className="button button-danger" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
