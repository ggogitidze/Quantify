document.addEventListener("DOMContentLoaded", async () => {
  
  const res = await fetch("components/navbar.html");
  const html = await res.text();
  const navTarget = document.getElementById("navbar-placeholder");
  if (navTarget) navTarget.innerHTML = html;

  
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in.");
    window.location.href = "login.html";
    return;
  }

  // Password update
  const passwordForm = document.getElementById("passwordForm");
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    try {
      const res = await fetch("/api/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password updated.");
        passwordForm.reset();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update password.");
    }
  });
});


document.getElementById("passwordForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  try {
    const res = await fetch("/api/update-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password updated.");
      document.getElementById("passwordForm").reset();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to update password.");
  }
});
