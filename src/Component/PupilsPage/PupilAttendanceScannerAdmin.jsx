import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../Security/AuthContext";
import { toast } from "react-toastify";

const AttendanceScannerAdmin = () => {
    const { user } = useAuth();
    const currentSchoolId = user?.schoolId || null;

    // Get the currently logged-in admin/teacher from localStorage
    const getLoggedInUser = () => {
        try {
            const savedUser = JSON.parse(localStorage.getItem("schoolUser"));

            if (!savedUser) {
                return {
                    id: "",
                    name: "Unknown User",
                    role: "Unknown",
                };
            }

            const userData = savedUser.data || {};

            return {
                id:
                    userData.adminID ||
                    userData.teacherID ||
                    userData.ceoID ||
                    userData.classId ||
                    savedUser.userID ||
                    "",

                name:
                    userData.adminName ||
                    userData.teacherName ||
                    userData.ceoName ||
                    userData.className ||
                    "Unknown User",

                role: savedUser.role || "Unknown",
            };
        } catch (error) {
            console.error("Failed to read logged-in user:", error);

            return {
                id: "",
                name: "Unknown User",
                role: "Unknown",
            };
        }
    };

    // Navigation Tabs: 'scanner' or 'manual'
    const [activeTab, setActiveTab] = useState("scanner");

    // QR Scanner States
    const [scanMode, setScanMode] = useState("clockIn");
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Pupils / Student List State for Manual Dropdown
    const [pupilsList, setPupilsList] = useState([]);
    const [loadingPupils, setLoadingPupils] = useState(false);

    // Manual Override Form States
    const [manualStudentID, setManualStudentID] = useState("");
    const [selectedPupilName, setSelectedPupilName] = useState("");
    const [manualStatus, setManualStatus] = useState("Excuse");
    const [manualNote, setManualNote] = useState("");
    const [manualSubmitting, setManualSubmitting] = useState(false);

    const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // Keep active scanMode fresh in scanner callbacks
    const scanModeRef = useRef(scanMode);
    useEffect(() => {
        scanModeRef.current = scanMode;
    }, [scanMode]);

    // Fetch Pupils for Manual Dropdown Selection
    useEffect(() => {
        const fetchPupils = async () => {
            setLoadingPupils(true);
            try {
                let q;
                if (currentSchoolId) {
                    q = query(collection(db, "PupilsReg"), where("schoolId", "==", currentSchoolId));
                } else {
                    q = collection(db, "PupilsReg");
                }
                const snap = await getDocs(q);
                const list = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                list.sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""));
                setPupilsList(list);
            } catch (err) {
                console.error("Error fetching pupils list:", err);
                toast.error("Failed to load pupil list.");
            } finally {
                setLoadingPupils(false);
            }
        };

        fetchPupils();
    }, [currentSchoolId]);

    // Initialize HTML5 QR Code Scanner Lifecycle
    useEffect(() => {
        let scanner = null;

        if (activeTab === "scanner") {
            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
        }

        function onScanFailure(error) {
            // Quietly ignore frame decode errors
        }

        async function onScanSuccess(decodedText) {
            if (processing) return;

            try {
                let parsedData;
                try {
                    parsedData = JSON.parse(decodedText);
                } catch {
                    parsedData = { studentID: decodedText.trim() };
                }

                if (!parsedData.studentID) {
                    toast.error("Invalid QR Code format.");
                    return;
                }

                setProcessing(true);
                if (scanner) scanner.pause(true);

                await handleAttendanceLogging(parsedData.studentID, scanModeRef.current);

                setTimeout(() => {
                    setProcessing(false);
                    if (scanner) scanner.resume();
                }, 3000);
            } catch (err) {
                console.error("Scanning error:", err);
                toast.error("Failed to process QR Code.");
                setProcessing(false);
                if (scanner) scanner.resume();
            }
        }

        return () => {
            if (scanner) {
                scanner.clear().catch((err) => console.error("Scanner clear failed", err));
            }
        };
    }, [activeTab]);

    // useEffect(() => {
    //     if (!currentSchoolId || pupilsList.length === 0) return;

    //     const markAbsentPupils = async () => {
    //         const now = new Date();

    //         const currentMinutes =
    //             now.getHours() * 60 + now.getMinutes();

    //         const schoolClosingMinutes = 15 * 60; // 3:00 PM

    //         // Only run at or after 3:00 PM
    //         if (currentMinutes < schoolClosingMinutes) {
    //             return;
    //         }

    //         const todayStr = now.toISOString().slice(0, 10);

    //         try {
    //             console.log("Checking pupils for automatic absence...");

    //             for (const pupil of pupilsList) {
    //                 if (!pupil.studentID) continue;

    //                 const attendanceId =
    //                     `${currentSchoolId}_${pupil.studentID}_${todayStr}`;

    //                 const attendanceRef = doc(
    //                     db,
    //                     "AttendanceLogs",
    //                     attendanceId
    //                 );

    //                 const attendanceSnap = await getDoc(attendanceRef);

    //                 // IMPORTANT:
    //                 // If ANY attendance record already exists,
    //                 // do not touch it.
    //                 if (attendanceSnap.exists()) {
    //                     continue;
    //                 }

    //                 await setDoc(attendanceRef, {
    //                     studentID: pupil.studentID,
    //                     studentName: pupil.studentName,
    //                     class: pupil.class || "",
    //                     academicYear: pupil.academicYear || "",
    //                     userPhotoUrl: pupil.userPhotoUrl || "",
    //                     schoolId: currentSchoolId,
    //                     date: todayStr,

    //                     clockInTime: null,
    //                     clockOutTime: null,

    //                     status: "Absent",

    //                     note: "No clock-in recorded before 3:00 PM school closing time",

    //                     loggedBy: "Automatic Attendance System",

    //                     createdAt: serverTimestamp(),
    //                 });

    //                 console.log(
    //                     `${pupil.studentName} automatically marked Absent`
    //                 );
    //             }

    //             console.log("Automatic absence check completed.");
    //         } catch (error) {
    //             console.error(
    //                 "Error automatically marking pupils absent:",
    //                 error
    //             );
    //         }
    //     };

    //     // Check immediately
    //     markAbsentPupils();

    //     // Check every minute
    //     const interval = setInterval(() => {
    //         markAbsentPupils();
    //     }, 60 * 1000);

    //     return () => clearInterval(interval);

    // }, [currentSchoolId, pupilsList]);

    // Helper: Compute status based on arrival time
    // Pupil attendance time rules
    // ==========================================
    // PUPIL CLOCK-IN TIME RULES
    // ==========================================
    const calculateClockInStatus = (nowDate) => {
        const hours = nowDate.getHours();
        const minutes = nowDate.getMinutes();

        const totalMinutes = hours * 60 + minutes;

        // Attendance time limits
        const ATTENDANCE_START = 6 * 60 + 30;   // 6:30 AM
        const PRESENT_END = 9 * 60 + 30;        // 9:30 AM
        const LATE_END = 10 * 60 + 30;           // 10:30 AM
        const ABSENT_END = 12 * 60 + 55;         // 12:55 PM

        // Before 6:30 AM
        if (totalMinutes < ATTENDANCE_START) {
            return {
                status: "Not Started",
                allowed: false,
                message: "Pupil attendance clock-in starts at 6:30 AM.",
            };
        }

        // 6:30 AM - 9:30 AM
        if (totalMinutes <= PRESENT_END) {
            return {
                status: "Present",
                allowed: true,
                message: "Pupil is Present.",
            };
        }

        // 9:31 AM - 10:30 AM
        if (totalMinutes <= LATE_END) {
            return {
                status: "Late",
                allowed: true,
                message: "Pupil is Late.",
            };
        }

        // 10:31 AM - 12:55 PM
        if (totalMinutes <= ABSENT_END) {
            return {
                status: "Absent",
                allowed: false,
                message: "Pupil is marked Absent because the late clock-in period has ended.",
            };
        }

        // After 12:55 PM
        return {
            status: "Absent",
            allowed: false,
            message: "Pupil attendance clock-in closed at 12:55 PM.",
        };
    };

    // Main QR Attendance Handler
    const handleAttendanceLogging = async (studentID, mode) => {
        const now = new Date();
        const todayStr = getLocalDateString(now);
        const nowTime = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        // ==========================================
        // GET CURRENT LOGGED-IN USER
        // ==========================================
        const loggedInUser = getLoggedInUser();

        // ==========================================
        // 1. FETCH PUPIL DETAILS
        // ==========================================
        const pupilQ = query(
            collection(db, "PupilsReg"),
            where("studentID", "==", studentID),
            where("schoolId", "==", currentSchoolId)
        );

        const pupilSnap = await getDocs(pupilQ);

        if (pupilSnap.empty) {
            toast.error(`Pupil ID ${studentID} not found!`);
            return;
        }

        const pupilData = pupilSnap.docs[0].data();

        // ==========================================
        // 2. ATTENDANCE DOCUMENT
        // ==========================================
        const attendanceId = `${currentSchoolId}_${studentID}_${todayStr}`;
        const attendanceRef = doc(db, "AttendanceLogs", attendanceId);

        const attSnap = await getDoc(attendanceRef);

        // ==========================================
        // CLOCK IN
        // ==========================================
        if (mode === "clockIn") {

            // ------------------------------------------
            // ALREADY HAS ATTENDANCE RECORD
            // ------------------------------------------
            if (attSnap.exists()) {
                const existingLog = attSnap.data();

                toast.warning(
                    `⚠️ Action Blocked: ${pupilData.studentName} is locked as '${existingLog.status}'.`
                );

                setScanResult({
                    name: pupilData.studentName,
                    action: `Clock In Blocked (${existingLog.status})`,
                    time: existingLog.clockInTime || "--",
                    clockOutTime: existingLog.clockOutTime || "--",
                    status: existingLog.status,
                    studentID: pupilData.studentID,
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    // Who attempted the action
                    loggedByName: loggedInUser.name,
                    loggedByRole: loggedInUser.role,

                    isError: true,
                });

                return;
            }

            // ------------------------------------------
            // CALCULATE ATTENDANCE STATUS
            // ------------------------------------------
            const {
                status: derivedStatus,
                allowed,
            } = calculateClockInStatus(now);

            // ------------------------------------------
            // ATTENDANCE TIME CLOSED / NOT ALLOWED
            // ------------------------------------------
            if (!allowed) {

                const message =
                    "Attendance clock-in is no longer available at this time.";

                // Record pupil as Absent
                await setDoc(attendanceRef, {
                    studentID: pupilData.studentID,
                    studentName: pupilData.studentName,
                    class: pupilData.class || "",
                    academicYear: pupilData.academicYear || "",
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    schoolId: currentSchoolId,
                    date: todayStr,

                    clockInTime: null,
                    clockOutTime: null,

                    status: "Absent",

                    note: message,

                    // ==========================================
                    // PERSON WHO RECORDED/ATTEMPTED ATTENDANCE
                    // ==========================================
                    loggedById: loggedInUser.id,
                    loggedByName: loggedInUser.name,
                    loggedByRole: loggedInUser.role,

                    createdAt: serverTimestamp(),
                });

                setScanResult({
                    name: pupilData.studentName,
                    action: "Clock In Blocked",
                    time: "--",
                    clockOutTime: "--",
                    status: "Absent",
                    studentID: pupilData.studentID,
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    loggedByName: loggedInUser.name,
                    loggedByRole: loggedInUser.role,

                    isError: true,
                });

                toast.error(
                    `❌ ${pupilData.studentName} marked ABSENT. ${message}`
                );

                return;
            }

            // ------------------------------------------
            // SUCCESSFUL CLOCK IN
            // ------------------------------------------
            await setDoc(attendanceRef, {
                studentID: pupilData.studentID,
                studentName: pupilData.studentName,
                class: pupilData.class || "",
                academicYear: pupilData.academicYear || "",
                userPhotoUrl: pupilData.userPhotoUrl || "",

                schoolId: currentSchoolId,
                date: todayStr,

                clockInTime: nowTime,
                clockOutTime: null,

                status: derivedStatus,

                // ==========================================
                // PERSON WHO CLOCKED IN THE PUPIL
                // ==========================================
                loggedById: loggedInUser.id,
                loggedByName: loggedInUser.name,
                loggedByRole: loggedInUser.role,

                createdAt: serverTimestamp(),
            });

            setScanResult({
                name: pupilData.studentName,
                action: `Clocked IN (${derivedStatus})`,
                time: nowTime,
                clockOutTime: "--",
                status: derivedStatus,
                studentID: pupilData.studentID,
                userPhotoUrl: pupilData.userPhotoUrl || "",

                loggedByName: loggedInUser.name,
                loggedByRole: loggedInUser.role,

                isError: false,
            });

            if (derivedStatus === "Late") {
                toast.warn(
                    `⚠️ Clocked IN LATE: ${pupilData.studentName} at ${nowTime}`
                );
            } else {
                toast.success(
                    `✅ Clocked IN: ${pupilData.studentName} at ${nowTime}`
                );
            }
        }

        // ==========================================
        // CLOCK OUT
        // ==========================================
        else if (mode === "clockOut") {

            // ------------------------------------------
            // NO CLOCK-IN RECORD
            // ------------------------------------------
            if (!attSnap.exists()) {
                toast.error(
                    `⚠️ ${pupilData.studentName} has no clock-in record for today.`
                );

                setScanResult({
                    name: pupilData.studentName,
                    action: "Clock Out Blocked (No Clock In)",
                    time: "--",
                    clockOutTime: "--",
                    status: "N/A",
                    studentID: pupilData.studentID,
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    loggedByName: loggedInUser.name,
                    loggedByRole: loggedInUser.role,

                    isError: true,
                });

                return;
            }

            const existingLogData = attSnap.data();

            // ------------------------------------------
            // CHECK STATUS
            // ------------------------------------------
            if (
                ["Excuse", "Leave", "Absent"].includes(
                    existingLogData.status
                )
            ) {
                toast.error(
                    `❌ Clock Out Blocked: Record locked as '${existingLogData.status}'.`
                );

                setScanResult({
                    name: pupilData.studentName,
                    action: `Clock Out Blocked (${existingLogData.status})`,
                    time: "--",
                    clockOutTime: "--",
                    status: existingLogData.status,
                    studentID: pupilData.studentID,
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    loggedByName: loggedInUser.name,
                    loggedByRole: loggedInUser.role,

                    isError: true,
                });

                return;
            }

            // ------------------------------------------
            // ALREADY CLOCKED OUT
            // ------------------------------------------
            if (existingLogData.clockOutTime) {
                toast.info(
                    `${pupilData.studentName} already clocked out at ${existingLogData.clockOutTime}.`
                );

                setScanResult({
                    name: pupilData.studentName,
                    action: "Already Clocked Out",
                    time: existingLogData.clockInTime || "--",
                    clockOutTime: existingLogData.clockOutTime,
                    status: existingLogData.status,
                    studentID: pupilData.studentID,
                    userPhotoUrl: pupilData.userPhotoUrl || "",

                    loggedByName: existingLogData.loggedByName || loggedInUser.name,
                    loggedByRole: existingLogData.loggedByRole || loggedInUser.role,

                    isError: true,
                });

                return;
            }

            // ------------------------------------------
            // UPDATE CLOCK-OUT TIME
            // ------------------------------------------
            await updateDoc(attendanceRef, {
                clockOutTime: nowTime,
                updatedAt: serverTimestamp(),

                // Person who performed clock-out
                clockOutById: loggedInUser.id,
                clockOutByName: loggedInUser.name,
                clockOutByRole: loggedInUser.role,
            });

            setScanResult({
                name: pupilData.studentName,
                action: "Clocked OUT Successfully",
                time: existingLogData.clockInTime || "--",
                clockOutTime: nowTime,
                status: existingLogData.status || "Present",
                studentID: pupilData.studentID,
                userPhotoUrl: pupilData.userPhotoUrl || "",

                loggedByName: existingLogData.loggedByName || loggedInUser.name,
                loggedByRole: existingLogData.loggedByRole || loggedInUser.role,

                isError: false,
            });

            toast.info(
                `🚪 Clocked OUT: ${pupilData.studentName} at ${nowTime}`
            );
        }
    };

    // Dropdown selection listener
    const handlePupilSelect = (e) => {
        const selectedId = e.target.value;
        setManualStudentID(selectedId);

        const foundPupil = pupilsList.find((p) => p.studentID === selectedId);
        if (foundPupil) {
            setSelectedPupilName(foundPupil.studentName);
        } else {
            setSelectedPupilName("");
        }
    };

    // Manual Status Override Submission
    const handleManualStatusSubmit = async (e) => {
        e.preventDefault();
        // Get currently logged-in admin/teacher
        const loggedInUser = getLoggedInUser();

        if (!manualStudentID.trim()) {
            alert("Please select a pupil from the list.");
            return;
        }

        setManualSubmitting(true);

        try {
            const todayStr = getLocalDateString();

            // 1. Fetch Pupil Details
            const pupilQ = query(
                collection(db, "PupilsReg"),
                where("studentID", "==", manualStudentID.trim()),
                where("schoolId", "==", currentSchoolId)
            );
            const pupilSnap = await getDocs(pupilQ);

            if (pupilSnap.empty) {
                alert(`Pupil ID ${manualStudentID} not found.`);
                return;
            }

            const pupilData = pupilSnap.docs[0].data();

            // 2. Reference Deterministic Document ID
            const attendanceId = `${currentSchoolId}_${manualStudentID.trim()}_${todayStr}`;
            const attendanceRef = doc(db, "AttendanceLogs", attendanceId);
            const attSnap = await getDoc(attendanceRef);

            if (attSnap.exists()) {
                const existing = attSnap.data();
                toast.error(`❌ Action Blocked: An attendance record (${existing.status}) already exists for ${pupilData.studentName} today.`);
                setManualStudentID("");
                setSelectedPupilName("");
                setManualNote("");
                return;
            }

            // 3. Create Override Record with setDoc using deterministic key
            await setDoc(attendanceRef, {
                studentID: pupilData.studentID,
                studentName: pupilData.studentName,
                class: pupilData.class || "",
                academicYear: pupilData.academicYear || "",
                userPhotoUrl: pupilData.userPhotoUrl || "",
                schoolId: currentSchoolId,
                date: todayStr,
                clockInTime: null,
                clockOutTime: null,
                status: manualStatus,
                note: manualNote.trim() || `Manually recorded as ${manualStatus}`,
                loggedById: loggedInUser.id,
                loggedByName: loggedInUser.name,
                loggedByRole: loggedInUser.role,
                createdAt: serverTimestamp(),
            });

            toast.success(`✅ Recorded: ${pupilData.studentName} as ${manualStatus.toUpperCase()}`);

            setManualStudentID("");
            setSelectedPupilName("");
            setManualNote("");
        } catch (error) {
            console.error("Error submitting manual status:", error);
            toast.error("Failed to log manual status.");
        } finally {
            setManualSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">

                {/* Header Switcher Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab("scanner")}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === "scanner"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        📷 QR Scanner Mode
                    </button>
                    <button
                        onClick={() => setActiveTab("manual")}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === "manual"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        📝 Manual Override
                    </button>
                </div>

                {/* TAB 1: QR SCANNER VIEW */}
                {activeTab === "scanner" && (
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-4">Select mode and scan student QR code</p>

                        {/* Scan Mode Radio Buttons */}
                        <div className="flex justify-center space-x-3 mb-6 bg-gray-100 p-2 rounded-xl border border-gray-200">
                            <label
                                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg font-bold text-sm cursor-pointer transition ${scanMode === "clockIn"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="scanMode"
                                    value="clockIn"
                                    checked={scanMode === "clockIn"}
                                    onChange={() => setScanMode("clockIn")}
                                    className="hidden"
                                />
                                <span>📥 Clock IN</span>
                            </label>

                            <label
                                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg font-bold text-sm cursor-pointer transition ${scanMode === "clockOut"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="scanMode"
                                    value="clockOut"
                                    checked={scanMode === "clockOut"}
                                    onChange={() => setScanMode("clockOut")}
                                    className="hidden"
                                />
                                <span>📤 Clock OUT</span>

                            </label>
                        </div>

                        {/* Scanner Reader Mount point */}
                        <div id="reader" className="w-full rounded-lg overflow-hidden mb-6"></div>

                        {/* Scan Result Popup / Display */}
                        {scanResult && (
                            <div
                                className={`p-4 rounded-xl text-left space-y-3 border ${scanResult.isError
                                    ? "bg-amber-50 border-amber-300"
                                    : "bg-indigo-50 border-indigo-200"
                                    }`}
                            >
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wider ${scanResult.isError ? "text-amber-700" : "text-indigo-600"
                                            }`}
                                    >
                                        {scanResult.isError ? "Scan Warning" : "Scan Result"}
                                    </span>
                                    <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border text-gray-600">
                                        ID: {scanResult.studentID}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <img
                                        src={scanResult.userPhotoUrl || "https://via.placeholder.com/60"}
                                        alt={scanResult.name}
                                        className="w-14 h-14 rounded-lg object-cover border border-gray-300"
                                    />
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800">{scanResult.name}</h3>
                                        <p className="text-xs text-gray-600">
                                            Action: <span className="font-semibold text-gray-900">{scanResult.action}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-sm space-y-1 text-gray-700 pt-1 border-t">
                                    <p>
                                        Status:{" "}
                                        <span
                                            className={`font-semibold px-2 py-0.5 rounded text-xs ${scanResult.status === "Present"
                                                ? "bg-green-100 text-green-800"
                                                : scanResult.status === "Late"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : scanResult.status === "Excuse" || scanResult.status === "Leave"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {scanResult.status}
                                        </span>
                                    </p>
                                    <p>Clock In: <span className="font-semibold text-green-700">{scanResult.time}</span></p>
                                    <p>Clock Out: <span className="font-semibold text-blue-700">{scanResult.clockOutTime}</span></p>
                                    <p>
                                        Recorded By:{" "}
                                        <span className="font-semibold text-indigo-700">
                                            {scanResult.loggedByName || "--"}
                                        </span>
                                    </p>

                                    <p>
                                        Role:{" "}
                                        <span className="font-semibold text-gray-700 capitalize">
                                            {scanResult.loggedByRole || "--"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MANUAL OVERRIDE FORM */}
                {activeTab === "manual" && (
                    <form onSubmit={handleManualStatusSubmit} className="space-y-4">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Manual Attendance Override</h3>
                            <p className="text-xs text-gray-500">Record leaves, excuses, or official absences manually.</p>
                        </div>

                        {/* Student Dropdown Select */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                Select Student
                            </label>
                            <select
                                value={manualStudentID}
                                onChange={handlePupilSelect}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                required
                                disabled={loadingPupils}
                            >
                                <option value="">
                                    {loadingPupils ? "Loading students..." : "-- Select Student --"}
                                </option>
                                {pupilsList.map((p) => (
                                    <option key={p.id || p.studentID} value={p.studentID}>
                                        {p.studentName} ({p.studentID})
                                    </option>
                                ))}
                            </select>

                            {selectedPupilName && (
                                <p className="text-xs font-semibold text-indigo-600 mt-1">
                                    ✓ Selected: {selectedPupilName} (ID: {manualStudentID})
                                </p>
                            )}
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Override Status</label>
                            <select
                                value={manualStatus}
                                onChange={(e) => setManualStatus(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="Excuse">Excuse (Permission Granted)</option>
                                <option value="Leave">On Leave (Medical / Sick)</option>
                                <option value="Present">Present (No Id Card)</option>
                                <option value="Absent">Absent (Unexcused)</option>
                            </select>
                        </div>

                        {/* Reason Note */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason / Notes</label>
                            <textarea
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                rows={3}
                                placeholder="Add optional details..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={manualSubmitting}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {manualSubmitting ? "Saving..." : "Submit Manual Record"}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default AttendanceScannerAdmin;