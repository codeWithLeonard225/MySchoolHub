import React, { useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"; // 🛑 ADDED doc, getDoc
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Security/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";


const LoginPage = () => {
  const [userID, setUserID] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Define all collections to check
  const collectionsToCheck = [
  { name: "Admins", idField: "adminID", nameField: "adminName", role: "admin", route: null }, // route will be dynamic
  { name: "PupilsReg", idField: "studentID", nameField: "studentName", role: "pupil", route: "/PupilsDashboard" },
  { name: "Teachers", idField: "teacherID", nameField: "teacherName", role: "teacher", route: "/teacher" },
  { name: "CEOs", idField: "ceoID", nameField: "ceoName", role: "ceo", route: "/ceo" },
];


  // Map adminType to route
const getAdminRoute = (adminType) => {
  switch (adminType) {
    case "Gov":
      return "/gov";
    case "Private":
      return "/admin";
    case "Fees":
      return "/registra";
    case "Special":
      return "/special";
    default:
      return "/admin"; // fallback
  }
};


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedUserID = userID.trim();
    const trimmedUserName = userName.trim();
``



    if (!trimmedUserID || !trimmedUserName) {
      setError("Please enter your ID and Name.");
      setLoading(false);
      return;
    }

    try {
      let foundUser = null;
      let userRole = null;
      let schoolId = null;
      let schoolName = null;
      let schoolLogoUrl = null; // 🛑 Initialize schoolName
      let schoolAddress = null; // 🛑 Initialize schoolName
      let schoolMotto = null; // 🛑 Initialize schoolName
      let schoolContact = null; // 🛑 Initialize schoolName
      let email = null; // 🛑 Initialize schoolName
      let navigationRoute = null;




      // 1. ITERATE AND SEARCH: Check all collections for a match
      for (const { name, idField, nameField, role, route } of collectionsToCheck) {
        const userQuery = query(
          collection(db, name),
          where(idField, "==", trimmedUserID.toLowerCase()),
          where(nameField, "==", trimmedUserName)
        );
        const snapshot = await getDocs(userQuery);

        if (!snapshot.empty) {
  foundUser = snapshot.docs[0].data();
  userRole = role;
  schoolId = foundUser.schoolId;

  // 🆕 If this is an admin, set route dynamically based on adminType
  navigationRoute = name === "Admins" ? getAdminRoute(foundUser.adminType) : route;

  break;
}

      }

      // 2. AUTHENTICATION DECISION & SCHOOL NAME FETCH
      if (foundUser && schoolId) {
        // 🛑 NEW STEP: Fetch School Name using the detected schoolId
        const schoolsQuery = query(collection(db, "Schools"), where("schoolID", "==", schoolId));
        const schoolsSnapshot = await getDocs(schoolsQuery);

        if (!schoolsSnapshot.empty) {
          const schoolData = schoolsSnapshot.docs[0].data();
          schoolName = schoolData.schoolName;
          schoolLogoUrl = schoolData.schoolLogoUrl || "/images/default.png";
          schoolAddress = schoolData.schoolAddress || "Address not found";
          schoolMotto = schoolData.schoolMotto || "No motto";
          schoolContact = schoolData.schoolContact || "No contact info";
          email = schoolData.email || "No email";
        } else {
          schoolName = "Unknown School (ID: " + schoolId + ")";
          schoolLogoUrl = "/images/default.png";
          schoolAddress = "Address not found";
          schoolMotto = "No motto";
          schoolContact = "No contact info";
          email = "No email";
          console.warn(`School document not found for schoolID: ${schoolId}`);
        }


        // Success: User found, role, ID, and Name determined
        setUser({ role: userRole, data: foundUser, schoolId: schoolId, schoolName: schoolName }); // 🛑 Add schoolName to AuthContext

        navigate(navigationRoute, {
          state: {
            user: foundUser,
            schoolId,
            schoolName,
            schoolLogoUrl,
            schoolAddress,
            schoolMotto,
            schoolContact,
            email
          },
        });


      } else {
        // Failure: User not found
        setError("Invalid ID or Name. Please check your credentials.");
      }

    } catch (error) {
      console.error("Login error:", error);
      setError("A system error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the component's return block remains the same)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">School Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">

          {/* 🛑 REMOVED School ID Input Field */}

          <div className="relative">
            <label className="block text-gray-700 font-semibold mb-1">ID</label>
            <input
              type={showPassword ? "text" : "password"}
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              required
              disabled={loading}
              placeholder="Enter your ID"
            />
            <span
              className="absolute right-3 top-9 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
              placeholder="Enter your name"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className={`w-full p-2 rounded-lg font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-700 text-white hover:bg-indigo-800"
              }`}
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;