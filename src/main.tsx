import "boxicons/css/boxicons.min.css";
import "./styles/index.css";

import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
