import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase"; 

import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { useAuth } from "../Security/AuthContext";

const BulkRegistration = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const schoolId = user?.schoolId || "N/A";
    const registeredBy = user?.data?.adminID || user?.data?.teacherID || "";

const [students, setStudents] = useState([
  // List 1 (1–21)
  {
    name: "Antony Iborchum Icoposowa",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Ibrahim Rahman Sia Bangura",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Clement Goel Michael Sesay",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Abdelrahman Aliyu Bamba Koroma",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Mohamed Lamin Sesay",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Hamza Kindo?wa Demby",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Shop John Lebbie",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Richard Theimu Mansaray",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Jessie Cichos Johnson",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Emmanuel Thomas Gaylor",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Ibrahim Sorie Keny",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Chilten Caleb Moatti Williams",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Sere Maich Gita Alie Sesay",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Husine Hassan Kargbo",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Michael Aliyu Sawanda Bangura",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Abdul Raheem Kargbo",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Kadija Elizabeth Jefeneli",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Adama Haja Ramadan Konowe",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Mariama Ishmata Sesay",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Sadiatu Ibrahim Konowe",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Rodels",
    gender: "Male",
    feesCategory: "Continue",
  },

  // List 2 (1–21)
  {
    name: "Berian Ishaq Blake",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Memunatu Kessanatu Aminata Conteh",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Kadiatu Mansaray",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Sathie James Gboboh",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Martha Mariahu Koroma",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Selamatu [surname unclear] Counsell",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Khurnatu Princess Kamara",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Elizabeth Fudia Josephine Kargbo",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Fatima Saccoh",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Mariama Kargbo",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Zainab Blessing Kargbo",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Zainab Kamara",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Rinatu Bangura",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Fatima Hassan Bangura",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Fatmata Sowa",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Bintu Raman Kamara",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Salamatu Fatmata",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Ramatu Sunkel",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Irene Fofanah",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Hadiatu Abibatu Aminata Jalloh",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Gladys Temeh Musa",
    gender: "Female",
    feesCategory: "Continue",
  },

  // List 3 (1–13)
  {
    name: "Zainab Ziforrah Barrie",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Valbella Maje Vandi",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Precious Isla Place Makia",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Esther Sia John",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Gladysnia Cole",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Kadijatu Alicia Bell",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Josephine Jonah Mogans?",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Hissandu Bully Kamara",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Mary Faro",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Margaret Kargbo",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Mohamed Ibrahim Dumbuya",
    gender: "Male",
    feesCategory: "Continue",
  },
  {
    name: "Hossmedu Yenoh Kamara",
    gender: "Female",
    feesCategory: "Continue",
  },
  {
    name: "Medtin Said Bangura",
    gender: "Male",
    feesCategory: "Continue",
  },
]);
    const [commonData, setCommonData] = useState({
        class: "JSS 1", 
        academicYear: "2026/2027", 
        pupilType: "Private", 
        registrationDate: new Date().toISOString().slice(0, 10),
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleGender = (index) => {
        const updatedStudents = [...students];
        updatedStudents[index].gender = updatedStudents[index].gender === "Male" ? "Female" : "Male";
        setStudents(updatedStudents);
    };

    const handleBulkSubmit = async () => {
        if (schoolId === "N/A") return toast.error("User Auth Error: School ID not detected.");
        if (!window.confirm(`Register all ${students.length} students to ${commonData.class}?`)) return;
        
        setIsSubmitting(true);
        toast.info(`Uploading batch for ${commonData.class}...`);

        try {
            for (const student of students) {
                const newId = uuidv4().slice(0, 8);
                const studentData = {
                    studentID: newId,
                    studentName: student.name.toUpperCase().trim(),
                    gender: student.gender,
                    feesCategory: student.feesCategory, 
                    class: commonData.class,
                    academicYear: commonData.academicYear,
                    pupilType: commonData.pupilType,
                    registrationDate: commonData.registrationDate,
                    schoolId: schoolId,
                    registeredBy: registeredBy,
                    timestamp: new Date(),
                    dob: "", age: "", addressLine1: "", parentName: "", parentPhone: "",
                    userPhotoUrl: null, userPublicId: null
                };

                // Save to primary Firestore
                const docRef = await addDoc(collection(db, "PupilsReg"), studentData);
             
            }
            
            toast.success(`🎉 SUCCESS: ${students.length} students registered!`);
            navigate(-1);
        } catch (error) {
            console.error(error);
            toast.error("Upload failed. Check your network.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-indigo-900">
                <div className="bg-indigo-900 p-6 text-white flex justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Bulk Upload: {commonData.class}</h2>
                        <p className="text-sm opacity-80 font-semibold text-yellow-400">TOTAL STUDENTS: {students.length}</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="text-sm underline">Back</button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Target Class</label>
                            <input type="text" value={commonData.class} readOnly className="w-full border p-2 rounded bg-gray-50 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Academic Year</label>
                            <input type="text" value={commonData.academicYear} readOnly className="w-full border p-2 rounded bg-gray-50 text-sm" />
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto border rounded divide-y">
                        {students.map((student, index) => (
                            <div key={index} className="flex justify-between items-center p-3 hover:bg-indigo-50 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-700">{index + 1}. {student.name}</span>
                                    <span className="text-[10px] text-green-600 uppercase font-black tracking-wider">★ {student.feesCategory}</span>
                                </div>
                                <button 
                                    onClick={() => toggleGender(index)}
                                    className={`text-xs px-4 py-1 rounded-full font-bold shadow-sm transition-all ${
                                        student.gender === "Male" 
                                        ? "bg-blue-600 text-white" 
                                        : "bg-pink-500 text-white"
                                    }`}
                                >
                                    {student.gender}
                                </button>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-indigo-800 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-900 disabled:bg-gray-400 shadow-xl active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? `Syncing ${students.length} Records...` : `Register ${students.length} Students`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkRegistration;