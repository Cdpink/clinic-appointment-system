let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let appointments = [];

function saveAppointments() {
  localStorage.setItem("appointments", JSON.stringify(appointments));
  console.log("Appointments saved to localStorage:", appointments);
}

function checkAppointmentConflict(nurse, dateTime) {
  return appointments.some(
    (apt) =>
      apt.nurse === nurse &&
      apt.dateTime === dateTime &&
      apt.status !== "Rejected"
  );
}

function updateAvailableTimeSlots() {
  const selectedNurse = document.getElementById("nurse").value;
  const timeSlots = document.querySelectorAll(".time-slot");

  if (!selectedNurse || !selectedDate) {
    timeSlots.forEach((slot) => {
      slot.classList.remove("unavailable");
      slot.style.pointerEvents = "auto";
      slot.style.opacity = "1";
    });
    return;
  }

  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  timeSlots.forEach((slot) => {
    const time = slot.dataset.time;
    const dateTimeStr = `${selectedDateStr}_${time}`;

    if (checkAppointmentConflict(selectedNurse, dateTimeStr)) {
      slot.classList.add("unavailable");
      slot.style.pointerEvents = "none";
      slot.style.opacity = "0.5";
      slot.style.backgroundColor = "#ffcccc";
      slot.title = "This time slot is already booked";
    } else {
      slot.classList.remove("unavailable");
      slot.style.pointerEvents = "auto";
      slot.style.opacity = "1";
      slot.style.backgroundColor = "";
      slot.title = "";
    }
  });
}

function initCalendar() {
  updateCalendar();
  setupEventListeners();
}

function updateCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  document.getElementById("monthYear").textContent = `${monthNames[month]} ${year}`;

  const calendarGrid = document.getElementById("calendarGrid");
  const dayHeaders = calendarGrid.querySelectorAll(".day-header");
  calendarGrid.innerHTML = "";
  dayHeaders.forEach((header) => calendarGrid.appendChild(header));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarGrid.appendChild(createDayCell(daysInPrevMonth - i, true));
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = createDayCell(day, false);
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      dayCell.classList.add("today");
    }
    calendarGrid.appendChild(dayCell);
  }

  const totalCells = calendarGrid.children.length - 7;
  const remainingCells = 42 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    calendarGrid.appendChild(createDayCell(day, true));
  }
}

function createDayCell(day, isOtherMonth) {
  const dayCell = document.createElement("div");
  dayCell.className = "day-cell";
  dayCell.textContent = day;

  if (isOtherMonth) {
    dayCell.classList.add("other-month");
  } else {
    const cellDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (cellDate < today) {
      dayCell.classList.add("past-date");
      dayCell.style.opacity = "0.3";
      dayCell.style.pointerEvents = "none";
    } else {
      dayCell.addEventListener("click", () => selectDate(day, dayCell));
    }
  }

  return dayCell;
}

function selectDate(day, dayCell) {
  document.querySelectorAll(".day-cell.selected").forEach((cell) => {
    cell.classList.remove("selected");
  });

  dayCell.classList.add("selected");
  selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  selectedTime = null;

  document.querySelectorAll(".time-slot.selected").forEach((slot) => {
    slot.classList.remove("selected");
  });

  updateDateTime();
  updateAvailableTimeSlots();
}

function updateDateTime() {
  if (selectedDate && selectedTime) {
    const dateStr = selectedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const optionValue = `${selectedDate.toISOString().split("T")[0]}_${selectedTime}`;
    const option = new Option(`${dateStr} at ${selectedTime}`, optionValue);

    const dateTimeSelect = document.getElementById("dateTime");
    dateTimeSelect.innerHTML = '<option value="">Choose Date and Time</option>';
    dateTimeSelect.appendChild(option);
    dateTimeSelect.value = option.value;
  }
}

function setupEventListeners() {
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });

  document.getElementById("nurse").addEventListener("change", () => {
    updateAvailableTimeSlots();
  });

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      if (slot.classList.contains("unavailable")) return;

      document.querySelectorAll(".time-slot.selected").forEach((s) => {
        s.classList.remove("selected");
      });

      slot.classList.add("selected");
      selectedTime = slot.dataset.time;
      updateDateTime();
    });
  });

  document.getElementById("appointmentForm").addEventListener("submit", handleSubmit);
  document.getElementById("cancelBtn").addEventListener("click", resetForm);
}

async function handleSubmit(e) {
  e.preventDefault();

  const formData = {
    studentId: document.getElementById("studentId").value,
    lastName: document.getElementById("lastName").value,
    firstName: document.getElementById("firstName").value,
    email: document.getElementById("email").value,
    concern: document.getElementById("concern").value,
    nurse: document.getElementById("nurse").value,
    dateTime: document.getElementById("dateTime").value,
    status: "Pending",
  };

  if (Object.values(formData).some((value) => !value)) {
    alert("Please fill in all fields and select a date and time.");
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert("Failed to create appointment: " + errorData.detail);
      return;
    }

    // ✅ Fetch updated appointments from backend
    const fetchRes = await fetch("http://localhost:8000/appointments");
    if (fetchRes.ok) {
      appointments = await fetchRes.json();
      saveAppointments();
    }

    document.getElementById("successMessage").style.display = "block";

    setTimeout(() => {
      resetForm();
      document.getElementById("successMessage").style.display = "none";
    }, 2000);
  } catch (error) {
    alert("Error creating appointment: " + error.message);
  }
}

function resetForm() {
  document.getElementById("appointmentForm").reset();
  document.querySelectorAll(".day-cell.selected, .time-slot.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  selectedDate = null;
  selectedTime = null;

  document.getElementById("dateTime").innerHTML =
    '<option value="">Choose Date and Time</option>';

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("unavailable");
    slot.style.pointerEvents = "auto";
    slot.style.opacity = "1";
    slot.style.backgroundColor = "";
    slot.title = "";
  });
}

async function fetchAppointments() {
  try {
    const response = await fetch("http://localhost:8000/appointments");
    if (response.ok) {
      appointments = await response.json();
      saveAppointments();
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page loaded");
  await fetchAppointments();
  initCalendar();
});
