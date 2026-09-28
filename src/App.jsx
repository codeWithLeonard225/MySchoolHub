import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPanel from "./Component/Admin/AdminPanel";
import LoginPage from "./Component/Admin/LoginPage";
import Gov from "./Component/Admin/Gov";
import GovJunior from "./Component/Admin/GovJunior";
import FeesDashboard from "./Component/Dashboard/FeesDsahboard";
import { AuthProvider } from "./Component/Security/AuthContext";
import ProtectedRoute from "./Component/Security/ProtectedRoute";
import TeacherGradesPage from "./Component/TeacherAssignment/TeacherPupilsPage";

import FeesPanel from "./Component/Admin/FeesPanel";
import CeoPanel from "./Component/CeoPanel/CeoPanel";
import PrivatePupilsDashboard from "./Component/PupilsPage/PrivatePupilsDashboard";
import GovPupilDashboard from "./Component/PupilsPage/GovPupilDashboard";
import PupilUpdate from "./Component/TeacherAssignment/PupilUpdate";
import PrintableStudentForm from "./Component/Voters/PrintableStudentForm";
import TeachersDashboard from "./Component/TeacherAssignment/TeachersDashboard";
import AttendancePage from "./Component/Voters/AttendancePage";
import ClassMasterDashboard from "./Component/TeacherAssignment/ClassMasterDashboard";
import StaffAttendanceSimple from "./Component/TeacherAssignment/StaffAttendance";
import StaffAttDashboard from "./Component/Dashboard/StaffAttDashboard";
import SupervisorOneDashboard from "./Component/Dashboard/SupervisorOneDashboard";
import SupervisorThreeDashboard from "./Component/Dashboard/SupervisorThreeDashboard";
import SupervisorTwoDashboard from "./Component/Dashboard/SupervisorTwoDashboard";
import SupervisorJssOneDashboard from "./Component/Dashboard/SupervisorJssOneDashboard";
import SupervisorJssTwoDashboard from "./Component/Dashboard/SupervisorJssTwoDashboard";
import SupervisorJssThreeDashboard from "./Component/Dashboard/SupervisorJssThreeDashboard";
import StaffAttendanceJss from "./Component/Dashboard/StaffAttendanceJss";
import GMSSprefert1 from "./Component/Dashboard/GMSSprefert1";
import GMSSprefert2 from "./Component/Dashboard/GMSSprefert2";
import GMSSprefert3 from "./Component/Dashboard/GMSSprefert3";
import GMSSprefert4 from "./Component/Dashboard/GMSSprefert4";
import GMSSprefert5 from "./Component/Dashboard/GMSSprefert5";
import GMSSextra from "./Component/Dashboard/GMSSextra";




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
            path="/GovJunior"
            element={
              <ProtectedRoute role="admin">
                <GovJunior/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/PupilAttendance"
            element={
              <ProtectedRoute role="admin">
                <AttendancePage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/StaffAttDashboard"
            element={
              <ProtectedRoute role="admin">
                <StaffAttDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorTwoDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorTwoDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorOneDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorOneDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorThreeDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorThreeDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorJssOneDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorJssOneDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorJssTwoDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorJssTwoDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/SupervisorJssThreeDashboard"
            element={
              <ProtectedRoute role="admin">
                <SupervisorJssThreeDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/StaffAttendanceJss"
            element={
              <ProtectedRoute role="admin">
                <StaffAttendanceJss/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/class"
            element={
              <ProtectedRoute role="teacher">
                <ClassMasterDashboard/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjectTeacher"
            element={
              <ProtectedRoute role="teacher">
                <TeachersDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/special"
            element={
              <ProtectedRoute role="admin">
                <CeoPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/print-student/:studentID"
            element={
              <ProtectedRoute role="admin">
                <PrintableStudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSprefert1"
            element={
              <ProtectedRoute role="admin">
                <GMSSprefert1 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSprefert2"
            element={
              <ProtectedRoute role="admin">
                <GMSSprefert2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSprefert3"
            element={
              <ProtectedRoute role="admin">
                <GMSSprefert3 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSprefert4"
            element={
              <ProtectedRoute role="admin">
                <GMSSprefert4 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSprefert5"
            element={
              <ProtectedRoute role="admin">
                <GMSSprefert5 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/GMSSextra"
            element={
              <ProtectedRoute role="admin">
                <GMSSextra />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
