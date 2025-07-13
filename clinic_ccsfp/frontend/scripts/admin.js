//sidebar/dashboard

let activeSection = "dashboard";
let currentRecordIndex = null;
let consultationRecords = [];

let dashboardChart = null;
let dashboardInitialized = false;
let resizeTimeout;

function setActiveSection(section) {
  console.log("setActiveSection called with section:", section);
  activeSection = section;

  const menuItems = document.querySelectorAll(".sidebar-menu-item");
  menuItems.forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-section") === section) {
      item.classList.add("active");
    }
  });

  const sections = document.querySelectorAll(".section-content");
  sections.forEach((el) => el.classList.remove("active"));

  const activeEl = document.getElementById(`${section}-section`);
  if (activeEl) activeEl.classList.add("active");
}

function isDashboardVisible() {
  const section = document.querySelector('[data-section="dashboard"]');
  if (!section) return false;

  const style = window.getComputedStyle(section);
  return style.display !== "none" && style.visibility !== "hidden";
}

function waitForDashboardVisible(maxWaitTime = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (isDashboardVisible()) return resolve(true);
      if (Date.now() - start > maxWaitTime) return reject("Dashboard timeout");
      setTimeout(check, 100);
    }

    check();
  });
}

function ensureDashboardActive() {
  setActiveSection("dashboard");

  const dashboard = document.querySelector('[data-section="dashboard"]');
  if (dashboard) {
    dashboard.style.display = "block";
    dashboard.style.visibility = "visible";
  }

  const others = document.querySelectorAll(".content-section:not([data-section='dashboard'])");
  others.forEach((el) => (el.style.display = "none"));
}

function setDefaultCounts() {
  const counters = [
    { id: "filescount", value: "0" },
    { id: "usersCount", value: "0" },
    { id: "appointmentCount", value: "0" },
  ];
  counters.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el && (!el.textContent || el.textContent.trim() === "")) {
      el.textContent = value;
    }
  });
}

async function createOrUpdateChart() {
  const canvas = document.getElementById("Chart");
  if (!canvas) return false;

  const files = parseInt(document.getElementById("filescount")?.textContent || "0");
  const users = parseInt(document.getElementById("usersCount")?.textContent || "0");
  const appointments = parseInt(document.getElementById("appointmentCount")?.textContent || "0");
  const records = parseInt(document.getElementById("recordsCount")?.textContent || "0");

  if (dashboardChart) {
    dashboardChart.destroy();
    dashboardChart = null;
  }

  try {
    dashboardChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Files", "Users", "Appointments", "Records"],
        datasets: [{
          label: "Records Count",
          data: [files, users, appointments, records],
          backgroundColor: ["#60a5fa", "#34d399", "#f87171", "#a78bfa"],
          borderColor: ["#3b82f6", "#10b981", "#ef4444", "#8b5cf6"],
          borderWidth: 1,
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(200, files, users, appointments, records) * 1.0,
            ticks: {
              callback: value => value >= 1000 ? `${Math.round(value / 1000)}k` : value
            }
          }
        }
      }
    });
    return true;
  } catch (err) {
    console.error("Chart error:", err);
    return false;
  }
}

async function initializeDashboard() {
  if (dashboardInitialized) return;

  try {
    ensureDashboardActive();
    await waitForDashboardVisible();
    setDefaultCounts();
    await new Promise((res) => setTimeout(res, 100));
    const success = await createOrUpdateChart();

    if (success) {
      dashboardInitialized = true;
      console.log("Dashboard initialized");
    }
  } catch (err) {
    console.error("Dashboard init error:", err);
    setTimeout(createOrUpdateChart, 500);
  }
}

function initializeApp() {
  const menuItems = document.querySelectorAll(".sidebar-menu-item");

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const section = item.getAttribute("data-section");
      setActiveSection(section);

      // 🔁 Auto-refresh chart when Dashboard is clicked
      if (section === "dashboard") {
        dashboardInitialized = false;
        initializeDashboard();
      }
    });

    item.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const section = item.getAttribute("data-section");
        setActiveSection(section);

        if (section === "dashboard") {
          dashboardInitialized = false;
          initializeDashboard();
        }
      }
    });
  });

  if (typeof initializeHoverEffects === "function") {
    initializeHoverEffects();
  }

  [100, 500, 1000, 2000].forEach((delay) => {
    setTimeout(() => {
      if (!dashboardInitialized) initializeDashboard();
    }, delay);
  });
}

// Initialize when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Ensure dashboard chart resizes correctly
window.addEventListener("load", () => {
  setTimeout(() => {
    if (!dashboardInitialized) initializeDashboard();
  }, 1000);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && dashboardChart && isDashboardVisible()) {
    setTimeout(() => {
      dashboardChart.resize();
      dashboardChart.update("none");
    }, 100);
  }
});

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (dashboardChart && isDashboardVisible()) {
      dashboardChart.resize();
    }
  }, 250);
});

window.dashboardControl = {
  refresh() {
    dashboardInitialized = false;
    initializeDashboard();
  },
  status() {
    console.log("Dashboard status:", {
      initialized: dashboardInitialized,
      chartExists: !!dashboardChart,
      dashboardVisible: isDashboardVisible(),
      canvasExists: !!document.getElementById("Chart"),
    });
  },
  activate() {
    ensureDashboardActive();
    setTimeout(initializeDashboard, 100);
  },
};

console.log("Dashboard script loaded");


window.onload = () => {
      loadAdminUsers();
    };

    async function loadAdminUsers() {
      const tbody = document.getElementById("adminUsersBody");
      tbody.innerHTML = "";

      try {
        const response = await fetch("http://localhost:8000/admin-users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const users = await response.json();

        document.getElementById("usersCount").textContent = users.length;

        if (users.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No users found.</td></tr>`;
          return;
        }

        users.forEach((user) => {
          const tr = document.createElement("tr");
          let actionButtons = "";

          if (user.status === "Pending") {
            actionButtons = `
              <div style="display: flex; gap: 5px;">
                <button class="btn" onclick="approveUser('${user.username}')"  style="background-color: green; padding: 7px 20px;">Approve</button>
                <button class="btn" onclick="deleteUser('${user.username}')" style="background-color: red; padding: 7px 22px;">Delete</button>
              </div>
            `;
          } else {
            actionButtons = `
              <div style="display: flex;">
                <button class="btn" onclick="deleteUser('${user.username}')" style="background-color: red; padding: 7px 25px;">Delete</button>
              </div>
            `;
          }

          tr.innerHTML = `
            <td>${user.full_name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.status}</td>
            <td>${actionButtons}</td>
          `;
          tbody.appendChild(tr);
        });

      } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading users.</td></tr>`;
      }
    }

    async function approveUser(username) {
      try {
        const response = await fetch("http://localhost:8000/approve-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });

        if (response.ok) {
          alert("User approved!");
          await loadAdminUsers();
        } else {
          const data = await response.json();
          alert("Failed to approve user: " + data.detail);
        }
      } catch (error) {
        alert("Error approving user: " + error.message);
      }
    }

    async function deleteUser(username) {
      if (!confirm(`Are you sure you want to delete "${username}"?`)) return;

      try {
        const response = await fetch(`http://localhost:8000/delete-user/${username}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("User deleted.");
          await loadAdminUsers();
        } else {
          const data = await response.json();
          alert("Failed to delete user: " + data.detail);
        }
      } catch (error) {
        alert("Error deleting user: " + error.message);
      }
    }

    async function addAdminUser() {
      const full_name = document.getElementById("adminFullName").value.trim();
      const username = document.getElementById("adminUsername").value.trim();
      const email = document.getElementById("adminEmail").value.trim();
      const password = document.getElementById("adminPassword").value;
    
      if (!full_name || !username || !email || !password) {
        alert("Please fill out all fields.");
        return;
      }
    
      try {
        const response = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: full_name,
            username: username,
            email: email,
            password: password,
            role: "nurse", 
          }),
        });
    
        if (response.ok) {
          alert("Nurse admin added! They can now log in.");
          document.getElementById("adminFullName").value = "";
          document.getElementById("adminUsername").value = "";
          document.getElementById("adminEmail").value = "";
          document.getElementById("adminPassword").value = "";
          await loadAdminUsers(); 
        } else {
          const data = await response.json();
          alert("Failed to add nurse: " + data.detail);
        }
      } catch (error) {
        alert("Error adding nurse: " + error.message);
      }
    }
    
    

// Function to fetch consultation data
async function fetchConsultationData() {
  console.log('Fetching consultation data...');

  try {
    const response = await fetch("http://localhost:8000/consultations");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched consultation records:', data.length);
    const countEl = document.getElementById("filescount");
    if (countEl) {
      countEl.textContent = data.length.toString();
    }

    consultationRecords = data.map(record => {
      let dateOfVisit = "";
      let timeOfVisit = "";
      if (record.dateTime) {
        const parts = record.dateTime.split("T");
        dateOfVisit = parts[0] || "";
        timeOfVisit = parts[1] || "";
      }
      return {
        ...record,
        dateOfVisit,
        timeOfVisit,
        reasonForVisit: record.concern
      };
    });

    renderConsultationList();

    return data;

  } catch (error) {
    console.error('Error fetching consultations:', error);
    const countEl = document.getElementById("filescount");
    if (countEl) {
      countEl.textContent = "0";
    }
    consultationRecords = []; 
    renderConsultationList(); 
    return [];
  }
}

// Function to handle section changes
function handleSectionChange(section) {
  console.log('Section changed to:', section);
  if (section === 'dashboard') {
    setTimeout(() => {
      if (typeof initializeDashboard === 'function') {
        initializeDashboard();
      }
    }, 50);
  }
}

// Load consultation records from backend
async function loadConsultationRecords() {
  await fetchConsultationData();
}

document.addEventListener("DOMContentLoaded", function () {
  const menuItems = document.querySelectorAll(".sidebar-menu-item");

  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const section = this.getAttribute("data-section");
      setActiveSection(section);
    });

    item.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const section = this.getAttribute("data-section");
        setActiveSection(section);
      }
    });
  });

  initializeHoverEffects();
  loadConsultationRecords(); 
});

// Render consultation list in the admin panel
function renderConsultationList() {
  const patientList = document.getElementById("patient-list");
  const emptyState = document.getElementById("empty-state");
  patientList.innerHTML = ""; 

  if (consultationRecords.length === 0) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  consultationRecords.forEach((record, index) => {
    const patientItem = document.createElement("div");
    patientItem.classList.add("patient-item");

    // Convert 24-hour time to 12-hour with AM/PM
    function formatTime24to12(time24) {
      if (!time24) return "";
      const [hourStr, minute] = time24.split(":");
      let hour = parseInt(hourStr);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return `${hour}:${minute} ${ampm}`;
    }

    const time12h = formatTime24to12(record.timeOfVisit);

    patientItem.textContent =
      `ID: ${record.studentId} | ` +
      `${record.firstName} ${record.middleInitial} ${record.lastName} | ` +
      `Gender: ${record.gender} | ` +
      `Section: ${record.gradeSection} | ` +
      `Date: ${record.dateOfVisit} | ` +
      `Time: ${time12h}`;

    patientItem.tabIndex = 0;
    patientItem.addEventListener("click", () => {
      showConsultationDetails(index);
    });
    patientItem.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        showConsultationDetails(index);
      }
    });

    patientList.appendChild(patientItem);
  });
}

// Function to delete consultation record from backend
async function deleteConsultationRecord() {
  if (currentRecordIndex === null) {
    alert("No consultation record selected to delete.");
    console.warn("No record selected.");
    return;
  }

  if (!confirm("Are you sure you want to delete this consultation record?")) {
    console.log("Delete cancelled by user.");
    return;
  }

  console.log("Continue to delete..."); 

  const recordToDelete = consultationRecords[currentRecordIndex];
  const recordId = recordToDelete._id || recordToDelete.id;

  console.log("Deleting consultation with ID:", recordId);

  if (!recordId) {
    alert("No valid ID found for the selected consultation record.");
    console.error("No id found!!!.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/consultations/${recordId}`, {
      method: "DELETE",
    });

    console.log("Delete response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.detail || "Unknown error";
      alert("Failed to delete consultation: " + errorMsg);
      console.error("Failed to delete: ", errorMsg);
      return;
    }

    alert("Consultation record deleted successfully.");
    console.log("Successful delete consultation.");
    await loadConsultationRecords();
    showListView(); 
    currentRecordIndex = null; 

  } catch (error) {
    alert("Error deleting consultation record: " + error.message);
    console.error("Error deleting consultation record: ", error.message);
  }
}

// Show consultation details in admin panel
function showConsultationDetails(index) {
  currentRecordIndex = index;
  const record = consultationRecords[index];

  // Populate student info
  const studentInfo = document.getElementById("student-info");
  studentInfo.innerHTML = `
    <p><strong>Student Id:</strong> ${record.studentId}</p>
    <p><strong>First Name:</strong> ${record.firstName}</p>
    <p><strong>Middle Initial:</strong> ${record.middleInitial}</p>
    <p><strong>Last Name:</strong> ${record.lastName}</p>
    <p><strong>Age:</strong> ${record.age}</p>
    <p><strong>Gender:</strong> ${record.gender}</p>
    <p><strong>Grade & Section:</strong> ${record.gradeSection}</p>
    <p><strong>Date of Birth:</strong> ${record.dateOfBirth}</p>
    <p><strong>Address:</strong> ${record.address}</p>
    <p><strong>Parent/Guardian:</strong> ${record.parentGuardian}</p>
    <p><strong>Contact Number:</strong> ${record.contactNumber}</p>
  `;

  const visitInfo = document.getElementById("visit-info");
  function formatTime24to12(time24) {
    if (!time24) return "";
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  const time12h = formatTime24to12(record.timeOfVisit);

  visitInfo.innerHTML = `
    <p><strong>Date of Visit:</strong> ${record.dateOfVisit}</p>
    <p><strong>Time of Visit:</strong> ${time12h}</p>
    <p><strong>Reason for Visit:</strong> ${record.reasonForVisit}</p>
    <p><strong>Temperature:</strong> ${record.temperature}</p>
    <p><strong>Pulse Rate:</strong> ${record.pulseRate}</p>
    <p><strong>Blood Pressure:</strong> ${record.bloodPressure}</p>
    <p><strong>Respiratory Rate:</strong> ${record.respiratoryRate}</p>
    <p><strong>Assessment:</strong> ${record.assessment}</p>
    <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
    <p><strong>Actions Taken:</strong></p>
    <ul>
      <li>Rested in clinic: ${record.actionsTaken.restedInClinic ? "Yes" : "No"}</li>
      <li>Given first aid: ${record.actionsTaken.givenFirstAid ? "Yes" : "No"}</li>
      <li>Administered medication: ${record.actionsTaken.administeredMedication ? "Yes" : "No"}</li>
      <li>Medication details: ${record.actionsTaken.medicationDetails}</li>
      <li>Sent home: ${record.actionsTaken.sentHome ? "Yes" : "No"}</li>
      <li>Referred: ${record.actionsTaken.referred ? "Yes" : "No"}</li>
      <li>Referred to: ${record.actionsTaken.referredTo}</li>
      <li>Others: ${record.actionsTaken.others ? "Yes" : "No"}</li>
      <li>Others details: ${record.actionsTaken.othersDetails}</li>
    </ul>
    <p><strong>Recommendations:</strong> ${record.recommendations}</p>
    <p><strong>Attending Nurse Name:</strong> ${record.nurseName}</p>
    <p><strong>Signature:</strong> ${record.nurseSignature}</p>
    <p><strong>Date:</strong> ${record.nurseDate}</p>
  `;

  // Show details view and hide list view
  document.getElementById("list-view").classList.add("hidden");
  document.getElementById("details-view").classList.remove("hidden");
  document.getElementById("edit-view").classList.add("hidden");

  if (typeof setActiveSection === 'function') {
    setActiveSection("files");
  }
  // Attach delete button event listener here
  document.getElementById("delete-btn")?.addEventListener("click", deleteConsultationRecord);
}

function initializeHoverEffects() {
  const menuItems = document.querySelectorAll(
    ".sidebar-menu-item, .sidebar-logout-btn"
  );

  menuItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(2px)";
      }
    });

    item.addEventListener("mouseleave", function () {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(0px)";
      }
    });
  });
}


function getCurrentSection() {
  return activeSection;
}

// Export functions for potential external use
window.adminDashboard = {
  setActiveSection: setActiveSection,
  getCurrentSection: getCurrentSection,
  switchToSection: setActiveSection, 
  handleLogout: handleLogout,
};

// Add Consultation Record 
async function addConsultationRecord() {
  const studentId = document.getElementById("studentId").value;
  const firstName = document.getElementById("firstName").value;
  const middleInitial = document.getElementById("middleInitial").value;
  const lastName = document.getElementById("lastName").value;
  const ageValue = document.getElementById("age").value;
  const age = parseInt(ageValue);
  const gender = document.getElementById("gender").value;
  const gradeSection = document.getElementById("gradeSection").value;
  const dateOfBirth = document.getElementById("dateOfBirth").value;
  const address = document.getElementById("address").value;
  const parentGuardian = document.getElementById("parentGuardian").value;
  const contactNumber = document.getElementById("contactNumber").value;
  const dateOfVisit = document.getElementById("dateOfVisit").value;
  const timeOfVisit = document.getElementById("timeOfVisit").value;
  const reasonForVisit = document.getElementById("reasonForVisit").value;
  const temperature = document.getElementById("temperature").value;
  const pulseRate = document.getElementById("pulseRate").value;
  const bloodPressure = document.getElementById("bloodPressure").value;
  const respiratoryRate = document.getElementById("respiratoryRate").value;
  const assessment = document.getElementById("assessment").value;
  const diagnosis = document.getElementById("diagnosis").value;
  const actionsTaken = {
    restedInClinic: document.getElementById("restedInClinic").checked,
    givenFirstAid: document.getElementById("givenFirstAid").checked,
    administeredMedication: document.getElementById("administeredMedication").checked,
    medicationDetails: document.getElementById("medicationDetails").value,
    sentHome: document.getElementById("sentHome").checked,
    referred: document.getElementById("referred").checked,
    referredTo: document.getElementById("referredTo").value,
    others: document.getElementById("others").checked,
    othersDetails: document.getElementById("othersDetails").value,
  };
  const recommendations = document.getElementById("recommendations").value;
  const nurseName = document.getElementById("nurseName").value;
  const nurseSignature = document.getElementById("nurseSignature").value;
  const nurseDate = document.getElementById("nurseDate").value;
  const consultationData = {
    studentId,
    firstName,
    middleInitial,
    lastName,
    age,
    gender,
    gradeSection,
    dateOfBirth,
    address,
    parentGuardian,
    contactNumber,
    concern: reasonForVisit,
    nurse: nurseName + " " + nurseDate,
    dateTime: dateOfVisit && timeOfVisit ? dateOfVisit + "T" + timeOfVisit : "",
    status: "Pending",
    temperature,
    pulseRate,
    bloodPressure,
    respiratoryRate,
    assessment,
    diagnosis,
    actionsTaken,
    recommendations,
    nurseName,
    nurseSignature,
    nurseDate,
  };

  try {
    const response = await fetch("http://localhost:8000/consultations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(consultationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = errorData.detail;
      if (typeof errorMessage === "object") {
        errorMessage = JSON.stringify(errorMessage);
      }
      console.error("Failed to save consultation: " + errorMessage); 
      return;
    }

    console.log("Consultation record saved successfully."); 
    clearConsultationForm();
    toggleModal("add-form-modal");
    loadConsultationRecords();
  } catch (error) {
    console.error("Error saving consultation record: " + error.message);
  }
}

//clear the consultation
function clearConsultationForm() {
  document.getElementById("studentId").value = "";
  document.getElementById("firstName").value = "";
  document.getElementById("middleInitial").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("age").value = "";
  document.getElementById("gender").value = "";
  document.getElementById("gradeSection").value = "";
  document.getElementById("dateOfBirth").value = "";
  document.getElementById("address").value = "";
  document.getElementById("parentGuardian").value = "";
  document.getElementById("contactNumber").value = "";
  document.getElementById("dateOfVisit").value = "";
  document.getElementById("timeOfVisit").value = "";
  document.getElementById("reasonForVisit").value = "";
  document.getElementById("temperature").value = "";
  document.getElementById("pulseRate").value = "";
  document.getElementById("bloodPressure").value = "";
  document.getElementById("respiratoryRate").value = "";
  document.getElementById("assessment").value = "";
  document.getElementById("diagnosis").value = "";
  document.getElementById("restedInClinic").checked = false;
  document.getElementById("givenFirstAid").checked = false;
  document.getElementById("administeredMedication").checked = false;
  document.getElementById("medicationDetails").value = "";
  document.getElementById("sentHome").checked = false;
  document.getElementById("referred").checked = false;
  document.getElementById("referredTo").value = "";
  document.getElementById("others").checked = false;
  document.getElementById("othersDetails").value = "";
  document.getElementById("recommendations").value = "";
  document.getElementById("nurseName").value = "";
  document.getElementById("nurseSignature").value = "";
  document.getElementById("nurseDate").value = "";
}

document.getElementById("save-btn")?.addEventListener("click", addConsultationRecord);
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  modal?.classList.toggle("hidden");
}

//New Consultation Button 
document.getElementById("new-consultation-btn")?.addEventListener("click", function () {
  toggleModal("add-form-modal");
});

//Modal Close Button 
document.getElementById("modal-close-btn")?.addEventListener("click", function () {
  toggleModal("add-form-modal");
});

//Preview Close Button 
document.getElementById("preview-close-btn")?.addEventListener("click", function () {
  toggleModal("preview-modal");
});

//filter consultation records
function filterConsultations() {
  const searchInput = document
    .getElementById("search-input")
    .value.toLowerCase();
  const patientList = document.getElementById("patient-list");
  const patients = patientList.getElementsByClassName("patient-item");

  Array.from(patients).forEach((patient) => {
    const patientName = patient.textContent.toLowerCase();
    if (patientName.includes(searchInput)) {
      patient.style.display = "";
    } else {
      patient.style.display = "none";
    }
  });
}

//Search Input
document.getElementById("search-input")?.addEventListener("input", filterConsultations);

//initialize the dashboard 
function initDashboard() {
  setActiveSection("dashboard");
}

// show list view
function showListView() {
  document.getElementById("list-view")?.classList.remove("hidden");
  document.getElementById("details-view")?.classList.add("hidden");
  document.getElementById("edit-view")?.classList.add("hidden");

  if (typeof setActiveSection === 'function') {
    setActiveSection("files");
  }
}

//show edit form view with populated data
function showEditView() {
  if (currentRecordIndex === null) return;
  const record = consultationRecords[currentRecordIndex];
  const formContainer = document.getElementById("consultation-form");
  if (!formContainer) {
    console.error("Form container 'consultation-form' not found.");
    return;
  }

  formContainer.innerHTML = `
    <div class="form-section">
      <h6 class="form-section-title">I. STUDENT INFORMATION</h6>
      <div class="form-grid">
      <div class="form-group">
          <label class="form-label">Student_Id</label>
          <input type="text" class="form-control" id="edit-studentId" value="${
            record.studentId || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input type="text" class="form-control" id="edit-firstName" value="${
            record.firstName || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">M.I.</label>
          <input type="text" class="form-control" id="edit-middleInitial" maxlength="1" value="${
            record.middleInitial || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-control" id="edit-lastName" value="${
            record.lastName || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Age</label>
          <input type="number" class="form-control" id="edit-age" value="${
            record.age || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-control" id="edit-gender">
            <option value="">Select Gender</option>
            <option value="Male" ${
              record.gender === "Male" ? "selected" : ""
            }>Male</option>
            <option value="Female" ${
              record.gender === "Female" ? "selected" : ""
            }>Female</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Grade & Section</label>
          <input type="text" class="form-control" id="edit-gradeSection" value="${
            record.gradeSection || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Date of Birth</label>
          <input type="date" class="form-control" id="edit-dateOfBirth" value="${
            record.dateOfBirth || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <input type="text" class="form-control" id="edit-address" value="${
            record.address || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Parent/Guardian</label>
          <input type="text" class="form-control" id="edit-parentGuardian" value="${
            record.parentGuardian || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Contact Number</label>
          <input type="tel" class="form-control" id="edit-contactNumber" value="${
            record.contactNumber || ''
          }" />
        </div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">II. VISIT DETAILS</h6>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date of Visit</label>
          <input type="date" class="form-control" id="edit-dateOfVisit" value="${
            record.dateOfVisit || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input type="time" class="form-control" id="edit-timeOfVisit" value="${
            record.timeOfVisit || ''
          }" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Reason for Visit / Complaint</label>
          <textarea class="form-control" rows="3" id="edit-reasonForVisit">${
            record.reasonForVisit || ''
          }</textarea>
        </div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">III. VITAL SIGNS</h6>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Temperature (°C)</label>
          <input type="text" class="form-control" id="edit-temperature" value="${
            record.temperature || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Pulse Rate (bpm)</label>
          <input type="text" class="form-control" id="edit-pulseRate" value="${
            record.pulseRate || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Blood Pressure (mmHg)</label>
          <input type="text" class="form-control" id="edit-bloodPressure" value="${
            record.bloodPressure || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Respiratory Rate (bpm)</label>
          <input type="text" class="form-control" id="edit-respiratoryRate" value="${
            record.respiratoryRate || ''
          }" />
        </div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">IV. ASSESSMENT / OBSERVATION</h6>
      <textarea class="form-control" rows="4" id="edit-assessment">${
        record.assessment || ''
      }</textarea>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">V. DIAGNOSIS / IMPRESSION</h6>
      <textarea class="form-control" rows="3" id="edit-diagnosis">${
        record.diagnosis || ''
      }</textarea>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VI. ACTION TAKEN</h6>
      <div class="checkbox-grid">
        <div class="checkbox-group">
          <input type="checkbox" id="edit-restedInClinic" class="form-checkbox" ${
            record.actionsTaken?.restedInClinic ? "checked" : ""
          } />
          <label for="edit-restedInClinic">Rested in clinic</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="edit-givenFirstAid" class="form-checkbox" ${
            record.actionsTaken?.givenFirstAid ? "checked" : ""
          } />
          <label for="edit-givenFirstAid">Given first aid</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="edit-administeredMedication" class="form-checkbox" ${
            record.actionsTaken?.administeredMedication ? "checked" : ""
          } />
          <label for="edit-administeredMedication">Administered medication:</label>
          <input type="text" class="form-control" id="edit-medicationDetails" value="${
            record.actionsTaken?.medicationDetails || ''
          }" placeholder="Medication details" />
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="edit-sentHome" class="form-checkbox" ${
            record.actionsTaken?.sentHome ? "checked" : ""
          } />
          <label for="edit-sentHome">Sent home</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="edit-referred" class="form-checkbox" ${
            record.actionsTaken?.referred ? "checked" : ""
          } />
          <label for="edit-referred">Referred to:</label>
          <input type="text" class="form-control" id="edit-referredTo" value="${
            record.actionsTaken?.referredTo || ''
          }" placeholder="Referred to" />
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="edit-others" class="form-checkbox" ${
            record.actionsTaken?.others ? "checked" : ""
          } />
          <label for="edit-others">Others:</label>
          <input type="text" class="form-control" id="edit-othersDetails" value="${
            record.actionsTaken?.othersDetails || ''
          }" placeholder="Other actions taken" />
        </div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VII. RECOMMENDATIONS / REMARKS</h6>
      <textarea class="form-control" rows="4" id="edit-recommendations">${
        record.recommendations || ''
      }</textarea>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VIII. ATTENDING NURSE / SCHOOL HEALTH PERSONNEL</h6>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-control" id="edit-nurseName" value="${
            record.nurseName || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Signature</label>
          <input type="text" class="form-control" id="edit-nurseSignature" value="${
            record.nurseSignature || ''
          }" />
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-control" id="edit-nurseDate" value="${
            record.nurseDate || ''
          }" />
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" id="update-btn">Update Consultation Record</button>
      <button class="btn btn-secondary" id="cancel-edit-btn">Cancel</button>
    </div>
  `;

  // Show edit view and hide others
  document.getElementById("list-view")?.classList.add("hidden");
  document.getElementById("details-view")?.classList.add("hidden");
  document.getElementById("edit-view")?.classList.remove("hidden");

  if (typeof setActiveSection === 'function') {
    setActiveSection("files");
  }
  document
    .getElementById("update-btn")
    ?.addEventListener("click", updateConsultationRecord);
  document.getElementById("cancel-edit-btn")?.addEventListener("click", () => {
    showConsultationDetails(currentRecordIndex);
  });
  document
    .getElementById("delete-btn")
    ?.addEventListener("click", deleteConsultationRecord); 
}

//update consultation record from edit form 
async function updateConsultationRecord() {
  if (currentRecordIndex === null) return;

  const record = consultationRecords[currentRecordIndex];

  // Update record with values from edit form
  record.studentId = document.getElementById("edit-studentId").value;
  record.firstName = document.getElementById("edit-firstName").value;
  record.middleInitial = document.getElementById("edit-middleInitial").value;
  record.lastName = document.getElementById("edit-lastName").value;
  record.age = parseInt(document.getElementById("edit-age").value);
  record.gender = document.getElementById("edit-gender").value;
  record.gradeSection = document.getElementById("edit-gradeSection").value;
  record.dateOfBirth = document.getElementById("edit-dateOfBirth").value;
  record.address = document.getElementById("edit-address").value;
  record.parentGuardian = document.getElementById("edit-parentGuardian").value;
  record.contactNumber = document.getElementById("edit-contactNumber").value;
  record.dateOfVisit = document.getElementById("edit-dateOfVisit").value;
  record.timeOfVisit = document.getElementById("edit-timeOfVisit").value;
  record.reasonForVisit = document.getElementById("edit-reasonForVisit").value;
  record.temperature = document.getElementById("edit-temperature").value;
  record.pulseRate = document.getElementById("edit-pulseRate").value;
  record.bloodPressure = document.getElementById("edit-bloodPressure").value;
  record.respiratoryRate = document.getElementById(
    "edit-respiratoryRate"
  ).value;
  record.assessment = document.getElementById("edit-assessment").value;
  record.diagnosis = document.getElementById("edit-diagnosis").value;
  record.actionsTaken.restedInClinic = document.getElementById(
    "edit-restedInClinic"
  ).checked;
  record.actionsTaken.givenFirstAid =
    document.getElementById("edit-givenFirstAid").checked;
  record.actionsTaken.administeredMedication = document.getElementById(
    "edit-administeredMedication"
  ).checked;
  record.actionsTaken.medicationDetails = document.getElementById(
    "edit-medicationDetails"
  ).value;
  record.actionsTaken.sentHome =
    document.getElementById("edit-sentHome").checked;
  record.actionsTaken.referred =
    document.getElementById("edit-referred").checked;
  record.actionsTaken.referredTo =
    document.getElementById("edit-referredTo").value;
  record.actionsTaken.others = document.getElementById("edit-others").checked;
  record.actionsTaken.othersDetails =
    document.getElementById("edit-othersDetails").value;
  record.recommendations = document.getElementById(
    "edit-recommendations"
  ).value;
  record.nurseName = document.getElementById("edit-nurseName").value;
  record.nurseSignature = document.getElementById("edit-nurseSignature").value;
  record.nurseDate = document.getElementById("edit-nurseDate").value;

  // Prepare data to send to backend
  const updatedData = {
    studentId: record.studentId,
    firstName: record.firstName,
    middleInitial: record.middleInitial,
    lastName: record.lastName,
    age: record.age,
    gender: record.gender,
    gradeSection: record.gradeSection,
    dateOfBirth: record.dateOfBirth,
    address: record.address,
    parentGuardian: record.parentGuardian,
    contactNumber: record.contactNumber,
    concern: record.reasonForVisit,
    nurse: record.nurseName + " " + record.nurseDate,
    dateTime: record.dateOfVisit + "T" + record.timeOfVisit,
    status: record.status || "Pending",
    temperature: record.temperature,
    pulseRate: record.pulseRate,
    bloodPressure: record.bloodPressure,
    respiratoryRate: record.respiratoryRate,
    assessment: record.assessment,
    diagnosis: record.diagnosis,
    actionsTaken: record.actionsTaken,
    recommendations: record.recommendations,
    nurseName: record.nurseName,
    nurseSignature: record.nurseSignature,
    nurseDate: record.nurseDate,
  };

  try {
    const recordId = record._id || record.id;
    const response = await fetch(`http://localhost:8000/consultations/${recordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = errorData.detail;
      if (typeof errorMessage === "object") {
        errorMessage = JSON.stringify(errorMessage);
      }
      console.error("Failed to update consultation: " + errorMessage); 
      return;
    }

    console.log("Consultation record updated successfully."); 
    await loadConsultationRecords();
    showConsultationDetails(currentRecordIndex);
  } catch (error) {
    console.error("Error updating consultation record: " + error.message);
  }
}

document.getElementById("back-btn")?.addEventListener("click", () => {
  showListView();
});

document.getElementById("preview-btn")?.addEventListener("click", () => {
  showViewFormModal();
});

document.getElementById("edit-btn")?.addEventListener("click", () => {
  showEditView();
});

//view modal 
function showViewFormModal() {
  if (currentRecordIndex === null) return;
  const record = consultationRecords[currentRecordIndex];

  const viewFormContent = document.getElementById("view-form-content");
  if (!viewFormContent) {
    console.error("View form content 'view-form-content' not found.");
    return;
  }
  viewFormContent.innerHTML = `
    <div class="form-section">
      <h6 class="form-section-title">I. STUDENT INFORMATION</h6>
      <div class="form-grid">
        <div class="form-group"><label>Student_Id:</label> <p>${
          record.studentId || ''
        }</p></div>
        <div class="form-group"><label>First Name:</label> <p>${
          record.firstName || ''
        }</p></div>
        <div class="form-group"><label>M.I.:</label> <p>${
          record.middleInitial || ''
        }</p></div>
        <div class="form-group"><label>Last Name:</label> <p>${
          record.lastName || ''
        }</p></div>
        <div class="form-group"><label>Age:</label> <p>${record.age || ''}</p></div>
        <div class="form-group"><label>Gender:</label> <p>${
          record.gender || ''
        }</p></div>
        <div class="form-group"><label>Grade & Section:</label> <p>${
          record.gradeSection || ''
        }</p></div>
        <div class="form-group"><label>Date of Birth:</label> <p>${
          record.dateOfBirth || ''
        }</p></div>
        <div class="form-group"><label>Address:</label> <p>${
          record.address || ''
        }</p></div>
        <div class="form-group"><label>Parent/Guardian:</label> <p>${
          record.parentGuardian || ''
        }</p></div>
        <div class="form-group"><label>Contact Number:</label> <p>${
          record.contactNumber || ''
        }</p></div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">II. VISIT DETAILS</h6>
      <div class="form-grid">
        <div class="form-group"><label>Date of Visit:</label> <p>${
          record.dateOfVisit || ''
        }</p></div>
        <div class="form-group"><label>Time:</label> <p>${
          record.timeOfVisit || ''
        }</p></div>
        <div class="form-group full-width"><label>Reason for Visit / Complaint:</label> <p>${
          record.reasonForVisit || ''
        }</p></div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">III. VITAL SIGNS</h6>
      <div class="form-grid">
        <div class="form-group"><label>Temperature (°C):</label> <p>${
          record.temperature || ''
        }</p></div>
        <div class="form-group"><label>Pulse Rate (bpm):</label> <p>${
          record.pulseRate || ''
        }</p></div>
        <div class="form-group"><label>Blood Pressure (mmHg):</label> <p>${
          record.bloodPressure || ''
        }</p></div>
        <div class="form-group"><label>Respiratory Rate (bpm):</label> <p>${
          record.respiratoryRate || ''
        }</p></div>
      </div>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">IV. ASSESSMENT / OBSERVATION</h6>
      <p>${record.assessment || ''}</p>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">V. DIAGNOSIS / IMPRESSION</h6>
      <p>${record.diagnosis || ''}</p>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VI. ACTION TAKEN</h6>
      <ul>
        <li>Rested in clinic: ${
          record.actionsTaken?.restedInClinic ? "Yes" : "No"
        }</li>
        <li>Given first aid: ${
          record.actionsTaken?.givenFirstAid ? "Yes" : "No"
        }</li>
        <li>Administered medication: ${
          record.actionsTaken?.administeredMedication ? "Yes" : "No"
        }</li>
        <li>Medication details: ${record.actionsTaken?.medicationDetails || ''}</li>
        <li>Sent home: ${record.actionsTaken?.sentHome ? "Yes" : "No"}</li>
        <li>Referred: ${record.actionsTaken?.referred ? "Yes" : "No"}</li>
        <li>Referred to: ${record.actionsTaken?.referredTo || ''}</li>
        <li>Others: ${record.actionsTaken?.others ? "Yes" : "No"}</li>
        <li>Others details: ${record.actionsTaken?.othersDetails || ''}</li>
      </ul>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VII. RECOMMENDATIONS / REMARKS</h6>
      <p>${record.recommendations || ''}</p>
    </div>
    <div class="form-section">
      <h6 class="form-section-title">VIII. ATTENDING NURSE / SCHOOL HEALTH PERSONNEL</h6>
      <p>Name: ${record.nurseName || ''}</p>
      <p>Signature: ${record.nurseSignature || ''}</p>
      <p>Date: ${record.nurseDate || ''}</p>
    </div>
  `;

  // Show the modal
  const modal = document.getElementById("view-form-modal");
  modal?.classList.remove("hidden");

  //close button
  document
    .getElementById("view-form-close-btn")
    ?.addEventListener("click", () => {
      modal?.classList.add("hidden");
    });
}

// Export to Word function
function exportToWord() {
  if (currentRecordIndex === null) return;
  const record = consultationRecords[currentRecordIndex];

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Consultation Record</title>
      <style>
        body {
          font-family: 'Helvetica Neue', sans-serif;
          padding: 40px;
          color: #1f1f1f;
          background-color: #fff;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          padding-bottom: 15px;
          margin-bottom: 40px;
          border-bottom: 2px solid #0057A0;
        }
        .header h1 {
          font-size: 28px;
          margin: 0;
          color: #0057A0;
          letter-spacing: 1px;
        }
        h2, h3 {
          color: #333;
          font-size: 20px;
          margin-top: 40px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        .section {
          padding: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #fafafa;
          margin-bottom: 30px;
        }
        p {
          margin: 8px 0;
          font-size: 14px;
        }
        ul {
          margin-top: 12px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 6px;
          font-size: 14px;
        }
        .label {
          font-weight: 600;
          color: #444;
        }
        .footer {
          text-align: center;
          margin-top: 60px;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Consultation Record</h1>
      </div>

      <div class="section">
        <h2>Student Information</h2>
        <p><span class="label">Student_id:</span> ${record.studentId || ''}</p>
        <p><span class="label">First Name:</span> ${record.firstName || ''}</p>
        <p><span class="label">Middle Initial:</span> ${
          record.middleInitial || ''
        }</p>
        <p><span class="label">Last Name:</span> ${record.lastName || ''}</p>
        <p><span class="label">Age:</span> ${record.age || ''}</p>
        <p><span class="label">Gender:</span> ${record.gender || ''}</p>
        <p><span class="label">Grade & Section:</span> ${
          record.gradeSection || ''
        }</p>
        <p><span class="label">Date of Birth:</span> ${record.dateOfBirth || ''}</p>
        <p><span class="label">Address:</span> ${record.address || ''}</p>
        <p><span class="label">Parent/Guardian:</span> ${
          record.parentGuardian || ''
        }</p>
        <p><span class="label">Contact Number:</span> ${
          record.contactNumber || ''
        }</p>
      </div>

      <div class="section">
        <h2>Visit Information</h2>
        <p><span class="label">Date of Visit:</span> ${record.dateOfVisit || ''}</p>
        <p><span class="label">Time of Visit:</span> ${record.timeOfVisit || ''}</p>
        <p><span class="label">Reason for Visit:</span> ${
          record.reasonForVisit || ''
        }</p>
        <p><span class="label">Temperature:</span> ${record.temperature || ''}</p>
        <p><span class="label">Pulse Rate:</span> ${record.pulseRate || ''}</p>
        <p><span class="label">Blood Pressure:</span> ${
          record.bloodPressure || ''
        }</p>
        <p><span class="label">Respiratory Rate:</span> ${
          record.respiratoryRate || ''
        }</p>
        <p><span class="label">Assessment:</span> ${record.assessment || ''}</p>
        <p><span class="label">Diagnosis:</span> ${record.diagnosis || ''}</p>
      </div>

      <div class="section">
        <h3>Actions Taken</h3>
        <ul>
          <li><span class="label">Rested in clinic:</span> ${
            record.actionsTaken?.restedInClinic ? "Yes" : "No"
          }</li>
          <li><span class="label">Given first aid:</span> ${
            record.actionsTaken?.givenFirstAid ? "Yes" : "No"
          }</li>
          <li><span class="label">Administered medication:</span> ${
            record.actionsTaken?.administeredMedication ? "Yes" : "No"
          }</li>
          <li><span class="label">Medication details:</span> ${
            record.actionsTaken?.medicationDetails || ''
          }</li>
          <li><span class="label">Sent home:</span> ${
            record.actionsTaken?.sentHome ? "Yes" : "No"
          }</li>
          <li><span class="label">Referred:</span> ${
            record.actionsTaken?.referred ? "Yes" : "No"
          }</li>
          <li><span class="label">Referred to:</span> ${
            record.actionsTaken?.referredTo || ''
          }</li>
          <li><span class="label">Others:</span> ${
            record.actionsTaken?.others ? "Yes" : "No"
          }</li>
          <li><span class="label">Others details:</span> ${
            record.actionsTaken?.othersDetails || ''
          }</li>
        </ul>
        <p><span class="label">Recommendations:</span> ${
          record.recommendations || ''
        }</p>
      </div>

      <div class="section">
        <h3>Attending Nurse / School Health Personnel</h3>
        <p><span class="label">Name:</span> ${record.nurseName || ''}</p>
        <p><span class="label">Signature:</span> ${record.nurseSignature || ''}</p>
        <p><span class="label">Date:</span> ${record.nurseDate || ''}</p>
      </div>

      <div class="footer">
        <p>Generated by the Health Monitoring System – ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", content], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Consultation_Record_${record.firstName}_${record.lastName}.doc`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

//Export to Word button
document.getElementById("export-btn")?.addEventListener("click", exportToWord);
loadConsultationRecords();

// Appointment
let appointments = [];
let acceptedRecords = [];

function filterAppointments() {
  const nameInput = document.getElementById("searchName").value.toLowerCase();
  const selectedStatus = document.getElementById("filterStatus").value;
  const selectedNurse = document.getElementById("filterNurse").value;

  const filtered = appointments.filter((apt) => {
    const fullName = (apt.firstName + " " + apt.lastName).toLowerCase();
    const matchesName = fullName.includes(nameInput);
    const matchesStatus = selectedStatus ? apt.status === selectedStatus : true;
    const matchesNurse = selectedNurse ? apt.nurse === selectedNurse : true;

    return matchesName && matchesStatus && matchesNurse;
  });

  renderFilteredTable(filtered);
}

function filterRecords() {
  const searchText = document.getElementById("searchRecord").value.toLowerCase();
  const sortOption = document.getElementById("sortRecordDate").value;

  let filtered = acceptedRecords.filter((rec) => {
    const fullName = (rec.firstName + " " + rec.lastName).toLowerCase();
    return fullName.includes(searchText);
  });
  renderRecordTable(filtered);
}



async function loadAppointments() {
  try {
    const response = await fetch("http://localhost:8000/appointments");
    const allAppointments = await response.json();

    appointments = allAppointments.filter(a => a.status !== "Accepted");
    renderTable();
  } catch (error) {
    console.error("Error loading appointments:", error);
    appointments = [];
    renderTable();
  }
}

function renderTable() {
  renderFilteredTable(appointments);
}

function renderFilteredTable(appointmentList) {
  const tbody = document.getElementById("appointmentTable");
  const countEl = document.getElementById("appointmentCount");
  countEl.textContent = `${appointmentList.length}`;

  if (appointmentList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #999;">No appointments found</td></tr>`;
    return;
  }

  tbody.innerHTML = appointmentList
    .map(
      (apt) => `
      <tr>
        <td>${apt.firstName} ${apt.lastName}</td>
        <td>${apt.concern}</td>
        <td>${apt.dateTime}</td>
        <td>${apt.nurse}</td>
        <td><a href="mailto:${apt.email}">${apt.email}</a></td>
        <td>
          <button onclick="acceptAppointment('${apt.id}')"style="background-color:green;color:white; padding: 7px 10px; border-radius:4px; border:none;">Accept</button>
          <button onclick="deleteAppointment('${apt.id}')"style="background-color:red;color:white; padding: 7px 10px; border-radius:4px; border:none;">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

async function acceptAppointment(id) {
  try {
    const acceptedAppointment = appointments.find((apt) => apt.id === id);
    if (!acceptedAppointment) return;

    // Save to records
    await fetch("http://localhost:8000/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(acceptedAppointment),
    });

    // Mark as accepted in MongoDB (do not delete)
    await fetch(`http://localhost:8000/appointments/${id}/accept`, {
      method: "PATCH",
    });

    // Reload appointments
    await loadAppointments();
    await loadRecords();

    alert("Appointment accepted and saved to records.");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function deleteAppointment(id) {
  if (!confirm("Delete appointment?")) return;

  try {
    const response = await fetch(`http://localhost:8000/appointments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert("Delete failed: " + errorData.detail);
      return;
    }

    appointments = appointments.filter((apt) => apt.id !== id);
    renderTable();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function loadRecords() {
  try {
    const response = await fetch("http://localhost:8000/records");
    acceptedRecords = await response.json();
    filterRecords();
  } catch (error) {
    console.error("Error loading records:", error);
    acceptedRecords = [];
    filterRecords();
  }
}

function filterRecords() {
  const searchText = document.getElementById("searchRecord").value.toLowerCase();
  const sortOption = document.getElementById("sortRecordDate").value;

  let filtered = acceptedRecords.filter((rec) => {
    const fullName = (rec.firstName + " " + rec.lastName).toLowerCase();
    return fullName.includes(searchText);
  });

  if (sortOption === "latest") {
    filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  } else {
    filtered.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }

  renderRecordTable(filtered);
}

function renderRecordTable(records) {
  const tbody = document.getElementById("recordTable");
  tbody.innerHTML = "";

  const countEl = document.getElementById("recordsCount");
  countEl.textContent = records.length;

  if (records.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" style="text-align:center; color: #888;">No records found</td>`;
    tbody.appendChild(row);
    return;
  }

  records.forEach((rec) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${rec.firstName} ${rec.lastName}</td>
      <td>${rec.concern}</td>
      <td>${rec.dateTime}</td>
      <td>${rec.nurse}</td>
      <td><a href="mailto:${rec.email}">${rec.email}</a></td>
    `;
    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAppointments();
  loadRecords();
});


function handleLogout() {
  console.log("Logging out...");
  window.location.href = "../components/login.html";
}


// ============= ADMIN.JS FILE =============

function hideProfileSection() {
  const profileSection = document.getElementById('profile-section');
  const profileMenuItem = document.querySelector('[data-section="profile"]');
  
  if (profileSection) {
      profileSection.style.display = 'none';
  }
  
  if (profileMenuItem) {
      profileMenuItem.style.display = 'none';
  }
}

function removeProfileSection() {
  const profileSection = document.getElementById('profile-section');
  const profileMenuItem = document.querySelector('[data-section="profile"]');
  
  if (profileSection) {
      profileSection.remove();
  }
  
  if (profileMenuItem) {
      profileMenuItem.remove();
  }
}

function addHideClass() {
  const profileSection = document.getElementById('profile-section');
  const profileMenuItem = document.querySelector('[data-section="profile"]');
  
  if (profileSection) {
      profileSection.classList.add('hidden-for-staff');
  }
  
  if (profileMenuItem) {
      profileMenuItem.classList.add('hidden-for-staff');
  }
}

function hideProfileForStaff() {
  const isStaff = window.location.search.includes('userType=staff') || 
                 localStorage.getItem('userType') === 'staff' ||
                 window.location.pathname.includes('staff');
  
  if (isStaff) {
      hideProfileSection();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  hideProfileForStaff();
  
  const profileMenuItem = document.querySelector('[data-section="profile"]');
  
  if (profileMenuItem) {
      profileMenuItem.addEventListener('click', function(e) {
          const isStaff = window.location.search.includes('userType=staff') || 
                         localStorage.getItem('userType') === 'staff';
          
          if (isStaff) {
              e.preventDefault();
              e.stopPropagation();
              return false;
          }
      });
  }
});
