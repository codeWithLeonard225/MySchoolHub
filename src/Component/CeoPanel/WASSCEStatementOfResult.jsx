
import React, { useState, useCallback, useEffect } from "react";
import { schooldb } from "../Database/SchoolsResults";
import {
    collection,
    doc,
    serverTimestamp,
    onSnapshot,
    query,
    updateDoc,
    deleteDoc,
    where,
    addDoc,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";
import CloudinaryImageUploader from "../CaptureCamera/CloudinaryImageUploader";
import CameraCapture from "../CaptureCamera/CameraCapture";
import { toast } from "react-toastify";
import { handlePrintPreviewSlip } from "./handlePrintPreviewSlip";

// --- Cloudinary Config ---
const CLOUD_NAME = "dxcrlpike";
const UPLOAD_PRESET = "LeoTechSl Projects";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ============================================================
// WASSCE GRADE INTERPRETATION
// ============================================================
const getWassceInterpretation = (grade) => {
    const cleanGrade = (grade || "").trim().toUpperCase();

    if (!cleanGrade) return "";

    switch (cleanGrade) {
        case "A1":
            return "Excellent";
        case "B2":
            return "Very Good";
        case "B3":
            return "Good";
        case "C4":
        case "C5":
        case "C6":
            return "Credit";
        case "D7":
        case "E8":
            return "Pass";
        case "F9":
            return "Fail";
        default:
            return "Invalid Grade";
    }
};

// ============================================================
// COUNT SUBJECTS WITH GRADES
// ============================================================
const calculateWassceSummary = (currentFormData) => {
    let subjectsCount = 0;

    const checkSubjectGroup = (group = {}) => {
        for (const key in group) {
            const grade = (group[key]?.grade || "").trim().toUpperCase();

            if (grade !== "") {
                subjectsCount++;
            }
        }
    };

    checkSubjectGroup(currentFormData.core);
    checkSubjectGroup(currentFormData.electives);

    return {
        subjectsListed:
            subjectsCount > 0 ? subjectsCount.toString() : "",
    };
};

// ============================================================
// SUBJECT INPUT ROW
// IMPORTANT: Keep this component OUTSIDE the main component.
// This prevents the grade input from losing focus after typing.
// ============================================================
const SubjectInputRow = React.memo(function SubjectInputRow({
    subjectName,
    section,
    subjectKey,
    formData,
    handleSubjectChange,
}) {
    const resultItem = formData[section]?.[subjectKey] || {
        grade: "",
        interpretation: "",
    };

    return (
        <div className="flex justify-between border-b border-gray-300 py-1.5 items-center">
            <span className="w-1/2 font-medium text-sm">
                {subjectName}
            </span>

            <input
                type="text"
                value={resultItem.grade}
                onChange={(e) =>
                    handleSubjectChange(
                        section,
                        subjectKey,
                        e.target.value
                    )
                }
                className="w-1/4 text-center border-l border-r border-gray-300 p-1 text-sm uppercase focus:ring-blue-500 focus:border-blue-500 rounded"
                placeholder="e.g. A1"
                maxLength={3}
                autoComplete="off"
                spellCheck={false}
            />

            <input
                type="text"
                value={resultItem.interpretation}
                readOnly
                className="w-1/4 text-center p-1 text-sm bg-gray-100 text-gray-700 rounded"
                placeholder="Interpretation"
                tabIndex={-1}
            />
        </div>
    );
});

// ============================================================
// MAIN COMPONENT
// ============================================================
const WASSCEStatementOfResult = () => {
    const location = useLocation();

    // Retrieve school details from navigation state or localStorage
    const savedUser =
        JSON.parse(localStorage.getItem("schoolUser") || "{}") || {};

    const currentSchoolId =
        location.state?.schoolId || savedUser.schoolId || "N/A";

    // School information
    const BASE_RESULT_DATA = {
        candidateName: "",
        candidateNumber: "",
        dateOfBirth: "",
        dateOfExam: "WASSCE for School Candidates 2026",

        schoolName:
            location.state?.schoolName ||
            savedUser.schoolName ||
            "ZADET PREPARATORY & INTERNATIONAL SECONDARY SCHOOL",

        schoolAddress:
            location.state?.schoolAddress ||
            savedUser.schoolAddress ||
            "30 Parsonage Street Kissy Freetown",

        schoolTel:
            location.state?.schoolContact ||
            savedUser.schoolContact ||
            "Tel +23276 619002 / +23276817801",

        schoolMotto:
            location.state?.schoolMotto ||
            savedUser.schoolMotto ||
            "Striving for Excellence — Knowledge • Discipline • Character • Global Future",

        schoolLogoUrl:
            location.state?.schoolLogoUrl ||
            savedUser.schoolLogoUrl ||
            "images/Zadet.jpg",

        pupilImgUrl: "",
        pupilPublicId: null,

     core: {
    englishLanguage: {
        grade: "",
        interpretation: "",
    },
    mathematics: {
        grade: "",
        interpretation: "",
    },
},

electives: {
    // Commercial subjects
    financialAccounting: {
        grade: "",
        interpretation: "",
    },
    principlesOfCostAccounting: {
        grade: "",
        interpretation: "",
    },
    businessManagement: {
        grade: "",
        interpretation: "",
    },
    healthScience: {
        grade: "",
        interpretation: "",
    },
    commerce: {
        grade: "",
        interpretation: "",
    },

    // Science subjects
    physics: {
        grade: "",
        interpretation: "",
    },
    chemistry: {
        grade: "",
        interpretation: "",
    },
    scienceCore: {
        grade: "",
        interpretation: "",
    },
    biology: {
        grade: "",
        interpretation: "",
    },
    furtherMathematics: {
        grade: "",
        interpretation: "",
    },
    agriculturalScience: {
        grade: "",
        interpretation: "",
    },

    // Arts subjects
    economics: {
        grade: "",
        interpretation: "",
    },
    government: {
        grade: "",
        interpretation: "",
    },
    history: {
        grade: "",
        interpretation: "",
    },
    literatureInEnglish: {
        grade: "",
        interpretation: "",
    },
    ChristianReligiousStudies: {
        grade: "",
        interpretation: "",
    },
},

        subjectsListed: "",
        cardUseDetails: "Card use 1 of 3",
    };

    const getInitialData = () => ({
        ...BASE_RESULT_DATA,
        core: { ...BASE_RESULT_DATA.core },
        electives: { ...BASE_RESULT_DATA.electives },
        schoolId: currentSchoolId,
        date: new Date().toISOString().slice(0, 10),
    });

    const [formData, setFormData] = useState(getInitialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [editingId, setEditingId] = useState(null);

    // ========================================================
    // GENERAL INPUT CHANGE
    // ========================================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ========================================================
    // GRADE INPUT CHANGE
    // ========================================================
    const handleSubjectChange = useCallback(
        (section, subjectKey, value) => {
            setFormData((prev) => {
                const upperCaseValue = value.toUpperCase();

                const newSubjectData = {
                    grade: upperCaseValue,
                    interpretation:
                        getWassceInterpretation(upperCaseValue),
                };

                const newFormData = {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [subjectKey]: newSubjectData,
                    },
                };

                const { subjectsListed } =
                    calculateWassceSummary(newFormData);

                newFormData.subjectsListed = subjectsListed;

                return newFormData;
            });
        },
        []
    );

    // ========================================================
    // PHOTO UPLOAD SUCCESS
    // ========================================================
    const handleUploadSuccess = (url, publicId) => {
        setFormData((prev) => ({
            ...prev,
            pupilImgUrl: url,
            pupilPublicId: publicId,
        }));

        toast.success("Photo uploaded successfully!");
    };

    // ========================================================
    // CAMERA PHOTO UPLOAD
    // ========================================================
    const handleCameraCapture = async (base64Data) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const res = await fetch(base64Data);
            const blob = await res.blob();

            if (blob.size > MAX_FILE_SIZE) {
                toast.error("Image too large (Max 5MB)");
                return;
            }

            const formDataObj = new FormData();

            formDataObj.append("file", blob);
            formDataObj.append("upload_preset", UPLOAD_PRESET);
            formDataObj.append(
                "folder",
                "SchoolApp/WASSCE_Candidates"
            );

            const resUpload = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formDataObj,
                }
            );

            const data = await resUpload.json();

            if (!resUpload.ok || !data.secure_url) {
                throw new Error(
                    data.error?.message || "Cloudinary upload failed"
                );
            }

            handleUploadSuccess(data.secure_url, data.public_id);
        } catch (err) {
            console.error("Camera upload failed:", err);
            toast.error("Failed to upload image.");
        } finally {
            setIsUploading(false);
            setShowCamera(false);
        }
    };

    // ========================================================
    // FETCH RESULTS FROM FIREBASE
    // ========================================================
    useEffect(() => {
        if (currentSchoolId === "N/A") {
            setLoadingResults(false);
            setResults([]);
            return;
        }

        setLoadingResults(true);

        const q = query(
            collection(schooldb, "WASSCE_Results"),
            where("schoolId", "==", currentSchoolId)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedResults = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setResults(fetchedResults);
                setLoadingResults(false);
            },
            (error) => {
                console.error(
                    "Error fetching WASSCE results:",
                    error
                );

                setLoadingResults(false);
                toast.error("Failed to load results.");
            }
        );

        return () => unsubscribe();
    }, [currentSchoolId]);

    // ========================================================
    // SUBMIT FORM
    // ========================================================
    const handleFormSubmit = (e) => {
        e.preventDefault();

        const { subjectsListed } =
            calculateWassceSummary(formData);

        const finalFormData = {
            ...formData,
            subjectsListed,
        };

        if (
            !finalFormData.candidateName?.trim() ||
            !finalFormData.candidateNumber?.trim()
        ) {
            toast.error(
                "Please fill in Candidate Name and Candidate Number."
            );
            return;
        }

        if (
            parseInt(subjectsListed, 10) === 0 ||
            isNaN(parseInt(subjectsListed, 10))
        ) {
            toast.error(
                "Please enter grades for at least one subject."
            );
            return;
        }

        if (editingId) {
            handleUpdateFirebase(finalFormData);
        } else {
            handleSubmitToFirebase(finalFormData);
        }
    };

    // ========================================================
    // SAVE NEW RESULT
    // ========================================================
    const handleSubmitToFirebase = async (dataToSubmit) => {
        setIsSubmitting(true);

        try {
            await addDoc(collection(schooldb, "WASSCE_Results"), {
                ...dataToSubmit,
                schoolId: currentSchoolId,
                submittedAt: serverTimestamp(),
            });

            toast.success(
                `WASSCE result for ${dataToSubmit.candidateName} submitted successfully!`
            );

            setFormData(getInitialData());
        } catch (error) {
            console.error(
                "Error submitting WASSCE result:",
                error
            );

            toast.error("Failed to submit WASSCE Result.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================================================
    // EDIT RESULT
    // ========================================================
    const handleEditResult = (result) => {
        setFormData({
            ...getInitialData(),
            ...result,
            core: {
                ...getInitialData().core,
                ...(result.core || {}),
            },
            electives: {
                ...getInitialData().electives,
                ...(result.electives || {}),
            },
        });

        setEditingId(result.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        toast.info(`Editing result for ${result.candidateName}.`);
    };

    // ========================================================
    // UPDATE RESULT
    // ========================================================
    const handleUpdateFirebase = async (dataToUpdate) => {
        if (!editingId) return;

        setIsSubmitting(true);

        try {
            const resultDocRef = doc(
                schooldb,
                "WASSCE_Results",
                editingId
            );

            const { id, ...rest } = dataToUpdate;

            const cleanedData = Object.fromEntries(
                Object.entries({
                    ...rest,
                    schoolId: currentSchoolId,
                    updatedAt: serverTimestamp(),
                }).filter(([_, value]) => value !== undefined)
            );

            await updateDoc(resultDocRef, cleanedData);

            toast.success(
                `WASSCE result for ${dataToUpdate.candidateName} updated successfully!`
            );

            handleCancelEdit();
        } catch (error) {
            console.error("Error updating result:", error);
            toast.error("Failed to update result.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================================================
    // DELETE RESULT
    // ========================================================
    const handleDeleteResult = async (id, candidateName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete the WASSCE result for ${candidateName}?`
            )
        ) {
            return;
        }

        try {
            await deleteDoc(
                doc(schooldb, "WASSCE_Results", id)
            );

            toast.success(
                `Result for ${candidateName} deleted successfully!`
            );
        } catch (error) {
            console.error("Error deleting result:", error);
            toast.error("Failed to delete result.");
        }
    };

    // ========================================================
    // CANCEL EDIT
    // ========================================================
    const handleCancelEdit = () => {
        setFormData(getInitialData());
        setEditingId(null);
        toast.info("Editing cancelled. Form reset.");
    };

    // ========================================================
    // SHARED SUBJECT ROW PROPS
    // ========================================================
    const subjectRowProps = {
        formData,
        handleSubjectChange,
    };

    // ========================================================
    // RENDER
    // ========================================================
    return (
        <div className="max-w-4xl mx-auto my-10 p-4">
            <h1 className="text-center text-xl font-bold mb-4 text-gray-700">
                School ID:{" "}
                <span className="text-indigo-600">
                    {currentSchoolId}
                </span>
            </h1>

            <div className="w-full">
                <form
                    className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200"
                    onSubmit={handleFormSubmit}
                >
                    <h2 className="text-3xl font-bold text-center mb-2 text-indigo-700">
                        {editingId
                            ? "✏️ Edit WASSCE Result Slip"
                            : "📝 WASSCE Result Data Input"}
                    </h2>

                    <p className="text-center text-xs text-gray-500 mb-8 uppercase tracking-wider font-semibold">
                        West African Senior School Certificate Examination
                    </p>

                    {/* CANDIDATE DETAILS */}
                    <h3 className="text-xl font-semibold mt-4 mb-3 border-b pb-2 text-gray-700">
                        Candidate's Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Candidate Name
                            </label>

                            <input
                                type="text"
                                name="candidateName"
                                value={formData.candidateName}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Candidate Number
                            </label>

                            <input
                                type="text"
                                name="candidateNumber"
                                value={formData.candidateNumber}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Date of Birth
                            </label>

                            <input
                                type="text"
                                name="dateOfBirth"
                                placeholder="e.g., 12 September 2010"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Date of Exam
                            </label>

                            <input
                                type="text"
                                name="dateOfExam"
                                value={formData.dateOfExam}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* PHOTO UPLOAD */}
                    <div className="mb-6">
                        <label className="block mb-1 font-medium text-sm">
                            Candidate Photo
                        </label>

                        <div className="flex items-center space-x-4">
                            <div className="border-2 border-dashed w-20 h-24 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                {formData.pupilImgUrl ? (
                                    <img
                                        src={formData.pupilImgUrl}
                                        alt="Candidate"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">
                                        Photo
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col w-full space-y-2">
                                <CloudinaryImageUploader
                                    onUploadSuccess={handleUploadSuccess}
                                    onUploadStart={() => {
                                        setIsUploading(true);
                                        setUploadProgress(0);
                                    }}
                                    onUploadProgress={setUploadProgress}
                                    onUploadComplete={() =>
                                        setIsUploading(false)
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="bg-indigo-500 text-white py-1.5 px-3 rounded-md text-xs font-semibold hover:bg-indigo-600 transition"
                                    disabled={isUploading}
                                >
                                    Use Camera
                                </button>
                            </div>
                        </div>

                        {isUploading && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${uploadProgress}%`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* EXAMINATION RESULTS */}
                    <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 text-gray-700">
                        Examination Results
                    </h3>

                    <div className="mb-2 text-xs flex font-bold border-b-2 pb-1 bg-gray-50 p-2 rounded-t-lg">
                        <span className="w-1/2">SUBJECT</span>
                        <span className="w-1/4 text-center">GRADE</span>
                        <span className="w-1/4 text-center">
                            INTERPRETATION
                        </span>
                    </div>

                   <h4 className="text-sm font-bold mt-4 mb-2 text-indigo-600 tracking-wide uppercase">
    Core Subjects:
</h4>

<div className="ml-2 border rounded-lg p-2 bg-white mb-4">
    <SubjectInputRow
        {...subjectRowProps}
        subjectName="English Language"
        section="core"
        subjectKey="englishLanguage"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Mathematics"
        section="core"
        subjectKey="mathematics"
    />
</div>

                    <h4 className="text-sm font-bold mt-6 mb-2 text-indigo-600 tracking-wide uppercase">
                        Elective / Other Subjects:
                    </h4>

                    <div className="ml-2 border rounded-lg p-2 bg-white">
                      <h4 className="text-sm font-bold mt-6 mb-2 text-indigo-600 tracking-wide uppercase">
    Elective / Other Subjects:
</h4>

<div className="ml-2 border rounded-lg p-2 bg-white">
    {/* COMMERCIAL SUBJECTS */}
    <p className="text-xs font-bold text-gray-500 uppercase mt-2 mb-2">
        Commercial Subjects
    </p>

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Financial Accounting"
        section="electives"
        subjectKey="financialAccounting"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Prin. of Cost Accounting"
        section="electives"
        subjectKey="principlesOfCostAccounting"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Business Management"
        section="electives"
        subjectKey="businessManagement"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Health Science"
        section="electives"
        subjectKey="healthScience"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Commerce"
        section="electives"
        subjectKey="commerce"
    />

    {/* SCIENCE SUBJECTS */}
    <p className="text-xs font-bold text-gray-500 uppercase mt-5 mb-2">
        Science Subjects
    </p>

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Physics"
        section="electives"
        subjectKey="physics"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Chemistry"
        section="electives"
        subjectKey="chemistry"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Science Core"
        section="electives"
        subjectKey="scienceCore"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Biology"
        section="electives"
        subjectKey="biology"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Further Mathematics"
        section="electives"
        subjectKey="furtherMathematics"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Agricultural Science"
        section="electives"
        subjectKey="agriculturalScience"
    />

    {/* ARTS SUBJECTS */}
    <p className="text-xs font-bold text-gray-500 uppercase mt-5 mb-2">
        Arts Subjects
    </p>

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="ChristianReligiousStudies"
        section="electives"
        subjectKey="ChristianReligiousStudies"
    />
    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Economics"
        section="electives"
        subjectKey="economics"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Government"
        section="electives"
        subjectKey="government"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="History"
        section="electives"
        subjectKey="history"
    />

    <SubjectInputRow
        {...subjectRowProps}
        subjectName="Lit-in-English"
        section="electives"
        subjectKey="literatureInEnglish"
    />
</div>
                    </div>

                    {/* ADDITIONAL INFORMATION */}
                    <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 text-gray-700">
                        Additional Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Subjects Listed
                            </label>

                            <input
                                type="text"
                                name="subjectsListed"
                                value={formData.subjectsListed}
                                readOnly
                                className="w-full p-2 border rounded-lg focus:ring-blue-500 bg-gray-100 font-bold"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-sm">
                                Card Use Details
                            </label>

                            <input
                                type="text"
                                name="cardUseDetails"
                                value={formData.cardUseDetails}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-center space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                editingId
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                        >
                            {isSubmitting
                                ? "Processing..."
                                : isUploading
                                ? "Uploading Photo..."
                                : editingId
                                ? "✏️ Update WASSCE Result"
                                : "🚀 Submit WASSCE Result to Database"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="w-1/4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition duration-200"
                            >
                                ❌ Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* CAMERA */}
            {showCamera && (
                <CameraCapture
                    setPhoto={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                    initialFacingMode="user"
                />
            )}

            {/* SUBMITTED RESULTS */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4 text-indigo-700">
                    Submitted WASSCE Results for {currentSchoolId} 📄
                </h2>

                {loadingResults ? (
                    <p>Loading results...</p>
                ) : results.length === 0 ? (
                    <p>
                        No WASSCE results submitted yet for this school.
                    </p>
                ) : (
                    <div className="overflow-x-auto shadow-xl rounded-lg bg-white">
                        <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                            <thead className="bg-indigo-100">
                                <tr>
                                    <th className="border p-3 text-left text-sm font-bold text-indigo-700">
                                        Candidate Name
                                    </th>

                                    <th className="border p-3 text-left text-sm font-bold text-indigo-700">
                                        Candidate No.
                                    </th>

                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">
                                        Subjects
                                    </th>

                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">
                                        Print Preview
                                    </th>

                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {results.map((result) => (
                                    <tr
                                        key={result.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="border p-3 text-sm">
                                            {result.candidateName}
                                        </td>

                                        <td className="border p-3 text-sm">
                                            {result.candidateNumber}
                                        </td>

                                        <td className="border p-3 text-sm font-semibold text-center text-indigo-600">
                                            {result.subjectsListed}
                                        </td>

                                        <td className="border p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePrintPreviewSlip(
                                                        result
                                                    )
                                                }
                                                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs font-semibold shadow transition"
                                            >
                                                🖨️ Print Preview
                                            </button>
                                        </td>

                                        <td className="border p-3">
                                            <div className="flex space-x-2 justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditResult(result)
                                                    }
                                                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs transition"
                                                >
                                                    ✏️ Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteResult(
                                                            result.id,
                                                            result.candidateName
                                                        )
                                                    }
                                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs transition"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WASSCEStatementOfResult;
