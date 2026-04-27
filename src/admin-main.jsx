import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminLoginPage from "./AdminLoginPage.jsx";
import "./admin-login.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminLoginPage />
  </StrictMode>,
);
