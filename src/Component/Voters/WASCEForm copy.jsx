import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { collection, addDoc,onSnapshot } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Security/AuthContext";
import imageCompression from "browser-image-compression";

// Cloudinary Constants
const CLOUD_NAME = "dxcrlpike";
const UPLOAD_PRESET = "LeoTechSl Projects";

const WasceReg = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentSchoolId = location.state?.schoolId || user?.schoolId || "N/A";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState(null); // Track which field is uploading
    const [uploadProgress, setUploadProgress] = useState(0);
    const [students, setStudents] = useState([]);

    useEffect(() => {
    const unsub = onSnapshot(
        collection(db, "WassceRegistrations"),
        (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setStudents(list);
        }
    );

    return () => unsub();
}, []);

    const [formData, setFormData] = useState({
        studentID: uuidv4().slice(0, 8),
        studentName: "",
        dob: "",
        age: "",
        gender: "",
        address: "",
        mobileNumber: "",
        previousClass: "",
        academicYear: "",
        previousSchool: "",
        beceIndexNo: "",
        aggregate: "",
        photoNo: "",
        pupilPhoto: null,
        pupilPublicId: null,
        beceResultPhoto: null,
        beceResultPublicId: null,
        schoolId: currentSchoolId,
    });

    // Handle Age Calculation
    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
        }
    }, [formData.dob]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // --- Merged Cloudinary Logic ---
    const handleFileUpload = async (e, fieldType) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            return toast.error("Please upload a JPG or PNG image.");
        }

        setUploadingField(fieldType);
        setUploadProgress(0);

        try {
            // Compress Image
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);

            // Prepare Upload
            const uploadData = new FormData();
            uploadData.append("file", compressedFile);
            uploadData.append("upload_preset", UPLOAD_PRESET);
            uploadData.append("folder", "SchoolsApp/Wassce");

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    setUploadProgress(Math.round((event.loaded * 100) / event.total));
                }
            });

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    setUploadingField(null);
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        setFormData(prev => ({
                            ...prev,
                            [fieldType === "pupil" ? "pupilPhoto" : "beceResultPhoto"]: data.secure_url,
                            [fieldType === "pupil" ? "pupilPublicId" : "beceResultPublicId"]: data.public_id
                        }));
                        toast.success("Image uploaded successfully!");
                    } else {
                        toast.error("Upload failed.");
                    }
                }
            };

            xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
            xhr.send(uploadData);

        } catch (err) {
            console.error(err);
            setUploadingField(null);
            toast.error("Error processing image.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.studentName || !formData.beceIndexNo) {
            return toast.error("Name and BECE Index are mandatory.");
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "WassceRegistrations"), {
                ...formData,
                studentName: formData.studentName.toUpperCase(),
                timestamp: new Date(),
            });
            toast.success("WASSCE Candidate Registered Successfully!");
            navigate("/wassce-list");
        } catch (err) {
            console.error(err);
            toast.error("Database connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white border-2 border-gray-800 p-6 shadow-xl">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-3xl font-black uppercase tracking-widest">WASSCE Registration Form</h1>
                    <p className="text-sm font-bold mt-1">(WEST AFRICAN SENIOR SCHOOL CERTIFICATE EXAMINATION)</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* LEFT COLUMN */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Student ID</label>
                                <input type="text" value={formData.studentID} readOnly className="bg-gray-100 p-2 border-b-2 border-black focus:outline-none" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Photo No:</label>
                                <input type="text" name="photoNo" onChange={handleInputChange} className="p-2 border-b-2 border-black outline-none" />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-xs font-bold uppercase">Full Student Name</label>
                                <input type="text" name="studentName" onChange={handleInputChange} className="p-2 border-b-2 border-black uppercase" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Date of Birth</label>
                                <input type="date" name="dob" onChange={handleInputChange} className="p-2 border-b-2 border-black" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Gender</label>
                                <select name="gender" onChange={handleInputChange} className="p-2 border-b-2 border-black bg-white">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        {/* PUPIL PHOTO PREVIEW */}
                        <div className="w-full md:w-48 flex flex-col items-center border-2 border-dashed border-gray-400 p-2 bg-gray-50">
                            <span className="text-[10px] font-bold mb-2 uppercase">Pupil's Photo</span>
                            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center border-2 border-black overflow-hidden shadow-sm relative">
                                {formData.pupilPhoto ? (
                                    <img src={formData.pupilPhoto} alt="Pupil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xs text-gray-400">No Photo</div>
                                )}
                                {uploadingField === "pupil" && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                        {uploadProgress}%
                                    </div>
                                )}
                            </div>
                            <label className="mt-3 cursor-pointer bg-black text-white px-3 py-1 text-[10px] font-bold uppercase hover:bg-gray-800">
                                {uploadingField === "pupil" ? "Uploading..." : "Select Photo"}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "pupil")} disabled={uploadingField !== null} />
                            </label>
                        </div>
                    </div>

                    <hr className="border-black" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col"><label className="text-xs font-bold">ADDRESS</label><input type="text" name="address" onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">MOBILE NUMBER</label><input type="text" name="mobileNumber" onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">PREVIOUS SCHOOL</label><input type="text" name="previousSchool" onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">ACADEMIC YEAR</label><input type="text" name="academicYear" placeholder="2025/2026" onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col bg-blue-50 p-2"><label className="text-xs font-bold text-blue-800">BECE INDEX NO:</label><input type="text" name="beceIndexNo" onChange={handleInputChange} className="p-1 border-b border-blue-800 bg-transparent outline-none" /></div>
                            <div className="flex flex-col bg-blue-50 p-2"><label className="text-xs font-bold text-blue-800">AGGREGATE</label><input type="number" name="aggregate" onChange={handleInputChange} className="p-1 border-b border-blue-800 bg-transparent outline-none" /></div>
                        </div>

                        {/* BECE RESULT PREVIEW */}
                        <div className="flex flex-col border-l-0 md:border-l-2 border-black pl-0 md:pl-6">
                            <label className="text-xs font-bold mb-2 uppercase text-center">BECE Result (A4)</label>
                            <div className="border-2 border-gray-200 p-2 h-40 flex flex-col items-center justify-center bg-gray-50 overflow-hidden shadow-inner relative">
                                {formData.beceResultPhoto ? (
                                    <img src={formData.beceResultPhoto} alt="BECE Result" className="h-full w-full object-contain" />
                                ) : (
                                    <span className="text-[10px] text-gray-400">Result Preview</span>
                                )}
                                {uploadingField === "bece" && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                        {uploadProgress}%
                                    </div>
                                )}
                            </div>
                            <label className="mt-3 cursor-pointer bg-blue-800 text-white px-3 py-1 text-center text-[10px] font-bold uppercase hover:bg-blue-900">
                                {uploadingField === "bece" ? "Uploading..." : "Upload Result Slip"}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "bece")} disabled={uploadingField !== null} />
                            </label>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button type="submit" disabled={isSubmitting || uploadingField !== null} className={`w-full py-4 text-xl font-black border-2 border-black transition-all ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-white hover:text-black"}`}>
                            {isSubmitting ? "REGISTERING CANDIDATE..." : "SUBMIT WASSCE DATA"}
                        </button>
                    </div>
                </form>
                {/* REGISTERED STUDENTS TABLE */}
<div className="max-w-5xl mx-auto mt-10 bg-white border-2 border-black p-4 shadow-lg">
    <h2 className="text-xl font-black uppercase mb-4 text-center">
        Registered WASSCE Candidates
    </h2>

    <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
            <thead className="bg-black text-white">
                <tr>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Gender</th>
                    <th className="p-2 border">BECE Index</th>
                    <th className="p-2 border">Aggregate</th>
                    <th className="p-2 border">Photo</th>
                </tr>
            </thead>

            <tbody>
                {students.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="text-center p-4">
                            No registered students yet
                        </td>
                    </tr>
                ) : (
                    students.map((stu) => (
                        <tr key={stu.id} className="border hover:bg-gray-100">
                            <td className="p-2 border">{stu.studentID}</td>
                            <td className="p-2 border font-bold">
                                {stu.studentName}
                            </td>
                            <td className="p-2 border">{stu.gender}</td>
                            <td className="p-2 border">{stu.beceIndexNo}</td>
                            <td className="p-2 border">{stu.aggregate}</td>
                            <td className="p-2 border">
                                {stu.pupilPhoto ? (
                                    <img
                                        src={stu.pupilPhoto}
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                ) : (
                                    "No Photo"
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
</div>
            </div>
        </div>
    );
};

export default WasceReg;