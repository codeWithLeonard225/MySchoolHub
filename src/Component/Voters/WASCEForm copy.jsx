import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Security/AuthContext";
import imageCompression from "browser-image-compression";
import jsPDF from "jspdf";
import "jspdf-autotable";

const CLOUD_NAME = "dxcrlpike";
const UPLOAD_PRESET = "LeoTechSl Projects";

const WasceReg = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentSchoolId = location.state?.schoolId || user?.schoolId || "N/A";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState(null); // For Modal
    const [editingId, setEditingId] = useState(null); // For Edit Mode

  

const {
    schoolName,
    schoolLogoUrl,
    schoolAddress,
    schoolMotto,
    schoolContact,
    email,
} = location.state || {};

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
        beceResultPhoto: null,
        schoolId: currentSchoolId,
    });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "WassceRegistrations"), (snapshot) => {
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
        });
        return () => unsub();
    }, []);

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

    const handleFileUpload = async (e, fieldType) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingField(fieldType);
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            const uploadData = new FormData();
            uploadData.append("file", compressedFile);
            uploadData.append("upload_preset", UPLOAD_PRESET);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: uploadData,
            });
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                [fieldType === "pupil" ? "pupilPhoto" : "beceResultPhoto"]: data.secure_url
            }));
            toast.success("Image Uploaded");
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, "WassceRegistrations", editingId), formData);
                toast.success("Record Updated!");
                setEditingId(null);
            } else {
                await addDoc(collection(db, "WassceRegistrations"), {
                    ...formData,
                    studentName: formData.studentName.toUpperCase(),
                    timestamp: new Date(),
                });
                toast.success("Registered Successfully!");
            }
            resetForm();
        } catch (err) {
            toast.error("Error saving data");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            studentID: uuidv4().slice(0, 8),
            studentName: "", dob: "", age: "", gender: "", address: "",
            mobileNumber: "", academicYear: "", previousSchool: "",
            beceIndexNo: "", aggregate: "", photoNo: "",
            pupilPhoto: null, beceResultPhoto: null, schoolId: currentSchoolId,
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this student permanently?")) {
            await deleteDoc(doc(db, "WassceRegistrations", id));
            toast.dark("Record Deleted");
        }
    };

 const handleEdit = (stu) => {
    setFormData({
        studentID: stu.studentID || "",
        studentName: stu.studentName || "",
        dob: stu.dob || "",
        age: stu.age || "",
        gender: stu.gender || "",
        address: stu.address || "",
        mobileNumber: stu.mobileNumber || "",
        previousClass: stu.previousClass || "",
        academicYear: stu.academicYear || "",
        previousSchool: stu.previousSchool || "",
        beceIndexNo: stu.beceIndexNo || "",
        aggregate: stu.aggregate || "",
        photoNo: stu.photoNo || "",
        pupilPhoto: stu.pupilPhoto || null,
        beceResultPhoto: stu.beceResultPhoto || null,
        schoolId: stu.schoolId || "",
    });

    setEditingId(stu.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
};

const generatePDF = async (stu) => {
    const doc = new jsPDF();

    // Helper to load image
    const loadImage = (url) =>
        new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

    const [logo] = await Promise.all([
        loadImage(schoolLogoUrl),
    ]);

    let y = 20;

    // ===============================
    // 🏫 SCHOOL HEADER
    // ===============================

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(schoolName || "SCHOOL NAME", 105, y, { align: "center" });

    y += 5;
    doc.setDrawColor(0);
    doc.line(20, y, 190, y);

    y += 10;

    // Logo (Left)
    if (logo) {
        doc.addImage(logo, "PNG", 20, y, 25, 25);
    }

    // School Details (Center)
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    doc.text(schoolAddress || "Address", 105, y + 5, { align: "center" });
    doc.text(schoolMotto || "Motto", 105, y + 12, { align: "center" });
    doc.text(schoolContact || "Contact", 105, y + 19, { align: "center" });

    if (email) {
        doc.text(email, 105, y + 26, { align: "center" });
    }

    y += 35;

    // ===============================
    // 📄 TITLE
    // ===============================
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("WASSCE REGISTRATION FORM", 105, y, { align: "center" });

    y += 30;

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");

    // ===============================
    // 📋 STUDENT DATA
    // ===============================
    const addLine = (label, value) => {
        doc.text(`${label}: ${value || ""}`, 20, y);
        y += 8;
    };

    addLine("Student ID", stu.studentID);
    addLine("Full Name", stu.studentName);
    addLine("Gender", stu.gender);
    addLine("DOB", stu.dob);
    addLine("Age", stu.age);
    addLine("Address", stu.address);
    addLine("Mobile", stu.mobileNumber);
    addLine("Previous School", stu.previousSchool);
    addLine("Academic Year", stu.academicYear);
    addLine("BECE Index No", stu.beceIndexNo);
    addLine("Aggregate", stu.aggregate);
    addLine("Photo No", stu.photoNo);

    // ===============================
    // 🖼 IMAGES
    // ===============================

   const imageY = y - 100; // align with top of student info

if (stu.pupilPhoto) {
    doc.addImage(stu.pupilPhoto, "JPEG", 140, imageY, 50, 50);
}

if (stu.beceResultPhoto) {
    doc.addImage(stu.beceResultPhoto, "JPEG", 140, imageY + 60, 50, 60);
}

    // ===============================
    // 💾 SAVE
    // ===============================
    doc.save(`${stu.studentName}_WASSCE_FORM.pdf`);
};

    const filteredStudents = students.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.beceIndexNo.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white border-2 border-gray-800 p-6 shadow-xl">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-3xl font-black uppercase tracking-widest">WASSCE Registration Form</h1>
                    <p className="text-sm font-bold mt-1">(WEST AFRICAN SENIOR SCHOOL CERTIFICATE EXAMINATION)</p>
                </div>
                {selectedImage && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                        <img src={selectedImage} className="max-w-full max-h-full border-4 border-white" alt="Preview" />
                    </div>
                )}

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
                                <input type="text" name="photoNo" value={formData.photoNo} onChange={handleInputChange} className="p-2 border-b-2 border-black outline-none" />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-xs font-bold uppercase">Full Student Name</label>
                                <input type="text" name="studentName"value={formData.studentName} onChange={handleInputChange} className="p-2 border-b-2 border-black uppercase" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Date of Birth</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="p-2 border-b-2 border-black" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold uppercase">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className="p-2 border-b-2 border-black bg-white">
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
                            <div className="flex flex-col"><label className="text-xs font-bold">ADDRESS</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">MOBILE NUMBER</label><input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">PREVIOUS SCHOOL</label><input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">ACADEMIC YEAR</label><input type="text" name="academicYear" placeholder="2025/2026" value={formData.academicYear} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col bg-blue-50 p-2"><label className="text-xs font-bold text-blue-800">BECE INDEX NO:</label><input type="text" name="beceIndexNo" value={formData.beceIndexNo} onChange={handleInputChange} className="p-1 border-b border-blue-800 bg-transparent outline-none" /></div>
                            <div className="flex flex-col bg-blue-50 p-2"><label className="text-xs font-bold text-blue-800">AGGREGATE</label><input type="number" name="aggregate" value={formData.aggregate} onChange={handleInputChange} className="p-1 border-b border-blue-800 bg-transparent outline-none" /></div>
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
                       <button type="submit" className="w-full bg-black text-white p-3 font-bold">
                        {editingId ? "UPDATE RECORD" : "REGISTER STUDENT"}
                    </button>
                    {editingId && <button onClick={() => {setEditingId(null); resetForm();}} className="w-full bg-red-600 text-white p-2 mt-2">CANCEL EDIT</button>}
                    </div>
                </form>

                {/* REGISTERED STUDENTS TABLE */}
                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                        <h2 className="font-black uppercase">Registered Candidates</h2>
                        <input 
                            type="text" 
                            placeholder="🔍 Search Name or Index..." 
                            className="p-2 border-2 border-black w-full md:w-64"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border border-black">
                            <thead className="bg-black text-white text-xs">
                                <tr>
                                    <th className="p-2 border">ID</th>
                                    <th className="p-2 border">Photo</th>
                                    <th className="p-2 border">Name</th>
                                    <th className="p-2 border">Index</th>
                                    <th className="p-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((stu) => (
                                    <tr key={stu.id} className="text-sm border-b border-black hover:bg-gray-50">
                                        <td className="p-2 border">{stu.studentID}</td>
                                        <td className="p-2 border">
                                            <img 
                                                src={stu.pupilPhoto} 
                                                onClick={() => setSelectedImage(stu.pupilPhoto)}
                                                className="w-10 h-10 object-cover cursor-zoom-in" 
                                                alt="thumb" 
                                            />
                                        </td>
                                        <td className="p-2 border font-bold">{stu.studentName}</td>
                                        <td className="p-2 border">{stu.beceIndexNo}</td>
                                        <td className="p-2 border flex gap-2">
                                            <button onClick={() => generatePDF(stu)} className="bg-blue-600 text-white px-2 py-1 text-xs">📄 PDF</button>
                                            <button onClick={() => handleEdit(stu)} className="bg-yellow-500 text-black px-2 py-1 text-xs">Edit</button>
                                            <button onClick={() => handleDelete(stu.id)} className="bg-red-600 text-white px-2 py-1 text-xs">Del</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WasceReg;