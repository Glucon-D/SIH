import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useTheme } from "../../context/ThemeContext";
import { useLocation } from "react-router-dom";

const Layout = () => {
  const { effectiveTheme } = useTheme();
  const route = useLocation();

  return (
    <div
      className={` flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 ${
        effectiveTheme === "dark" ? "dark" : ""
      } ${route.pathname === "/dashboard" ? "h-screen" : "min-h-screen"}`}
    >
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
