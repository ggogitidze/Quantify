fetch("components/navbar.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("navbar-placeholder").innerHTML = html;
  });


if (!token) {
  alert("Please log in.");
  window.location.href = "login.html";
}

const form = document.getElementById("watchlistForm");
const tableBody = document.querySelector("#watchlistTable tbody");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ticker = document.getElementById("ticker").value.toUpperCase();

  try {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ ticker })
    });

    if (res.ok) {
      await renderWatchlist();
      form.reset();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to add ticker.");
  }
});

async function renderWatchlist() {
  try {
    const res = await fetch("/api/watchlist", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const tickers = await res.json();
    tableBody.innerHTML = "";

    for (const ticker of tickers) {
      const quoteRes = await fetch(`/api/quote/${ticker}`);
      const quote = await quoteRes.json();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ticker}</td>
        <td>$${(quote.price || 0).toFixed(2)}</td>
        <td><button onclick="removeFromWatchlist('${ticker}')">Remove</button></td>
      `;
      tableBody.appendChild(row);
    }
  } catch (err) {
    console.error(err);
    alert("Error loading watchlist.");
  }
}

async function removeFromWatchlist(ticker) {
  try {
    const res = await fetch(`/api/watchlist/${ticker}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      await renderWatchlist();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to remove ticker.");
  }
}


renderWatchlist();
