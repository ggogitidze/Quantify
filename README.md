# 📊 Quantify – A Full-Stack Portfolio Tracker Web App

Quantify is a clean, responsive web application that allows users to securely track and manage their stock portfolio like a quant. It features live price fetching, CRUD portfolio management, watchlist creation, performance insights, user settings, and a sleek UI built with HTML, CSS, and JavaScript.

---

## 🎥 Demo

[![Watch the demo](https://img.shields.io/badge/▶-Watch%20Demo-lightgrey?logo=youtube)](https://youtu.be/yPZA1mF-0Gc)

> ⏱ Demo Duration: under 1 minute  
> Shows login, portfolio management, watchlist, profile, insights, and personal Settings

---

## 🧩 Features

- ✅ **User Authentication** (JWT + bcrypt)
- ✅ **Secure Portfolio Management**
  - Add / edit / delete stocks
  - Live price & PnL calculations
- ✅ **Watchlist** with real-time prices
- ✅ **Insights Page**
  - Allocation chart
  - Profit/loss visualization
- ✅ **User Profile Summary**
- ✅ **Settings**
- ✅ **Clean Dashboard** with real-time portfolio state

---

## 🛠 Tech Stack

| Layer         | Technology                        |
|---------------|------------------------------------|
| Front-End     | HTML, CSS (with media queries), JS |
| Back-End      | Node.js, Express.js                |
| Authentication| JWT, bcrypt                        |
| Database      | SQLite (can be swapped with PostgreSQL) |
| API           | Twelve Data API (for stock prices) |

---

## 🧪 How to Run Locally

1. **Clone this repository**

```bash
git clone https://github.com/YOUR_USERNAME/quantify-portfolio-tracker.git
cd quantify-portfolio-tracker
```

2. **Install Dependencies**
```bash
npm install
```

3. **Create a .env file**
```env
TWELVE_DATA_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
```
4. **Start the Server**
```bash
node server/server.js
```
