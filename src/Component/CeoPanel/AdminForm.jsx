import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase";

const AdminForm = () => {
  const [adminID, setAdminID] = useState("");
  const [adminName, setAdminName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing admins on component mount
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "Admins")); // Fetch all admins
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAdmins(data);
      } catch (error) {
        console.error("Error fetching admins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!adminID || !adminName || !schoolId) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Optional: check if adminID already exists
      const q = query(collection(db, "Admins"), where("adminID", "==", adminID));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("Admin ID already exists!");
        return;
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, "Admins"), {
        adminID,
        adminName,
        schoolId,
      });

      // Update local state
      setAdmins([...admins, { id: docRef.id, adminID, adminName, schoolId }]);

      // Clear form
      setAdminID("");
      setAdminName("");
      setSchoolId("");
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to add admin. Check console for details.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Admin</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block font-semibold mb-1">Admin ID</label>
          <input
            type="text"
            value={adminID}
            onChange={(e) => setAdminID(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
            placeholder="Enter admin ID"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Admin Name</label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
            placeholder="Enter admin name"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">School ID</label>
          <input
            type="text"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
            placeholder="Enter school ID"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Add Admin
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-600">Loading admins...</p>
      ) : admins.length > 0 ? (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="border px-4 py-2">Admin ID</th>
              <th className="border px-4 py-2">Admin Name</th>
              <th className="border px-4 py-2">School ID</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{admin.adminID}</td>
                <td className="border px-4 py-2">{admin.adminName}</td>
                <td className="border px-4 py-2">{admin.schoolId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500">No admins found.</p>
      )}
    </div>
  );
};

export default AdminForm;
