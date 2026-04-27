import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminSettingsPage from "./AdminSettingsPage.jsx";
import "./admin-settings.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminSettingsPage />
  </StrictMode>,
);
