import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/Login";
import Organizations from "../pages/Organizations";
import Overview from "../pages/Overview";
import Projects from "../pages/Projects";
import PlaceholderPage from "../pages/PlaceholderPage";
import Register from "../pages/Register";
import ProtectedRoute from "./ProtectedRoute";

// Public auth routes stay exactly as they were. Every authenticated
// path renders inside DashboardLayout; the Overview page is real,
// sections that are not built yet show an honest placeholder.
const PLACEHOLDERS = [
  { path: "api-keys", title: "API Keys", description: "Scoped credentials for your projects." },
  { path: "database", title: "Database", description: "Managed collections and documents." },
  { path: "files", title: "File Storage", description: "Uploaded files and their metadata." },
  { path: "logs", title: "Logs", description: "Request and service events." },
  { path: "jobs", title: "Jobs", description: "Background work and its status." },
  { path: "realtime", title: "Realtime", description: "Live events over WebSockets." },
  { path: "settings", title: "Settings", description: "Workspace and account preferences." },
  { path: "profile", title: "Profile", description: "Your account details." },
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Overview />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="projects" element={<Projects />} />
        {PLACEHOLDERS.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              <PlaceholderPage
                title={page.title}
                description={page.description}
              />
            }
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
