const API_BASE_URL = "http://127.0.0.1:8001";
const TOKEN_KEY = "urms_token";
const PENDING_EMAIL_KEY = "urms_pending_email";

function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "index.html";
}

function isLoginPage() {
    return getCurrentPage() === "login.html";
}

function isDashboardPage() {
    return getCurrentPage() === "dashboard.html";
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    console.log("[auth] storing token in localStorage");
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    console.log("[auth] removing token from localStorage");
    localStorage.removeItem(TOKEN_KEY);
}

function setPendingEmail(email) {
    localStorage.setItem(PENDING_EMAIL_KEY, email);
}

function getPendingEmail() {
    return localStorage.getItem(PENDING_EMAIL_KEY);
}

function removePendingEmail() {
    localStorage.removeItem(PENDING_EMAIL_KEY);
}

function redirectToLogin(reason) {
    console.warn("[auth] redirecting to login:", reason);
    if (isLoginPage()) {
        return;
    }

    window.location.replace("./login.html");
}

function redirectToDashboard() {
    if (isDashboardPage()) {
        return;
    }

    window.location.replace("./dashboard.html");
}

function showMessage(elementId, message, type) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }

    container.textContent = message;
    container.className = `status-message is-visible is-${type}`;
}

function clearMessage(elementId) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }

    container.textContent = "";
    container.className = "status-message";
}

function setButtonLoading(button, isLoading, loadingLabel) {
    if (!button) {
        return;
    }

    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.textContent;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingLabel : button.dataset.defaultLabel;
}

async function request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    console.log("[api] request:", options.method || "GET", url);

    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        console.log("[api] response:", response.status, url, data);

        if (!response.ok) {
            const errorMessage =
                typeof data === "object" && data !== null
                    ? data.detail || data.message || `Request failed with status ${response.status}`
                    : `Request failed with status ${response.status}`;

            const error = new Error(errorMessage);
            error.status = response.status;
            error.responseData = data;
            throw error;
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            console.error("[api] network error:", url, error);
            throw new Error(`Network error while requesting ${url}`);
        }

        console.error("[api] request failed:", url, error);
        throw error;
    }
}

function trimValue(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateRequiredFields(form) {
    const fields = Array.from(form.querySelectorAll("[required]"));
    for (const field of fields) {
        if (!field.value.trim()) {
            field.focus();
            throw new Error("Please fill in all required fields.");
        }
    }
}

async function fetchAuthenticatedUser() {
    const token = getToken();
    console.log("[auth] token read from localStorage:", token);

    if (!token) {
        return null;
    }

    const user = await request("/user/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return user;
}

function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage("login-message");
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            setButtonLoading(submitButton, true, "Signing in...");
            validateRequiredFields(form);

            const formData = new FormData(form);
            const payload = {
                email: trimValue(formData.get("email")),
                password: trimValue(formData.get("password")),
            };

            console.log("[login] attempting login for:", payload.email);
            const data = await request("/auth/login", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!data.access_token) {
                throw new Error("Login response did not include an access token");
            }

            setToken(data.access_token);
            showMessage("login-message", data.message || "Login successful.", "success");

            window.setTimeout(() => {
                redirectToDashboard();
            }, 500);
        } catch (error) {
            console.error("[login] failed:", error);
            showMessage("login-message", error.message, "error");
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        requestOTP();
    });
}

async function requestOTP() {
    const form = document.getElementById("register-form");
    if (!form) {
        return;
    }

    clearMessage("register-message");
    const submitButton = form.querySelector('button[type="submit"]');

    try {
        setButtonLoading(submitButton, true, "Requesting OTP...");
        validateRequiredFields(form);

        const payload = {
            name: trimValue(document.getElementById("name")?.value || form.elements.name.value),
            email: trimValue(document.getElementById("email")?.value || form.elements.email.value),
            phone: trimValue(document.getElementById("phone")?.value || form.elements.phone.value),
            address: trimValue(document.getElementById("address")?.value || form.elements.address.value),
            department: trimValue(document.getElementById("department")?.value || form.elements.department.value),
        };

        await request("/register/request-otp", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        setPendingEmail(payload.email);
        showMessage("register-message", "OTP sent successfully. Redirecting to verification.", "success");
        window.setTimeout(() => {
            window.location.replace("./verify.html");
        }, 700);
    } catch (error) {
        console.error("[register] request OTP failed:", error);
        showMessage("register-message", error.message, "error");
    } finally {
        setButtonLoading(submitButton, false);
    }
}

function initVerifyPage() {
    const form = document.getElementById("verify-form");
    if (!form) {
        return;
    }

    const emailInput = document.getElementById("verify-email");
    const pendingEmail = getPendingEmail();
    if (pendingEmail && emailInput) {
        emailInput.value = pendingEmail;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        verifyOTP();
    });
}

async function verifyOTP() {
    const form = document.getElementById("verify-form");
    if (!form) {
        return;
    }

    clearMessage("verify-message");
    const submitButton = form.querySelector('button[type="submit"]');

    try {
        setButtonLoading(submitButton, true, "Verifying...");
        validateRequiredFields(form);

        const payload = {
            email: trimValue(document.getElementById("verify-email")?.value || form.elements.email.value),
            otp_code: trimValue(document.getElementById("otp_code")?.value || form.elements.otp_code.value),
        };

        await request("/register/verify_otp", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        removePendingEmail();
        showMessage("verify-message", "Verification successful. Credentials have been emailed.", "success");
        window.setTimeout(() => {
            redirectToLogin("otp verification completed");
        }, 900);
    } catch (error) {
        console.error("[verify] OTP verification failed:", error);
        showMessage("verify-message", error.message, "error");
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function initDashboardPage() {
    const form = document.getElementById("profile-form");
    if (!form) {
        return;
    }

    const logoutButton = document.getElementById("logout-button");
    const deleteButton = document.getElementById("delete-button");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            removeToken();
            redirectToLogin("logout requested");
        });
    }

    try {
        const user = await fetchAuthenticatedUser();

        if (!user) {
            redirectToLogin("missing token before dashboard load");
            return;
        }

        form.elements.name.value = user.name || "";
        form.elements.email.value = user.email || "";
        form.elements.phone.value = user.phone || "";
        form.elements.address.value = user.address || "";
        form.elements.department.value = user.department || "";
        showMessage("dashboard-message", "Profile loaded successfully.", "success");
    } catch (error) {
        const isAuthError = error.status === 401 || error.status === 403;
        showMessage("dashboard-message", error.message, "error");

        if (isAuthError) {
            removeToken();
            redirectToLogin("token invalid or expired");
        } else {
            console.error("[dashboard] non-auth profile load error:", error);
        }
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage("dashboard-message");
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            setButtonLoading(submitButton, true, "Saving...");

            if (!trimValue(form.elements.name.value)) {
                throw new Error("Name is required.");
            }

            const token = getToken();
            const payload = {
                name: trimValue(form.elements.name.value),
                phone: trimValue(form.elements.phone.value),
                address: trimValue(form.elements.address.value),
                department: trimValue(form.elements.department.value),
            };

            await request("/user/me", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            showMessage("dashboard-message", "Profile updated successfully.", "success");
        } catch (error) {
            console.error("[dashboard] update failed:", error);
            showMessage("dashboard-message", error.message, "error");
        } finally {
            setButtonLoading(submitButton, false);
        }
    });

    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            clearMessage("dashboard-message");

            const email = trimValue(form.elements.email.value);
            const confirmed = window.confirm("Delete your account permanently?");
            if (!confirmed) {
                return;
            }

            try {
                setButtonLoading(deleteButton, true, "Deleting...");
                const token = getToken();

                await request("/user/me", {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email,
                        confirm: true,
                    }),
                });

                removeToken();
                showMessage("dashboard-message", "Account deleted successfully.", "success");
                window.setTimeout(() => {
                    redirectToLogin("account deleted");
                }, 700);
            } catch (error) {
                console.error("[dashboard] delete failed:", error);
                showMessage("dashboard-message", error.message, "error");
            } finally {
                setButtonLoading(deleteButton, false);
            }
        });
    }
}

function initPageAuthGuards() {
    const token = getToken();
    console.log("[auth] current page:", getCurrentPage());
    console.log("[auth] token exists:", Boolean(token));

    if (isDashboardPage() && !token) {
        redirectToLogin("dashboard requires token");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initPageAuthGuards();
    initLoginPage();
    initRegisterPage();
    initVerifyPage();
    initDashboardPage();
});
