import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminPackagePage from "./AdminPackagePage.jsx";
import "./admin-package.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminPackagePage />
  </StrictMode>,
);
