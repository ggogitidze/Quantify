fetch("components/navbar.html")
  .then(res => res.text())
  .then(html => {
    const navTarget = document.getElementById("navbar-placeholder");
    if (navTarget) navTarget.innerHTML = html;
  });


const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const errorDisplay = document.getElementById("register-error");
    const feedbackDisplay = document.getElementById("register-feedback");
    if (errorDisplay) errorDisplay.textContent = "";
    if (feedbackDisplay) feedbackDisplay.textContent = "";

    if (!username || !email || !password) {
      errorDisplay.textContent = "Please fill in all fields.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDisplay.textContent = "Please enter a valid email address.";
      return;
    }

    if (password.length < 6) {
      errorDisplay.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        registerForm.reset();
        feedbackDisplay.textContent = "Registration successful! Redirecting to login...";
        setTimeout(() => window.location.href = "login.html", 1500);
      } else {
        errorDisplay.textContent = `Error: ${data.error}`;
      }
    } catch (err) {
      console.error(err);
      errorDisplay.textContent = "Something went wrong.";
    }
  });
}



const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const errorDisplay = document.getElementById("login-error");
    const feedbackDisplay = document.getElementById("login-feedback");

    if (errorDisplay) errorDisplay.textContent = "";
    if (feedbackDisplay) feedbackDisplay.textContent = "";

    if (!email || !password) {
      errorDisplay.textContent = "Please enter both email and password.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDisplay.textContent = "Please enter a valid email address.";
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        feedbackDisplay.textContent = "Login successful! Redirecting...";
        localStorage.setItem("token", data.token);
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      } else {
        errorDisplay.textContent = `Error: ${data.error}`;
      }
    } catch (err) {
      errorDisplay.textContent = "Something went wrong.";
      console.error(err);
    }
  });
}



// Get token
const token = localStorage.getItem("token");

if (window.location.pathname.includes("dashboard.html") && !token) {
  alert("Please login first.");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Portfolio logic
const portfolioForm = document.getElementById("portfolioForm");
if (portfolioForm) {
  portfolioForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ticker = document.getElementById("ticker").value.trim().toUpperCase();
    const shares = parseFloat(document.getElementById("shares").value);
    const buy_price = parseFloat(document.getElementById("buyPrice").value);

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ticker, shares, buy_price })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Entry added!");
        portfolioForm.reset();
        fetchPortfolio();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  });

  fetchPortfolio();
}

async function fetchPortfolio() {
  try {
    const res = await fetch("/api/portfolio", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      const tbody = document.querySelector("#portfolioTable tbody");
      tbody.innerHTML = "";

      for (const entry of data) {
        const quoteRes = await fetch(`/api/quote/${entry.ticker}`);
        const quoteData = await quoteRes.json();

        const livePrice = quoteData.price || 0;
        const buyPrice = entry.buy_price ?? 0;
        const shares = entry.shares ?? 0;


        const pnl = ((livePrice - buyPrice) * shares).toFixed(2);
        const pnlPercent = buyPrice !== 0
            ? (((livePrice - buyPrice) / buyPrice) * 100).toFixed(2)
            : "0.00";
        const pnlColor = pnl >= 0 ? "green" : "red";

        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${entry.ticker}</td>
        <td>${entry.shares}</td>
        <td>$${entry.buy_price.toFixed(2)}</td>
        <td>$${livePrice.toFixed(2)}</td>
        <td style="color:${pnlColor};">$${pnl}</td>
        <td style="color:${pnlColor};">${pnlPercent}%</td>
        <td>
          <div class="action-buttons">
            <button onclick="editEntry(${entry.id}, ${entry.shares}, ${entry.buy_price})">Edit</button>
            <button onclick="deleteEntry(${entry.id})">Delete</button>
          </div>
        </td>
        `;

        tbody.appendChild(row);
      }

    } else {
      alert(`Error loading portfolio: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while loading portfolio.");
  }
}

async function deleteEntry(id) {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  try {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      alert("Entry deleted.");
      fetchPortfolio();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting entry.");
  }
}

async function editEntry(id, currentShares, currentBuyPrice) {
  const newShares = prompt("Enter new number of shares:", currentShares);
  const newBuyPrice = prompt("Enter new buy price:", currentBuyPrice);

  if (!newShares || !newBuyPrice) return;

  try {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        shares: parseFloat(newShares),
        buy_price: parseFloat(newBuyPrice)
      })
    });

    if (res.ok) {
      alert("Entry updated.");
      fetchPortfolio();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error updating entry.");
  }
}
