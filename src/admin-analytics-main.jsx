import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminAnalyticsPage from "./AdminAnalyticsPage.jsx";
import "./admin-analytics.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminAnalyticsPage />
  </StrictMode>,
);
