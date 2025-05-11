const token = localStorage.getItem("token");

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const navTarget = document.getElementById("navbar-placeholder");
  if (navTarget) {
    try {
      const navRes = await fetch("components/navbar.html");
      const navHTML = await navRes.text();
      navTarget.innerHTML = navHTML;
      
    } catch (err) {
      console.error("Navbar failed to load:", err);
    }
  }
});
