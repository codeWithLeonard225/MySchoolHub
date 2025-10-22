import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./Component/Admin/AdminPanel";
import LoginPage from "./Component/Admin/LoginPage";
import Gov from "./Component/Admin/Gov";
import FeesDashboard from "./Component/Dashboard/FeesDsahboard";
import { AuthProvider } from "./Component/Security/AuthContext";
import ProtectedRoute from "./Component/Security/ProtectedRoute";
import TeacherGradesPage from "./Component/TeacherAssignment/TeacherPupilsPage";
import PupilsDashboard from "./Component/PupilsPage/PupilsDashboard";
import FeesPanel from "./Component/Admin/FeesPanel";
import CeoPanel from "./Component/CeoPanel/CeoPanel";
import PrivatePupilsDashboard from "./Component/PupilsPage/PrivatePupilsDashboard";
import GovPupilDashboard from "./Component/PupilsPage/GovPupilDashboard";
import PupilUpdate from "./Component/TeacherAssignment/PupilUpdate";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/PrivatePupilsDashboard"
            element={
              <ProtectedRoute role="pupil">
                <PrivatePupilsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GovPupilDashboard"
            element={
              <ProtectedRoute role="pupil">
                <GovPupilDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registra"
            element={
              <ProtectedRoute role="admin">
                <FeesPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gov"
            element={
              <ProtectedRoute role="admin">
                <Gov/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class"
            element={
              <ProtectedRoute role="teacher">
                <PupilUpdate/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjectTeacher"
            element={
              <ProtectedRoute role="teacher">
                <TeacherGradesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo"
            element={
              <ProtectedRoute role="ceo">
                <CeoPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
