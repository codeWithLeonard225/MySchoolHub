import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import CameraCapture from "../CaptureCamera/CameraCapture";// ADDED query and where here
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Security/AuthContext";
import imageCompression from "browser-image-compression";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CLOUD_NAME = "dxcrlpike";
const UPLOAD_PRESET = "LeoTechSl Projects";

const FACULTY_SUBJECTS = {
    Art: ["Mathematics", "English", "Health Science", "Literature", "Geography", "CRS", "History", "MIL", "Politics & Governance"],
    Science: ["Agricultural Science", "Biology", "Chemistry", "Engineering Science", "English", "Mathematics", "Physics", "Science Core"],
    Commercial: ["Mathematics", "English", "Health Science", "Business Accounting", "Principles of Account", "Commerce", "Economics", "Business Management", "Clerical Office Duties"]
};

const WasceReg = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentSchoolId = location.state?.schoolId || user?.schoolId || "N/A";
    const [showCamera, setShowCamera] = useState(false);
    const [cameraTarget, setCameraTarget] = useState("");
    // "pupil" or "bece"
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Filter states
    const [classList, setClassList] = useState([]);
    const [selectedClassName, setSelectedClassName] = useState("");
    const [availablePupils, setAvailablePupils] = useState([]);

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
        beceYear: "",
        previousSchool: "",
        beceIndexNo: "",
        aggregate: "",
        photoNo: "",
        pupilPhoto: null,
        beceResultPhoto: null,
        faculty: "",
        selectedSubjects: [],
        schoolId: currentSchoolId,
    });

    // 1. Fetch Classes
    useEffect(() => {
        if (currentSchoolId === "N/A") return;
        const q = query(collection(db, "ClassesAndSubjects"), where("schoolId", "==", currentSchoolId));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setClassList(data);
        });
        return () => unsub();
    }, [currentSchoolId]);

    // 2. Fetch Pupils in selected class
    useEffect(() => {
        if (!selectedClassName || currentSchoolId === "N/A") {
            setAvailablePupils([]);
            return;
        }
        const q = query(
            collection(db, "PupilsReg"),
            where("class", "==", selectedClassName),
            where("schoolId", "==", currentSchoolId)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailablePupils(data);
        });
        return () => unsub();
    }, [selectedClassName, currentSchoolId]);

    // 3. Sync Registered Wassce Candidates
    // KEEP AND UPDATE THIS ONE
    useEffect(() => {
        // Ensure we don't fetch if the school ID isn't loaded yet
        if (!currentSchoolId || currentSchoolId === "N/A") return;

        const q = query(
            collection(db, "WassceRegistrations"),
            where("schoolId", "==", currentSchoolId)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log("Fetched Students:", list); // Add this to debug
            setStudents(list);
        });

        return () => unsub();
    }, [currentSchoolId]); // It will re-run correctly when the user/schoolId loads
    // Age Calculation
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

    const handleSelectPupilFromList = (e) => {
        const pupilName = e.target.value;
        if (pupilName) {
            setFormData(prev => ({ ...prev, studentName: pupilName.toUpperCase() }));
        }
    };

    const handleCameraCapture = async (base64Image) => {
    try {
        setUploadingField(cameraTarget);

        const res = await fetch(base64Image);
        const blob = await res.blob();

        const formDataObj = new FormData();
        formDataObj.append("file", blob);
        formDataObj.append("upload_preset", UPLOAD_PRESET);

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formDataObj,
            }
        );

        const data = await uploadRes.json();

        setFormData((prev) => ({
            ...prev,
            [cameraTarget === "pupil" ? "pupilPhoto" : "beceResultPhoto"]: data.secure_url,
        }));

        toast.success("Captured & Uploaded!");
    } catch (err) {
        console.error(err);
        toast.error("Camera upload failed");
    } finally {
        setUploadingField(null);
        setShowCamera(false);
    }
};



    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
        }
    }, [formData.dob]);



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
        if (formData.selectedSubjects.length < 9) {
            toast.error("Please select at least 9 subjects!");
            return;
        }
        setIsSubmitting(true);

        // Ensure we use the latest school ID, not just what was in state at start
        const finalData = {
            ...formData,
            schoolId: currentSchoolId,
            studentName: formData.studentName.toUpperCase(),
            timestamp: new Date(),
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "WassceRegistrations", editingId), finalData);
                toast.success("Record Updated!");
                setEditingId(null);
            } else {
                await addDoc(collection(db, "WassceRegistrations"), finalData);
                toast.success("Registered Successfully!");
            }
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error("Error saving data");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleSubjectToggle = (subject) => {
        setFormData(prev => {
            const isSelected = prev.selectedSubjects.includes(subject);
            const updatedSubjects = isSelected
                ? prev.selectedSubjects.filter(s => s !== subject)
                : [...prev.selectedSubjects, subject];
            return { ...prev, selectedSubjects: updatedSubjects };
        });
    };

    // Update resetForm to include these new fields
    const resetForm = () => {
        setFormData({
            studentID: uuidv4().slice(0, 8), // Generate a new ID for the next registration
            studentName: "",
            dob: "",
            age: "",
            gender: "",
            address: "",
            mobileNumber: "",
            previousClass: "",
            beceYear: "",
            previousSchool: "",
            beceIndexNo: "",
            aggregate: "",
            photoNo: "",
            pupilPhoto: null,
            beceResultPhoto: null,
            faculty: "",
            selectedSubjects: [],
            schoolId: currentSchoolId, // Keep the school ID so the next entry is valid
        });
        setEditingId(null); // Ensure editing mode is turned off
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
            beceYear: stu.beceYear || "",
            previousSchool: stu.previousSchool || "",
            beceIndexNo: stu.beceIndexNo || "",
            aggregate: stu.aggregate || "",
            photoNo: stu.photoNo || "",
            pupilPhoto: stu.pupilPhoto || null,
            beceResultPhoto: stu.beceResultPhoto || null,
            schoolId: stu.schoolId || "",
            faculty: stu.faculty || "",
            selectedSubjects: stu.selectedSubjects || [],
        });

        setEditingId(stu.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



  

  

    const filteredStudents = students.filter(s =>
        s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.beceIndexNo?.includes(searchTerm)
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
                            {/* SELECT SECTION */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 bg-blue-50 p-3 border border-blue-200">
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold uppercase text-blue-700">1. Filter by Class</label>
                                    <select
                                        className="p-2 border-b-2 border-blue-700 bg-white"
                                        value={selectedClassName}
                                        onChange={(e) => setSelectedClassName(e.target.value)}
                                    >
                                        <option value="">-- Select Class --</option>
                                        {classList.map((cls) => (
                                            <option key={cls.id} value={cls.className}>{cls.className}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold uppercase text-blue-700">2. Select Registered Pupil</label>
                                    <select
                                        className="p-2 border-b-2 border-blue-700 bg-white"
                                        onChange={handleSelectPupilFromList}
                                        disabled={!selectedClassName}
                                    >
                                        <option value="">-- Choose Name --</option>
                                        {availablePupils.map((p) => (
                                            <option key={p.id} value={p.fullName || p.studentName}>
                                                {p.fullName || p.studentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col md:col-span-2">
                                <label className="text-xs font-bold uppercase">Full Student Name (Verified)</label>
                                <input
                                    type="text"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleInputChange}
                                    className="p-2 border-b-2 border-black uppercase font-bold text-blue-900 bg-yellow-50"
                                    required
                                />
                            </div>

                            {/* FACULTY & SUBJECT SELECTION */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 border-2 border-black mt-4">
                                {/* Faculty Column */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold uppercase text-red-700">3. Select Faculty</label>
                                    <select
                                        name="faculty"
                                        value={formData.faculty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value, selectedSubjects: [] }))}
                                        className="p-2 border-b-2 border-red-700 bg-white font-bold"
                                        required
                                    >
                                        <option value="">-- Choose Faculty --</option>
                                        <option value="Art">ART</option>
                                        <option value="Science">SCIENCE</option>
                                        <option value="Commercial">COMMERCIAL</option>
                                    </select>
                                </div>

                                {/* Subjects Column */}
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-red-700">
                                        4. Select Subjects (Selected: {formData.selectedSubjects.length})
                                    </label>
                                    {!formData.faculty ? (
                                        <div className="text-sm text-gray-400 italic mt-2 text-center p-4 border border-dashed border-gray-300">
                                            Please select a faculty first
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {FACULTY_SUBJECTS[formData.faculty].map((sub) => (
                                                <label key={sub} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.selectedSubjects.includes(sub)}
                                                        onChange={() => handleSubjectToggle(sub)}
                                                        className="w-4 h-4 accent-black"
                                                    />
                                                    <span>{sub}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {formData.selectedSubjects.length < 9 && formData.faculty && (
                                        <p className="text-[10px] text-red-600 font-bold mt-2 animate-pulse">
                                            ⚠️ Min. 9 subjects required for WASSCE
                                        </p>
                                    )}
                                </div>
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
                           <div className="flex gap-2 mt-3">
    <label className="cursor-pointer bg-black text-white px-3 py-1 text-[10px] font-bold uppercase hover:bg-gray-800">
        Upload
        <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "pupil")}
        />
    </label>

    <button
        type="button"
        onClick={() => {
            setCameraTarget("pupil");
            setShowCamera(true);
        }}
        className="bg-green-600 text-white px-3 py-1 text-[10px] font-bold uppercase"
    >
        📷 Camera
    </button>
</div>
                        </div>
                    </div>

                    <hr className="border-black" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col"><label className="text-xs font-bold">ADDRESS</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">MOBILE NUMBER</label><input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">PREVIOUS SCHOOL</label><input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
                            <div className="flex flex-col"><label className="text-xs font-bold">BECE YEAR</label><input type="text" name="beceYear" placeholder="ex. 2002" value={formData.beceYear} onChange={handleInputChange} className="p-2 border-b border-black outline-none" /></div>
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
                           <div className="flex gap-2 mt-3">
    <label className="cursor-pointer bg-blue-800 text-white px-3 py-1 text-[10px] font-bold uppercase">
        Upload
        <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "bece")}
        />
    </label>

    <button
        type="button"
        onClick={() => {
            setCameraTarget("bece");
            setShowCamera(true);
        }}
        className="bg-green-600 text-white px-3 py-1 text-[10px] font-bold uppercase"
    >
        📷 Camera
    </button>
</div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button type="submit" className="w-full bg-black text-white p-3 font-bold">
                            {editingId ? "UPDATE RECORD" : "REGISTER STUDENT"}
                        </button>
                        {editingId && <button onClick={() => { setEditingId(null); resetForm(); }} className="w-full bg-red-600 text-white p-2 mt-2">CANCEL EDIT</button>}
                    </div>
                </form>

        {showCamera && (
    <CameraCapture
        setPhoto={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        // If "environment" fails, the fix in step 1 will handle the fallback
        initialFacingMode="environment" 
    />
)}

             
            </div>
        </div>
    );
};

export default WasceReg;