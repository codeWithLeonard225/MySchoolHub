import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import { FaArrowLeft, FaArrowRight, FaPrint } from "react-icons/fa";

// ---- CARD DIMENSIONS ----
const CARD_WIDTH = "3.55in";
const CARD_HEIGHT = "2.25in";
const GAP_BETWEEN_CARDS = "0.35in";
const CARDS_PER_ROW = 2;
const ROWS_PER_PAGE = 4;
const CARDS_PER_BROWSER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE;

// ---- FORMAT DATE ----
const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

// ---- TEACHER ID CARD COMPONENT ----
const TeacherIDCard = ({ teacherData, schoolInfo }) => {
    const rawTeacherId = teacherData.teacherID || "";
    const maskedTeacherId = rawTeacherId.length > 3 ? rawTeacherId.slice(0, -3) : rawTeacherId;

    const qrPayload = JSON.stringify({
        teacherID: teacherData.teacherID,
        teacherName: teacherData.teacherName,
        schoolId: teacherData.schoolId,
    });

    return (
        <div
            className="shadow-md border rounded-lg flex flex-col justify-between overflow-hidden teacher-id-card"
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                background: "white",
                boxSizing: "border-box",
            }}
        >
            {/* Header (Maroon/Yellow) */}
            <div
                className="flex items-center justify-center border-b"
                style={{
                    background: "linear-gradient(90deg, #800000, #990000)",
                    color: "yellow",
                    padding: "3px 6px",
                }}
            >
                {schoolInfo.schoolLogoUrl && (
                    <img
                        src={schoolInfo.schoolLogoUrl}
                        alt="Logo"
                        className="w-7 h-7 rounded-full border bg-white mr-2 object-cover"
                    />
                )}
                <div className="text-center truncate">
                    <h2 className="text-[9pt] font-bold leading-tight truncate">
                        {schoolInfo.schoolName || "Official Staff ID"}
                    </h2>
                    <p className="text-[7pt] italic opacity-90 -mt-[1px] truncate">
                        {schoolInfo.schoolMotto || "Staff Identification Card"}
                    </p>
                </div>
            </div>

            {/* Body - Light Yellow BG & Maroon Text */}
            <div
                className="flex gap-[6px] items-center flex-1 px-[0.1in] py-[0.05in]"
                style={{
                    background: "linear-gradient(180deg, #FFFACD, #FFF5C3)",
                    color: "#800000",
                }}
            >
                <div className="w-[0.9in] h-[1.15in] bg-gray-200 rounded-sm overflow-hidden border flex-shrink-0">
                    {teacherData.userPhotoUrl ? (
                        <img
                            src={teacherData.userPhotoUrl}
                            alt={teacherData.teacherName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[7pt] text-gray-500 text-center">
                            No Photo
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden text-[8pt] font-medium leading-[1.6]">
                    <p className="truncate">
                        <strong style={{ color: "#600000" }}>ID:</strong> {maskedTeacherId || "N/A"}
                    </p>
                    <p className="truncate">
                        <strong style={{ color: "#600000" }}>Name:</strong> {teacherData.teacherName}
                    </p>
                    <p className="truncate">
                        <strong style={{ color: "#600000" }}>Phone:</strong> {teacherData.phone || "N/A"}
                    </p>
                    <p className="truncate">
                        <strong style={{ color: "#600000" }}>Role:</strong>{" "}
                        {teacherData.isFormTeacher
                            ? `Form (${teacherData.assignClass || "N/A"})`
                            : "Staff Member"}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-white p-1 rounded border flex-shrink-0">
                    <QRCodeSVG value={qrPayload} size={54} />
                    <span className="text-[5pt] text-gray-600 mt-0.5">Scan Code</span>
                </div>
            </div>

            {/* Footer (Maroon/Yellow) */}
            <div
                className="flex justify-between items-center border-t"
                style={{
                    background: "#800000",
                    color: "yellow",
                    fontSize: "6.2pt",
                    padding: "2px 5px",
                }}
            >
                <span className="truncate max-w-[70%]">{schoolInfo.schoolAddress || `School Code: ${teacherData.schoolId}`}</span>
                <span>{schoolInfo.schoolContact || "LeoTech System"}</span>
            </div>
        </div>
    );
};

// ---- MAIN PAGE COMPONENT ----
const TeacherIDCards = () => {
    const location = useLocation();
    const {
        schoolId: passedSchoolId,
        schoolName,
        schoolLogoUrl,
        schoolAddress,
        schoolMotto,
        schoolContact,
    } = location.state || {};

    const schoolId = passedSchoolId || "N/A";
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const schoolInfo = {
        schoolName,
        schoolLogoUrl,
        schoolAddress,
        schoolMotto,
        schoolContact,
    };

    useEffect(() => {
        if (schoolId === "N/A") {
            setLoading(false);
            return;
        }

        const fetchTeachers = async () => {
            try {
                const q = query(collection(db, "Teachers"), where("schoolId", "==", schoolId));
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setTeachers(list);
            } catch (err) {
                console.error("Error fetching teachers for IDs:", err);
                toast.error("Failed to load staff list.");
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, [schoolId]);

    const totalPages = Math.ceil(teachers.length / CARDS_PER_BROWSER_PAGE) || 1;
    const startIndex = (currentPage - 1) * CARDS_PER_BROWSER_PAGE;
    const visibleTeachers = teachers.slice(startIndex, startIndex + CARDS_PER_BROWSER_PAGE);

    const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
    const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);

    if (loading) {
        return <div className="p-6 text-center font-medium">Loading ID Cards...</div>;
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen overflow-x-hidden flex flex-col items-center">
            {/* Action Bar (Hidden when printing) */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
                <h1 className="text-2xl font-bold">
                    {schoolName ? `${schoolName} - Staff ID Cards` : "Staff ID Cards & QR Codes"}
                </h1>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <FaPrint /> Print Current Page ({currentPage})
                </button>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mb-6 print:hidden">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                        <FaArrowLeft size={12} /> Previous
                    </button>
                    <span className="text-sm font-semibold">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                        Next <FaArrowRight size={12} />
                    </button>
                </div>
            )}

            {/* ID Cards Grid */}
            <div
                className="grid gap-[0.35in] justify-center w-full max-w-4xl cards-container"
                style={{
                    gridTemplateColumns: `repeat(${CARDS_PER_ROW}, ${CARD_WIDTH})`,
                }}
            >
                {visibleTeachers.length > 0 ? (
                    visibleTeachers.map((teacher) => (
                        <TeacherIDCard
                            key={teacher.id}
                            teacherData={teacher}
                            schoolInfo={schoolInfo}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        No teachers found for this school ID.
                    </div>
                )}
            </div>

            {/* PRINT CSS */}
            <style>
                {`
                    @media print {
                        /* Hide everything on the entire body by default */
                        body * {
                            visibility: hidden !important;
                        }

                        /* Only show the cards container and its children */
                        .cards-container, .cards-container * {
                            visibility: visible !important;
                        }

                        /* Pin the cards container to the top-left of the print page to eliminate extraneous "open menu" sidebars/headers */
                        .cards-container {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            margin: 0 !important;
                            width: 100% !important;
                            display: grid !important;
                            grid-template-columns: repeat(${CARDS_PER_ROW}, ${CARD_WIDTH}) !important;
                            gap: ${GAP_BETWEEN_CARDS} !important;
                            justify-content: center !important;
                        }

                        @page {
                            size: A4 portrait;
                            margin: 0.4in;
                        }

                        body {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            margin: 0 !important;
                            background: white !important;
                            overflow: visible !important;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default TeacherIDCards;