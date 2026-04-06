import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../Security/AuthContext";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const IDExportPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const currentSchoolId = location.state?.schoolId || user?.schoolId || "N/A";

    const [pupils, setPupils] = useState([]);
    const [classOptions, setClassOptions] = useState([]); // State for the filter dropdown
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("All");

    // 1. Fetch Pupils
    useEffect(() => {
        if (currentSchoolId === "N/A") return;
        const q = query(collection(db, "PupilsReg"), where("schoolId", "==", currentSchoolId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPupils(data);
            
            // Extract unique classes for the filter dropdown
            const uniqueClasses = [...new Set(data.map(p => p.class))].filter(Boolean).sort();
            setClassOptions(uniqueClasses);
            
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentSchoolId]);

    // 2. Filter Logic (Search + Class Dropdown)
    const filteredPupils = useMemo(() => {
        return pupils.filter(p => {
            const matchesSearch = p.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = selectedClass === "All" || p.class === selectedClass;
            return matchesSearch && matchesClass;
        });
    }, [pupils, searchTerm, selectedClass]);

    const downloadPhoto = async (photoUrl, studentName) => {
        try {
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${studentName.replace(/\s+/g, '_')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error("Download failed.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading ID Data...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header & Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">ID Design Portal</h1>
                
                <div className="flex gap-2 flex-wrap">
                    {/* Class Filter Dropdown */}
                    <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="border p-2 rounded bg-blue-50 text-blue-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Classes</option>
                        {classOptions.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Name Search */}
                    <input 
                        type="text" 
                        placeholder="Search student..." 
                        className="border p-2 rounded w-48 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mb-4 text-sm text-gray-500">
                Showing <strong>{filteredPupils.length}</strong> students in <strong>{selectedClass}</strong>
            </div>

            {/* ID Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPupils.map((pupil) => (
                    <div key={pupil.id} className="bg-white border rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow flex h-44">
                        {/* Left Side: Photo */}
                        <div className="w-1/3 bg-gray-100 flex flex-col items-center justify-center p-2 border-r">
                            <img 
                                src={pupil.userPhotoUrl || "https://via.placeholder.com/150"} 
                                alt="Pupil" 
                                className="w-24 h-24 object-cover rounded-md border-2 border-white shadow-sm mb-2"
                            />
                            <button 
                                onClick={() => downloadPhoto(pupil.userPhotoUrl, pupil.studentName)}
                                className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded hover:bg-black uppercase tracking-wider font-bold"
                            >
                                Get Photo
                            </button>
                        </div>

                        {/* Right Side: CorelDraw Data */}
                        <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                                <h2 className="font-bold text-blue-900 truncate uppercase leading-tight">
                                    {pupil.studentName}
                                </h2>
                                <p className="text-xs font-bold text-red-500 mb-2">{pupil.studentID}</p>
                                
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-600">
                                    <p><span className="text-gray-400">CLASS:</span> {pupil.class}</p>
                                    <p><span className="text-gray-400">GEN:</span> {pupil.gender}</p>
                                    <p><span className="text-gray-400">DOB:</span> {pupil.dob}</p>
                                    <p><span className="text-gray-400">AGE:</span> {pupil.age}</p>
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400 italic border-t pt-1">
                                Academic: {pupil.academicYear}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IDExportPage;