function showRegistration() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("registrationSection").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("registrationSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

async function register() {
  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!fullName || !username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name: fullName, username, email, password }),
    });

    if (response.ok) {
      alert("Registration successful. Please wait for admin approval.");
      showLogin();
    } else {
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }
      if (data && data.detail) {
        alert("Registration failed: " + data.detail);
      } else {
        alert("Registration failed: Unknown error occurred.");
      }
    }
  } catch (error) {
    alert("Registration failed: " + error.message);
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.role === "admin") {
        window.location.href = "../pages/admin.html";
      } else if (data.role === "staff") {
        window.location.href = "../pages/staff.html";
      } else {
        alert("Login successful but unknown role.");
      }
    } else {
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }
      if (data && data.detail) {
        alert("Login failed: " + data.detail);
      } else {
        alert("Login failed: Unknown error occurred.");
      }
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
}

// Admin logout
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    window.location.href = "login.html";
  }
}
