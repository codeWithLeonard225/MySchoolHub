import React, { useState, useEffect } from "react";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc 
} from "firebase/firestore";
import { db } from "../../../firebase";
// Assuming you have toast imported from 'react-toastify'
// import { toast } from "react-toastify"; 

const ADMIN_PASSWORD = "superadmin";

const AdminForm = () => {
    // Form States
    const [adminID, setAdminID] = useState("");
    const [adminName, setAdminName] = useState("");
    const [schoolId, setSchoolId] = useState("");
    const [schoolName, setSchoolName] = useState(""); 
    const [adminType, setAdminType] = useState("");
    const [role, setRole] = useState(""); // Role state remains a string

    const [editingId, setEditingId] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setAdminID("");
        setAdminName("");
        setSchoolId("");
        setSchoolName(""); 
        setAdminType("");
        setRole(""); // Reset role to empty string
        setEditingId(null);
    };

    // --- Data Fetching ---

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "Admins"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (a.adminName || "").localeCompare(b.adminName || ""));
            setAdmins(data);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // --- Handle Submission ---

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation checks remain the same
        if (!adminID || !adminName || !schoolId || !schoolName || !adminType || !role) {
            alert("Please fill in all fields (ID, Name, School ID, School Name, Admin Type, and Role).");
            return;
        }

        setIsSubmitting(true);

        const adminData = {
            adminID,
            adminName,
            schoolId,
            schoolName,
            adminType,
            role, // Role value comes from the text input state
        };

        try {
            if (editingId) {
                const adminRef = doc(db, "Admins", editingId);
                await updateDoc(adminRef, adminData);
                alert(`Admin ${adminName} updated successfully!`);
            } else {
                const q = query(collection(db, "Admins"), where("adminID", "==", adminID));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    alert("Admin ID already exists!");
                    setIsSubmitting(false);
                    return;
                }

                await addDoc(collection(db, "Admins"), adminData);
                alert(`Admin ${adminName} added successfully!`);
            }

            await fetchAdmins();
            resetForm();

        } catch (error) {
            console.error(`Error ${editingId ? "updating" : "adding"} admin:`, error);
            alert(`Failed to ${editingId ? "update" : "add"} admin.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Handle Edit & Delete ---

    const handleEdit = (admin) => {
        setEditingId(admin.id);
        setAdminID(admin.adminID || "");
        setAdminName(admin.adminName || "");
        setSchoolId(admin.schoolId || "");
        setSchoolName(admin.schoolName || "");
        setAdminType(admin.adminType || "");
        setRole(admin.role || ""); // Load existing role string
    };

    const handleDelete = async (id, name) => {
        const password = window.prompt(`Enter the password to delete admin: ${name}`);

        if (password === ADMIN_PASSWORD) {
            if (window.confirm(`Are you sure you want to delete admin: ${name}?`)) {
                try {
                    const adminRef = doc(db, "Admins", id);
                    await deleteDoc(adminRef);
                    alert(`Admin ${name} deleted successfully!`);
                    setAdmins(admins.filter(admin => admin.id !== id));
                    if (editingId === id) resetForm();
                } catch (error) {
                    console.error("Error deleting admin:", error);
                    alert("Failed to delete admin.");
                }
            }
        } else if (password !== null) {
            alert("Incorrect password. Deletion cancelled.");
        }
    };

    // --- Render JSX ---

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-2xl rounded-xl">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">
                {editingId ? "Update Admin Details" : "Add New Admin"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 bg-white rounded-lg shadow-inner">

                {/* Admin ID */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">Admin ID</label>
                    <input
                        type="text"
                        value={adminID}
                        onChange={(e) => setAdminID(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                        placeholder="Enter admin ID"
                        disabled={!!editingId}
                        required
                    />
                </div>

                {/* Admin Name */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">Admin Name</label>
                    <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                        placeholder="Enter admin name"
                        required
                    />
                </div>

                {/* School ID */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">School ID</label>
                    <input
                        type="text"
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                        placeholder="Enter school ID"
                        required
                    />
                </div>
                
                {/* School Name */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">School Name</label>
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                        placeholder="Enter school name"
                        required
                    />
                </div>

                {/* Admin Type and Role - Side by Side */}
                <div className="flex space-x-4">
                    {/* Admin Type */}
                    <div className="flex-1">
                        <label className="block font-semibold mb-1 text-gray-700">Admin Type</label>
                        <select
                            value={adminType}
                            onChange={(e) => setAdminType(e.target.value)}
                            className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="Gov">Government</option>
                            <option value="Private">Private</option>
                            <option value="Fees">Fees Admin</option>
                            <option value="Special">Special/Super Admin</option>
                        </select>
                    </div>

                    {/* ✅ UPDATED: Role is now a text input */}
                    <div className="flex-1">
                        <label className="block font-semibold mb-1 text-gray-700">Role</label>
                        <input
                            type="text" // ⬅️ Changed from <select> to <input type="text">
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500"
                            placeholder="Enter role (e.g., Teacher, CEO)"
                            required
                        />
                    </div>
                </div>
                
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        {isSubmitting ? "Processing..." : editingId ? "Save Changes" : "Add Admin"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-1/4 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <h3 className="text-2xl font-bold mb-4 text-center">Registered Admins ({admins.length})</h3>
            
            {loading ? (
                <p className="text-center text-gray-600">Loading admins...</p>
            ) : admins.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AdminType</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-indigo-50 transition duration-150">
                                    <td className="px-4 py-3 text-sm text-gray-500">{admin.schoolId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{admin.adminID}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{admin.adminName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{admin.schoolName}</td>
                                    <td className="px-4 py-3 text-sm text-indigo-600 font-semibold">{admin.adminType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{admin.role}</td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        <button 
                                            onClick={() => handleEdit(admin)} 
                                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                                            disabled={editingId === admin.id}
                                        >
                                            Update
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(admin.id, admin.adminName)} 
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500">No admins found.</p>
            )}
        </div>
    );
};

export default AdminForm;