import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { schooldb } from "../Database/SchoolsResults"; 
import {
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc
} from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import localforage from "localforage";

// Initialize localforage store to clear matching caches on bulk delete
const gradesStore = localforage.createInstance({
    name: "GradesAudit",
    storeName: "pupilGrades",
});

const BulkDeleteGradesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const schoolId = location.state?.schoolId || "N/A";

    const [assignments, setAssignments] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTest, setSelectedTest] = useState("Term 1 T1");
    const [academicYear, setAcademicYear] = useState("");
    
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [affectedCount, setAffectedCount] = useState(null);
    const [confirmationText, setConfirmationText] = useState("");

    const tests = ["Term 1 T1", "Term 1 T2", "Term 2 T1", "Term 2 T2", "Term 3 T1", "Term 3 T2"];
    const SAFETY_PHRASE = "DELETE ALL GRADES";

    // --- 1️⃣ Pull Classes, Subjects, and Years for Selection Context ---
    useEffect(() => {
        if (schoolId === "N/A") return;

        async function fetchContextData() {
            try {
                // Fetch assignments to populate Class and Subject configurations
                const assignmentsSnap = await getDocs(
                    query(collection(db, "TeacherAssignments"), where("schoolId", "==", schoolId))
                );
                
                const data = assignmentsSnap.docs.map(doc => doc.data());
                const uniqueAssignments = data.reduce((acc, assignment) => {
                    const existing = acc.find(a => a.className === assignment.className);
                    if (existing) {
                        assignment.subjects.forEach(sub => {
                            if (!existing.subjects.includes(sub)) existing.subjects.push(sub);
                        });
                    } else {
                        acc.push({ className: assignment.className, subjects: [...assignment.subjects] });
                    }
                    return acc;
                }, []).sort((a, b) => a.className.localeCompare(b.className));

                setAssignments(uniqueAssignments);
                if (uniqueAssignments.length > 0) {
                    setSelectedClass(uniqueAssignments[0].className);
                    setSelectedSubject(uniqueAssignments[0].subjects[0]);
                }

                // Fetch latest academic year
                const pupilSnap = await getDocs(
                    query(collection(db, "PupilsReg"), where("schoolId", "==", schoolId))
                );
                if (!pupilSnap.empty) {
                    // Get unique academic years sorted descending
                    const years = [...new Set(pupilSnap.docs.map(d => d.data().academicYear))].sort((a, b) => b.localeCompare(a));
                    setAcademicYear(years[0] || "");
                }
            } catch (err) {
                console.error("Error setting up context filters:", err);
            } finally {
                setLoadingAssignments(false);
            }
        }

        fetchContextData();
    }, [schoolId]);

    // Track matching target document counts whenever filters shift
    useEffect(() => {
        if (!selectedClass || !selectedSubject || !selectedTest || !academicYear || schoolId === "N/A") {
            setAffectedCount(null);
            return;
        }

        const checkCount = async () => {
            const q = query(
                collection(schooldb, "PupilGrades"),
                where("schoolId", "==", schoolId),
                where("className", "==", selectedClass),
                where("subject", "==", selectedSubject),
                where("test", "==", selectedTest),
                where("academicYear", "==", academicYear)
            );
            const snap = await getDocs(q);
            setAffectedCount(snap.size);
        };

        const timer = setTimeout(checkCount, 300); // debounce slightly
        return () => clearTimeout(timer);
    }, [selectedClass, selectedSubject, selectedTest, academicYear, schoolId]);

    // --- 2️⃣ Execute Batch Deletion ---
    const handleBulkDelete = async (e) => {
        e.preventDefault();
        if (confirmationText !== SAFETY_PHRASE) {
            alert("Please type the safety phrase exactly to confirm.");
            return;
        }

        if (affectedCount === 0 || affectedCount === null) {
            alert("No grades matching these filters found to delete.");
            return;
        }

        const ultimateCheck = window.confirm(
            `⚠️ CRITICAL WARNING!\nYou are about to permanently purge ${affectedCount} grades record(s) for Class ${selectedClass}, Subject: ${selectedSubject}, ${selectedTest}, Year: ${academicYear}.\n\nThis cannot be undone. Proceed?`
        );
        if (!ultimateCheck) return;

        setIsDeleting(true);

        try {
            const gradesQuery = query(
                collection(schooldb, "PupilGrades"),
                where("schoolId", "==", schoolId),
                where("className", "==", selectedClass),
                where("subject", "==", selectedSubject),
                where("test", "==", selectedTest),
                where("academicYear", "==", academicYear)
            );

            const snapshot = await getDocs(gradesQuery);
            const batch = writeBatch(schooldb);

            snapshot.docs.forEach((document) => {
                batch.delete(doc(schooldb, "PupilGrades", document.id));
            });

            await batch.commit();

            // Clear local cached views for this scope so stale data isn't loaded later
            const cacheKey = `${schoolId}_${selectedClass}_${selectedSubject}_${selectedTest}_${academicYear}`;
            await gradesStore.removeItem(cacheKey);

            alert(`🎉 Bulk operation successful. Deleted ${snapshot.size} grade entries.`);
            setConfirmationText("");
            setAffectedCount(0);
        } catch (error) {
            console.error("Bulk delete failure:", error);
            alert("An error occurred executing the batch operation. Check developer logs.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loadingAssignments) {
        return <div className="text-center p-12 text-gray-500">Loading audit parameters...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-red-100">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <button 
                    onClick={() => navigate(-1)} 
                    className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                    ⬅️ Back to Audit
                </button>
                <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold">Admin Destructive Tool</span>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">🚨 Bulk Purge Grades</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
                Wipe clean grade datasets for a specific class tier, subject, test window, and academic lifecycle at once.
            </p>

            <form onSubmit={handleBulkDelete} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl space-y-3 text-sm text-gray-700">
                    <div>School Target ID: <span className="font-bold text-gray-900">{schoolId}</span></div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium mb-1">Academic Year:</label>
                            <input 
                                type="text" 
                                value={academicYear} 
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className="w-full border rounded p-2 bg-white" 
                                placeholder="e.g. 2025/2026"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Test Scope:</label>
                            <select 
                                value={selectedTest} 
                                onChange={(e) => setSelectedTest(e.target.value)}
                                className="w-full border rounded p-2 bg-white"
                            >
                                {tests.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium mb-1">Target Class:</label>
                            <select 
                                value={selectedClass} 
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    const match = assignments.find(a => a.className === e.target.value);
                                    if (match) setSelectedSubject(match.subjects[0]);
                                }}
                                className="w-full border rounded p-2 bg-white"
                            >
                                {assignments.map(a => <option key={a.className} value={a.className}>{a.className}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Target Subject:</label>
                            <select 
                                value={selectedSubject} 
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full border rounded p-2 bg-white"
                            >
                                {assignments.find(a => a.className === selectedClass)?.subjects.map((sub, i) => (
                                    <option key={i} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Real-time Indicator Panel */}
                <div className={`p-4 rounded-xl border text-center transition-all ${
                    affectedCount > 0 ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-green-50 border-green-200 text-green-900"
                }`}>
                    {affectedCount === null ? (
                        <p className="text-xs animate-pulse">Calculating targeted records...</p>
                    ) : (
                        <p className="text-sm font-semibold">
                            Found <span className="text-base font-black underline">{affectedCount}</span> entries ready to drop matching this selection profile.
                        </p>
                    )}
                </div>

                {/* Safety Input Field */}
                {affectedCount > 0 && (
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-xs font-bold text-red-800 uppercase tracking-wider">
                            Type text phrase <span className="underline">"{SAFETY_PHRASE}"</span> to unlock actions:
                        </label>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="Type verification phrase here..."
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-center tracking-wide font-mono focus:ring-2 focus:ring-red-400 focus:outline-none"
                            disabled={isDeleting}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isDeleting || affectedCount === 0 || affectedCount === null || confirmationText !== SAFETY_PHRASE}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                        isDeleting || affectedCount === 0 || affectedCount === null || confirmationText !== SAFETY_PHRASE
                            ? "bg-gray-300 cursor-not-allowed shadow-none"
                            : "bg-red-600 hover:bg-red-700 hover:shadow-red-200"
                    }`}
                >
                    {isDeleting ? "Processing Batches... Please wait" : `💥 Wipe ${affectedCount || 0} Records Permanently`}
                </button>
            </form>
        </div>
    );
};

export default BulkDeleteGradesPage;