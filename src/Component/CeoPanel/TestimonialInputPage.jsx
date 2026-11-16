import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-toastify';
import { handlePrintPreviewTestimonial } from './handlePrintPreviewTestimonial';

// --- Cloudinary Config ---
const CLOUD_NAME = "dxcrlpike";
const UPLOAD_PRESET = "LeoTechSl Projects";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const TestimonialInputPage = () => {
    const location = useLocation();

    // 🏫 Retrieve school details from navigation state or fallback to localStorage session
    const savedUser = JSON.parse(localStorage.getItem("schoolUser")) || {};
    const currentSchoolId = location.state?.schoolId || savedUser.schoolId || "N/A";

    // Predefined Subject Combinations
    const SUBJECT_PRESETS = [
        { label: "Commercial / General Combo", subjects: "Mathematics, English Language, Financial Accounting, Prin. of Cost Accounting, Biology, Business Management, Health Science, Commerce & Economics" },
        { label: "Science Combo", subjects: "Economics, Mathematics, English Language, Physics, Chemistry, Science Core, Biology, Further Mathematics, Agricultural Science" },
        { label: "Arts / Humanities Combo", subjects: "Economics, Mathematics, English Language, Government, History, Biology, Lit-in-English, Agricultural Science" }
    ];

    const EMPTY_DOTS = "........................................................................................................................";

    const BASE_TESTIMONIAL_DATA = {
        candidateName: "",
        candidateNumber: "", // Admission No
        yearOfAdmission: "",
        dateOfBirth: "",
        sex: "",
        address: "",
        formCompleted: "SSS 4",
        placeOfBirth: "",
        nationality: "Sierra Leonean",
        subjectsOffered: SUBJECT_PRESETS[0].subjects,
        conduct: EMPTY_DOTS,
        principalRemarks: `${EMPTY_DOTS}\n${EMPTY_DOTS}\n${EMPTY_DOTS}\n${EMPTY_DOTS}\n${EMPTY_DOTS}`,
        dateIssued: new Date().toISOString().slice(0, 10),
        schoolName: location.state?.schoolName || savedUser.schoolName || "ZADET PREPARATORY & INTERNATIONAL SECONDARY SCHOOL",
        schoolAddress: location.state?.schoolAddress || savedUser.schoolAddress || "30 Parsonage Street Kissy Freetown",
        schoolTel: location.state?.schoolContact || savedUser.schoolContact || "Tel +23276 619002 / +23276817801",
        schoolMotto: location.state?.schoolMotto || savedUser.schoolMotto || "Striving for Excellence — Knowledge • Discipline • Character • Global Future",
        schoolLogoUrl: location.state?.schoolLogoUrl || savedUser.schoolLogoUrl || "images/Zadet.jpg",
        pupilImgUrl: "",
        pupilPublicId: null,
    };

    const getInitialData = () => ({
        ...BASE_TESTIMONIAL_DATA,
        schoolId: currentSchoolId,
    });

    const [formData, setFormData] = useState(getInitialData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectPresetChange = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            setFormData(prev => ({ ...prev, subjectsOffered: selectedValue }));
        }
    };

    const handleUploadSuccess = (url, publicId) => {
        setFormData((prev) => ({
            ...prev,
            pupilImgUrl: url,
            pupilPublicId: publicId,
        }));
        toast.success("Photo uploaded successfully!");
    };

    const handleCameraCapture = async (base64Data) => {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const res = await fetch(base64Data);
            const blob = await res.blob();
            if (blob.size > MAX_FILE_SIZE) {
                toast.error("Image too large (Max 5MB)");
                setIsUploading(false);
                return;
            }

            const formDataObj = new FormData();
            formDataObj.append("file", blob);
            formDataObj.append("upload_preset", UPLOAD_PRESET);
            formDataObj.append("folder", "SchoolApp/Testimonials");

            const resUpload = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: "POST", body: formDataObj }
            );

            const data = await resUpload.json();
            handleUploadSuccess(data.secure_url, data.public_id);
        } catch (err) {
            console.error("Camera upload failed:", err);
            toast.error("Failed to upload image.");
        } finally {
            setIsUploading(false);
            setShowCamera(false);
        }
    };

    useEffect(() => {
        if (currentSchoolId === "N/A") {
            setLoadingRecords(false);
            return;
        }

        const q = query(
            collection(schooldb, "School_Testimonials"),
            where("schoolId", "==", currentSchoolId),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecords = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestimonials(fetchedRecords);
            setLoadingRecords(false);
        }, (error) => {
            console.error("Error fetching testimonials:", error);
            setLoadingRecords(false);
            toast.error("Failed to load testimonials.");
        });

        return () => unsubscribe();
    }, [currentSchoolId]);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!formData.candidateName || !formData.candidateNumber) {
            toast.error("Please fill in Student Name and Admission Number.");
            return;
        }

        if (editingId) {
            handleUpdateFirebase(formData);
        } else {
            handleSubmitToFirebase(formData);
        }
    };

    const handleSubmitToFirebase = async (dataToSubmit) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(schooldb, "School_Testimonials"), {
                ...dataToSubmit,
                schoolId: currentSchoolId,
                submittedAt: serverTimestamp(),
            });
            toast.success(`✅ Testimonial for ${dataToSubmit.candidateName} saved successfully!`);
            setFormData(getInitialData());
        } catch (error) {
            console.error("Error submitting testimonial: ", error);
            toast.error("❌ Failed to save Testimonial.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRecord = (record) => {
        setFormData(record);
        setEditingId(record.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info(`Editing testimonial for ${record.candidateName}.`);
    };

    const handleUpdateFirebase = async (dataToUpdate) => {
        if (!editingId) return;
        setIsSubmitting(true);
        try {
            const docRef = doc(schooldb, "School_Testimonials", editingId);
            const { id, ...rest } = dataToUpdate;
            const cleanedData = Object.fromEntries(
                Object.entries({
                    ...rest,
                    schoolId: currentSchoolId,
                    updatedAt: serverTimestamp(),
                }).filter(([_, value]) => value !== undefined)
            );

            await updateDoc(docRef, cleanedData);
            toast.success(`🎉 Testimonial for ${dataToUpdate.candidateName} updated successfully!`);
            handleCancelEdit();
        } catch (error) {
            console.error("Error updating testimonial:", error);
            toast.error("Failed to update testimonial.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRecord = async (id, candidateName) => {
        if (!window.confirm(`⚠️ Are you sure you want to delete the testimonial for ${candidateName}?`)) return;
        try {
            await deleteDoc(doc(schooldb, "School_Testimonials", id));
            toast.success(`🗑️ Testimonial for ${candidateName} deleted successfully!`);
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            toast.error("Failed to delete testimonial.");
        }
    };

    const handleCancelEdit = () => {
        setFormData(getInitialData());
        setEditingId(null);
        toast.info("Editing cancelled. Form reset.");
    };

    return (
        <div className="max-w-4xl mx-auto my-10 p-4">
            <h1 className="text-center text-xl font-bold mb-4 text-gray-700">
                School ID: <span className="text-indigo-600">{currentSchoolId}</span>
            </h1>

            <div className="w-full">
                <form
                    className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200"
                    onSubmit={handleFormSubmit}
                >
                    <h2 className="text-3xl font-bold text-center mb-2 text-indigo-700">
                        {editingId ? '✏️ Edit School Leaving Testimonial' : '🎓 School Leaving Testimonial Data Input'}
                    </h2>
                    <p className="text-center text-xs text-gray-500 mb-8 uppercase tracking-wider font-semibold">Official Student Character & Academic Record</p>

                    {/* STUDENT DETAILS */}
                    <h3 className="text-xl font-semibold mt-4 mb-3 border-b pb-2 text-gray-700">Student Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block mb-1 font-medium text-sm">Student Name *</label>
                            <input
                                type="text"
                                name="candidateName"
                                value={formData.candidateName}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="Full Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Admission Number / ID *</label>
                            <input
                                type="text"
                                name="candidateNumber"
                                value={formData.candidateNumber}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="e.g. ZDT/2022/045"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block mb-1 font-medium text-sm">Year of Admission</label>
                            <input
                                type="text"
                                name="yearOfAdmission"
                                value={formData.yearOfAdmission}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="e.g., 2020"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Date of Birth</label>
                            <input
                                type="text"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="e.g., 12 September 2008"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Sex</label>
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500 bg-white"
                            >
                                <option value="">Select Sex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block mb-1 font-medium text-sm">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="Home Address"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Form Completed</label>
                            <input
                                type="text"
                                name="formCompleted"
                                value={formData.formCompleted}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="e.g. SSS 3"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Place of Birth</label>
                            <input
                                type="text"
                                name="placeOfBirth"
                                value={formData.placeOfBirth}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                placeholder="Town / City"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block mb-1 font-medium text-sm">Nationality</label>
                            <input
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm">Date Issued</label>
                            <input
                                type="date"
                                name="dateIssued"
                                value={formData.dateIssued}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* PHOTO UPLOAD */}
                    <div className="mb-6">
                        <label className="block mb-1 font-medium text-sm">Student Photo</label>
                        <div className="flex items-center space-x-4">
                            <div className="border-2 border-dashed w-20 h-24 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                {formData.pupilImgUrl ? (
                                    <img src={formData.pupilImgUrl} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400">Photo</span>
                                )}
                            </div>
                            <div className="flex flex-col w-full space-y-2">
                                <CloudinaryImageUploader
                                    onUploadSuccess={handleUploadSuccess}
                                    onUploadStart={() => { setIsUploading(true); setUploadProgress(0); }}
                                    onUploadProgress={setUploadProgress}
                                    onUploadComplete={() => setIsUploading(false)}
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
                                <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>

                    {/* ACADEMIC & CONDUCT DETAILS */}
                    <h3 className="text-xl font-semibold mt-8 mb-3 border-b pb-2 text-gray-700">Academic Records & Conduct</h3>
                    
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="font-medium text-sm">Subjects Offered</label>
                            <select
                                onChange={handleSubjectPresetChange}
                                className="text-xs p-1 border rounded bg-indigo-50 text-indigo-700 font-semibold cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>📌 Select Subject Preset Combo...</option>
                                {SUBJECT_PRESETS.map((preset, idx) => (
                                    <option key={idx} value={preset.subjects}>{preset.label}</option>
                                ))}
                            </select>
                        </div>
                        <textarea
                            name="subjectsOffered"
                            value={formData.subjectsOffered}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full p-2 border rounded-lg focus:ring-blue-500 text-sm"
                        ></textarea>
                    </div>

                  {/* CONDUCT */}
<div className="mb-6">
    <label className="block mb-2 font-medium text-sm">
        Conduct
    </label>

    <div className="border-b border-dotted border-gray-700 w-full h-9"></div>
</div>

{/* PRINCIPAL'S REMARKS */}
<div className="mb-8">
    <label className="block mb-3 font-medium text-sm">
        Principal’s Remarks & Recommendation (5 Dotted Lines)
    </label>

    <div className="border rounded-lg p-5 bg-white space-y-7">
        {[1, 2, 3, 4].map((line) => (
            <div
                key={line}
                className="w-full h-8 border-b border-dotted border-gray-700"
            />
        ))}
    </div>
</div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                editingId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {isSubmitting ? 'Processing...' : isUploading ? 'Uploading Photo...' : editingId ? '✏️ Update Testimonial' : '🚀 Save Testimonial to Database'}
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

            {showCamera && (
                <CameraCapture
                    setPhoto={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                    initialFacingMode="user"
                />
            )}

            {/* SAVED TESTIMONIALS LIST */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4 text-indigo-700">Saved Testimonials for {currentSchoolId} 🎓</h2>

                {loadingRecords ? (
                    <p>Loading testimonials...</p>
                ) : testimonials.length === 0 ? (
                    <p>No testimonials created yet for this school.</p>
                ) : (
                    <div className="overflow-x-auto shadow-xl rounded-lg bg-white">
                        <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                            <thead className="bg-indigo-100">
                                <tr>
                                    <th className="border p-3 text-left text-sm font-bold text-indigo-700">Student Name</th>
                                    <th className="border p-3 text-left text-sm font-bold text-indigo-700">Admission No.</th>
                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">Form</th>
                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">Print Preview</th>
                                    <th className="border p-3 text-center text-sm font-bold text-indigo-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testimonials.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="border p-3 text-sm">{record.candidateName}</td>
                                        <td className="border p-3 text-sm">{record.candidateNumber}</td>
                                        <td className="border p-3 text-sm text-center">{record.formCompleted}</td>
                                        <td className="border p-3 text-center">
                                            <button
                                                onClick={() => handlePrintPreviewTestimonial(record)}
                                                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs font-semibold shadow transition"
                                            >
                                                🖨️ Print Testimonial
                                            </button>
                                        </td>
                                        <td className="border p-3 flex space-x-2 justify-center">
                                            <button
                                                onClick={() => handleEditRecord(record)}
                                                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs transition"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRecord(record.id, record.candidateName)}
                                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs transition"
                                            >
                                                🗑️ Delete
                                            </button>
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

export default TestimonialInputPage;