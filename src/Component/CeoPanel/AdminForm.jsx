import React, { useState, useEffect } from "react";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, // 🆕 Import doc for referencing a specific document
    updateDoc, // 🆕 Import updateDoc for editing
    deleteDoc // 🆕 Import deleteDoc for removal
} from "firebase/firestore";
import { db } from "../../../firebase";

// Define a simple password for demonstration. Replace with proper authentication in production.
const ADMIN_PASSWORD = "superadmin";

const AdminForm = () => {
    // Basic Form States
    const [adminID, setAdminID] = useState("");
    const [adminName, setAdminName] = useState("");
    const [schoolId, setSchoolId] = useState("");
    const [adminType, setAdminType] = useState("");
    
    // 🆕 State to track the currently edited document ID
    const [editingId, setEditingId] = useState(null); 

    // Data and UI States
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // To disable button during submission

    // Helper to reset the form fields
    const resetForm = () => {
        setAdminID("");
        setAdminName("");
        setSchoolId("");
        setAdminType("");
        setEditingId(null); // Important: Clear the editing state
    };

    // 1. Fetch existing admins on component mount (Unchanged)
   // 1️⃣ Move fetchAdmins here
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

// 2️⃣ Call it inside useEffect
useEffect(() => {
    fetchAdmins();
}, []);


    // 2. Handle Form Submission (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!adminID || !adminName || !schoolId || !adminType) {
            alert("Please fill in all fields, including Admin Type.");
            return;
        }

        setIsSubmitting(true);

        const adminData = {
            adminID,
            adminName,
            schoolId,
            adminType,
        };

        try {
            if (editingId) {
                // UPDATE Logic
                const adminRef = doc(db, "Admins", editingId);
                await updateDoc(adminRef, adminData);
                alert(`Admin ${adminName} updated successfully!`);
            } else {
                // Check for existing ID only on NEW registration
                const q = query(collection(db, "Admins"), where("adminID", "==", adminID));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    alert("Admin ID already exists!");
                    setIsSubmitting(false);
                    return;
                }

                // ADD Logic
                await addDoc(collection(db, "Admins"), adminData);
                alert(`Admin ${adminName} added successfully!`);
            }

            // Refetch data or update local state (Refetch is simpler for now)
            // For a complete real-time experience, you'd use onSnapshot here.
            await fetchAdmins(); 
            resetForm();

        } catch (error) {
            console.error(`Error ${editingId ? "updating" : "adding"} admin:`, error);
            alert(`Failed to ${editingId ? "update" : "add"} admin. Check console.`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // 3. 🆕 Function to load data into the form for editing
    const handleEdit = (admin) => {
        setEditingId(admin.id);
        setAdminID(admin.adminID);
        setAdminName(admin.adminName);
        setSchoolId(admin.schoolId);
        setAdminType(admin.adminType);
    };

    // 4. 🆕 Function to delete an admin record
    const handleDelete = async (id, name) => {
        const password = window.prompt(`Enter the password to delete admin: ${name}`);

        if (password === ADMIN_PASSWORD) {
            if (window.confirm(`Are you sure you want to delete admin: ${name}? This cannot be undone.`)) {
                try {
                    const adminRef = doc(db, "Admins", id);
                    await deleteDoc(adminRef);
                    alert(`Admin ${name} deleted successfully!`);
                    
                    // Optimistically update the UI
                    setAdmins(admins.filter(admin => admin.id !== id));
                    
                    // If the deleted item was being edited, clear the form
                    if (editingId === id) {
                        resetForm();
                    }
                } catch (error) {
                    console.error("Error deleting admin:", error);
                    alert("Failed to delete admin. Check console for details.");
                }
            }
        } else if (password !== null) {
            alert("Incorrect password. Deletion cancelled.");
        }
    };


    return (
        <div className="max-w-xl mx-auto p-6 bg-gray-50 shadow-2xl rounded-xl">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">
                {editingId ? "Update Admin Details" : "Add New Admin"}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 bg-white rounded-lg shadow-inner">
                
                {/* Admin ID Field */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">Admin ID</label>
                    <input
                        type="text"
                        value={adminID}
                        onChange={(e) => setAdminID(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        placeholder="Enter unique admin ID"
                        // Disable ID input during editing to prevent accidental changes to the key field
                        disabled={!!editingId} 
                    />
                    {editingId && <p className="text-sm text-red-500 mt-1">Admin ID cannot be changed when updating.</p>}
                </div>

                {/* Admin Name Field */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">Admin Name</label>
                    <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        placeholder="Enter admin name"
                    />
                </div>

                {/* School ID Field */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">School ID</label>
                    <input
                        type="text"
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        placeholder="Enter school ID"
                    />
                </div>

                {/* Admin Type Selection Field */}
                <div>
                    <label className="block font-semibold mb-1 text-gray-700">Admin Type</label>
                    <select
                        value={adminType}
                        onChange={(e) => setAdminType(e.target.value)}
                        className="w-full border px-4 py-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        required
                    >
                        <option value="" disabled>Select Admin Category</option>
                        <option value="Gov">Government (Gov)</option>
                        <option value="Private">Private</option>
                        <option value="Fees">Fees Admin</option>
                        <option value="Special">Special/Super Admin</option>
                    </select>
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
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

            <hr className="my-8 border-gray-300" />

            {/* Admins Table */}
            <h3 className="text-2xl font-bold mb-4 text-center">Registered Admins ({admins.length})</h3>
            
            {loading ? (
                <p className="text-center text-gray-600">Loading admins...</p>
            ) : admins.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-indigo-50 transition duration-150">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{admin.adminName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{admin.adminID}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 font-semibold">{admin.adminType}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{admin.schoolId}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        {/* 5. 🆕 Update Button */}
                                        <button 
                                            onClick={() => handleEdit(admin)} 
                                            className="text-indigo-600 hover:text-indigo-800 mr-3 disabled:opacity-50"
                                            disabled={editingId === admin.id} // Disable if currently being edited
                                        >
                                            Update
                                        </button>
                                        
                                        {/* 6. 🆕 Delete Button */}
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