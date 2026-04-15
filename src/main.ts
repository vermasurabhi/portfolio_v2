import "./styles/tailwind.css";
import "./styles/global-typography.css";
import "./components/hero/hero.css";
import "./components/showcase-slider/showcase-slider.css";
import { renderHomePage } from "./pages/home";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

renderHomePage(app);
