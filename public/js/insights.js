// Load navbar
fetch("components/navbar.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("navbar-placeholder").innerHTML = html;
  });

const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in.");
  window.location.href = "login.html";
}

// render charts
async function loadInsights() {
  try {
    const res = await fetch("/api/portfolio", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    const labels = [];
    const values = [];
    const pnls = [];

    for (const entry of data) {
      const quoteRes = await fetch(`/api/quote/${entry.ticker}`);
      const quote = await quoteRes.json();
      const livePrice = quote.price || 0;
      const value = entry.shares * livePrice;
      const pnl = (livePrice - entry.buy_price) * entry.shares;

      labels.push(entry.ticker);
      values.push(value.toFixed(2));
      pnls.push(pnl.toFixed(2));
    }

    renderAllocationChart(labels, values);
    renderPnLChart(labels, pnls);
  } catch (err) {
    console.error(err);
    alert("Failed to load insights.");
  }
}

function renderAllocationChart(labels, values) {
  new Chart(document.getElementById("allocationChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Allocation ($)",
        data: values,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Portfolio Allocation"
        }
      }
    }
  });
}

function renderPnLChart(labels, pnls) {
  new Chart(document.getElementById("pnlChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Unrealized PnL ($)",
        data: pnls,
        backgroundColor: pnls.map(p => p >= 0 ? "rgba(0, 128, 0, 0.6)" : "rgba(255, 0, 0, 0.6)")
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Unrealized Profit and Loss"
        }
      }
    }
  });
}

loadInsights();
