
document.addEventListener("DOMContentLoaded", () => {
  fetch("components/navbar.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("navbar-placeholder").innerHTML = html;
    });

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in.");
    window.location.href = "login.html";
    return;
  }

  const user = parseJwt(token);
  if (user && user.email) {
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("profile-img").src = `uploads/${user.id}.png?${Date.now()}`;
  }

  loadPortfolioStats(token);

});

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

async function loadPortfolioStats(token) {
  try {
    const res = await fetch("/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    let total = 0;
    let maxPnL = -Infinity;
    let minPnL = Infinity;
    let bestStock = "";
    let worstStock = "";

    const performanceMap = [];

    for (const entry of data) {
      const quoteRes = await fetch(`/api/quote/${entry.ticker}`);
      const quote = await quoteRes.json();
      const price = quote.price || 0;

      const value = entry.shares * price;
      const pnl = (price - entry.buy_price) * entry.shares;

      total += value;

      performanceMap.push({ ticker: entry.ticker, value });

      if (pnl > maxPnL) {
        maxPnL = pnl;
        bestStock = entry.ticker;
      }

      if (pnl < minPnL) {
        minPnL = pnl;
        worstStock = entry.ticker;
      }
    }

    // get top 3 holdings
    performanceMap.sort((a, b) => b.value - a.value);
    const topHoldings = performanceMap.slice(0, 3).map(stock => `<li>${stock.ticker}</li>`).join("");
    document.getElementById("top-holdings").innerHTML = topHoldings;

    document.getElementById("portfolio-value").textContent = total.toFixed(2);
    document.getElementById("entry-count").textContent = data.length;
    document.getElementById("best-stock").textContent = bestStock || "N/A";
    document.getElementById("worst-stock").textContent = worstStock || "N/A";

  } catch (err) {
    console.error("Failed to load portfolio stats:", err);
    alert("Something went wrong loading portfolio stats.");
  }
}

