import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { schoollpq } from "../Database/schoollibAndPastquestion";
import { collection, addDoc, doc, updateDoc, query, onSnapshot, where, getDocs, } from "firebase/firestore";
import { useAuth } from "../Security/AuthContext";
import localforage from "localforage";

// Constants/Helpers
const pupilStore = localforage.createInstance({ name: "PupilDataCache", storeName: "pupil_reg" });
const getTodayDate = () => new Date().toISOString().slice(0, 10);
const LOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const AttendancePageClass = () => {
    const { user } = useAuth();
    
    // Auth & Access
    const currentSchoolId = user?.schoolId || "N/A";
    const userClass = user?.data?.className || null;
    const isClassRestricted = !!userClass;

    // State
    const [academicYear, setAcademicYear] = useState("");
    const [selectedClass, setSelectedClass] = useState(userClass || ""); 
    const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
    const [academicYears, setAcademicYears] = useState([]);
    const [availableClasses, setAvailableClasses] = useState(isClassRestricted ? [userClass] : []); 
    const [allPupilsData, setAllPupilsData] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [isSaving, setIsSaving] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({}); 

    const isCurrentDate = useMemo(() => attendanceDate === getTodayDate(), [attendanceDate]);

    // Data Processing/Filtering Logic
    const processPupils = (pupilsList) => {
        const relevantPupils = isClassRestricted ? pupilsList.filter(p => p.class === userClass) : pupilsList;
        const years = [...new Set(relevantPupils.map(p => p.academicYear).filter(Boolean))].sort().reverse();
        const classes = isClassRestricted ? [userClass] : [...new Set(relevantPupils.map(p => p.class).filter(Boolean))].sort();

        setAllPupilsData(pupilsList);
        setAcademicYears(years);
        setAvailableClasses(classes);
        
        if (years.length > 0 && !academicYear) setAcademicYear(years[0]);
        if (!isClassRestricted && classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
    };

    // 1. Fetch Pupils (Cached & Live)
    useEffect(() => {
        if (!currentSchoolId || currentSchoolId === "N/A") return;

        const CACHE_KEY = `all_pupils_data_${currentSchoolId}_${userClass || 'all'}`;
        let cacheLoaded = false; 

        setLoading(true);
        pupilStore.getItem(CACHE_KEY).then(cachedData => {
            if (cachedData && cachedData.pupilsList.length > 0) {
                processPupils(cachedData.pupilsList);
                cacheLoaded = true; 
                toast.info("Pupil data loaded from cache.", { autoClose: 1500 });
            }
        }).catch(err => console.error("Cache load failed:", err));

        let pupilsQuery = query(collection(db, "PupilsReg"), where("schoolId", "==", currentSchoolId));
        if (isClassRestricted) {
            pupilsQuery = query(pupilsQuery, where("class", "==", userClass));
        }

        const unsub = onSnapshot(pupilsQuery, async (snapshot) => {
            const liveData = snapshot.docs.map((doc) => ({
                id: doc.id,
                studentID: doc.data().studentID,
                studentName: doc.data().studentName,
                academicYear: doc.data().academicYear, 
                class: doc.data().class, 
            }));

            processPupils(liveData);
            await pupilStore.setItem(CACHE_KEY, { pupilsList: liveData, timestamp: new Date() });
            
            setLoading(false);
            if (!cacheLoaded && liveData.length > 0) { 
                toast.success("Pupil list synced from server.", { autoClose: 1500 });
            }
        }, (error) => {
            console.error("Error fetching pupils:", error);
            setLoading(false); 
        });

        return () => unsub();
    }, [currentSchoolId, userClass, isClassRestricted]);
    
    // Filtered Pupils
    const filteredPupils = useMemo(() => {
        if (!academicYear || !selectedClass) return [];
        return allPupilsData
            .filter(p => p.academicYear === academicYear && p.class === selectedClass)
            .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }, [allPupilsData, academicYear, selectedClass]);

    // 2. Fetch Attendance
    const fetchAttendance = useCallback(async () => {
        if (!currentSchoolId || !academicYear || !selectedClass || !attendanceDate) {
            setAttendanceRecords({});
            return;
        }

        const attendanceQuery = query(
            collection(schoollpq, "PupilAttendance"),
            where("schoolId", "==", currentSchoolId),
            where("academicYear", "==", academicYear),
            where("className", "==", selectedClass),
            where("date", "==", attendanceDate)
        );

        try {
            const snapshot = await getDocs(attendanceQuery);
            const records = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                records[data.studentID] = {
                    status: data.status,
                    docId: doc.id,
                    timestamp: data.timestamp ? data.timestamp.toDate() : null 
                };
            });
            setAttendanceRecords(records);
            setUnsavedChanges({}); 
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("Failed to fetch existing records.");
        }
    }, [currentSchoolId, academicYear, selectedClass, attendanceDate]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    // 3. Locking Logic
    const isAttendanceLocked = useCallback((studentID) => {
        if (!isCurrentDate) return true; // Rule 1: Always lock old dates

        const record = attendanceRecords[studentID];
        if (record && record.timestamp) {
            const recordTime = record.timestamp.getTime();
            const currentTime = new Date().getTime();
            return (currentTime - recordTime) > LOCK_DURATION_MS; // Rule 2: Check 2-hour lock
        }
        return false; 
    }, [isCurrentDate, attendanceRecords]);


    const handleAttendanceChange = (studentID, status) => {
        if (isAttendanceLocked(studentID)) {
            toast.warn(!isCurrentDate 
                ? `Attendance for ${attendanceDate} is locked.` 
                : `Locked: 2-hour editing limit expired.`);
            return;
        }
        
        setUnsavedChanges(prev => ({ ...prev, [studentID]: status }));
    };

    // 4. Save Attendance
    const handleSaveAttendance = async () => {
        if (Object.keys(unsavedChanges).length === 0) {
            toast.info("No changes to save.");
            return;
        }

        setIsSaving(true);
        const batchUpdates = [];
        const registeredBy = user?.data?.adminID || user?.data?.teacherID || "System";
        const currentTimestamp = new Date(); 

        try {
            for (const [studentID, status] of Object.entries(unsavedChanges)) {
                if (isAttendanceLocked(studentID)) {
                    toast.warn(`Change for ${studentID} was skipped; lock expired.`);
                    continue; 
                }

                const existingRecord = attendanceRecords[studentID];
                const pupilData = allPupilsData.find(p => p.studentID === studentID); 
                const studentName = pupilData ? pupilData.studentName : 'Unknown Pupil';
                
                const newRecord = {
                    schoolId: currentSchoolId, academicYear, className: selectedClass,
                    studentID, studentName, date: attendanceDate, status, 
                    registeredBy, timestamp: currentTimestamp, 
                };

                if (existingRecord) {
                    const docRef = doc(schoollpq, "PupilAttendance", existingRecord.docId);
                    batchUpdates.push(updateDoc(docRef, { status, timestamp: currentTimestamp })); 
                } else {
                    batchUpdates.push(addDoc(collection(schoollpq, "PupilAttendance"), newRecord));
                }
            }

            if (batchUpdates.length > 0) {
                await Promise.all(batchUpdates);
                toast.success(`✅ Attendance for ${batchUpdates.length} pupils saved!`);
            } else {
                toast.info("No valid changes to save.");
            }
            
            await fetchAttendance(); 
            
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("❌ Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // UI Helpers
    const getStatus = (studentID) => unsavedChanges[studentID] || attendanceRecords[studentID]?.status || "Unmarked";
    const getStatusColor = (status) => {
        switch (status) {
            case "Present": return "bg-green-100 border-green-500 text-green-700";
            case "Absent": return "bg-red-100 border-red-500 text-red-700";
            default: return "bg-gray-100 border-gray-400 text-gray-700";
        }
    };
    const getLockDisplay = (isLocked) => isLocked ? <span className="text-red-500 ml-1 text-xs">🔒</span> : null;
    
    if (currentSchoolId === "N/A") {
        return <div className="p-4 bg-red-100 text-red-800 rounded">Access Error: School ID not found.</div>;
    }
    
    const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;
    const isSaveDisabled = !hasUnsavedChanges || isSaving || loading;
    const isDatePickerLocked = !isCurrentDate;


    return (
        <div className="bg-gray-50 min-h-screen"> 
            <div className="bg-white rounded-lg shadow-lg p-3"> {/* Reduced padding */}
                <h2 className="text-xl font-bold mb-4 text-center text-teal-700">
                    Daily Attendance 🏫
                </h2>

                {/* --- Filter & Action Bar --- */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-teal-50 border border-teal-200 rounded-md"> {/* Grid for smaller screen */}
                    
                    {/* Date Picker (Col 1) */}
                    <div className="col-span-2"> 
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date:</label>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            max={getTodayDate()}
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm p-1"
                            disabled={isDatePickerLocked || loading || isSaving}
                        />
                        {isDatePickerLocked && <p className="text-xs text-red-500 mt-1">Date is locked.</p>}
                    </div>
                    
                    {/* Academic Year Selector (Col 1) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Year:</label>
                        <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm p-1"
                            disabled={loading || isSaving}
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>

                    {/* Class Selector (Col 2) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Class:</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm p-1"
                            disabled={isClassRestricted || loading || isSaving}
                        >
                            <option value="">Select Class</option>
                            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        {isClassRestricted && <p className="text-xs text-gray-500 mt-1">Restricted.</p>}
                    </div>
                    
                    {/* Save Button (Full Width, below filters) */}
                    <div className="col-span-2 mt-2">
                        <p className={`text-xs font-medium ${hasUnsavedChanges ? 'text-orange-600' : 'text-gray-500'} mb-1`}>
                            {hasUnsavedChanges ? `${Object.keys(unsavedChanges).length} unsaved` : "No pending changes"}
                        </p>
                        <button 
                            onClick={handleSaveAttendance} 
                            disabled={isSaveDisabled}
                            className="w-full bg-teal-600 text-white px-3 py-2 text-sm rounded-md font-semibold shadow-sm hover:bg-teal-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSaving ? "Saving..." : "💾 Save"}
                        </button>
                    </div>
                </div>

                {/* --- Pupil List / Loading State --- */}
                {loading && !isSaving ? (
                    <div className="text-center p-4 text-teal-600 bg-teal-50 rounded-md">Loading...</div>
                ) : !academicYear || !selectedClass || filteredPupils.length === 0 ? (
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-md">
                        {(!academicYear || !selectedClass) ? "Select Year/Class." : "No pupils found."}
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase w-5/12">Name</th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 uppercase w-2/12">Status</th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 uppercase w-5/12">Mark</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredPupils.map((p) => {
                                    const status = getStatus(p.studentID);
                                    const isLocked = isAttendanceLocked(p.studentID);
                                    const rowHasUnsaved = !!unsavedChanges[p.studentID];
                                    
                                    return (
                                        <tr 
                                            key={p.id} 
                                            className={`hover:bg-gray-50 ${rowHasUnsaved ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                                        >
                                            <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                                {p.studentName}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-1 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                                {getLockDisplay(isLocked && status !== "Unmarked" )} 
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-4"> {/* Reduced spacing */}
                                                    <button 
                                                        onClick={() => handleAttendanceChange(p.studentID, "Present")} 
                                                        disabled={status === "Present" || isSaving || isLocked}
                                                        className={`px-4 py-0.5 text-xs font-medium rounded-md transition ${status === "Present" ? 'bg-green-500 text-white cursor-default' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50`}
                                                    >
                                                        P
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAttendanceChange(p.studentID, "Absent")} 
                                                        disabled={status === "Absent" || isSaving || isLocked}
                                                        className={`px-4 py-0.5 text-xs font-medium rounded-md transition ${status === "Absent" ? 'bg-red-500 text-white cursor-default' : 'bg-red-100 text-red-700 hover:bg-red-200'} disabled:opacity-50`}
                                                    >
                                                        A
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttendancePageClass;