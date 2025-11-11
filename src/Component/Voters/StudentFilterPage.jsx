import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../Security/AuthContext";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Configuration ---
// Key for local storage
const LOCAL_STORAGE_KEY = "schoolStudentsData";
// Data is considered "stale" after 5 minutes (300,000 milliseconds)
const STALE_TIME_MS = 20 * 60 * 1000; 
// ---------------------

const StudentFilterPage = () => {
  const { user } = useAuth();
  const currentSchoolId = user?.schoolId || "N/A";

  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true); // Added loading state

  // --- Utility Functions ---
  const extractAndSetOptions = (data) => {
    const classes = [...new Set(data.map((s) => s.class).filter(Boolean))].sort();
    const years = [...new Set(data.map((s) => s.academicYear).filter(Boolean))].sort().reverse();
    setClassOptions(classes);
    setYearOptions(years);
  };

  const processAndSetStudents = (data) => {
    const sortedData = data.sort((a, b) => a.studentName?.localeCompare(b.studentName));
    setStudents(sortedData);
    extractAndSetOptions(sortedData);
  };
  // -------------------------


  // 1. Initial Load and Firestore Subscription
  useEffect(() => {
    if (!currentSchoolId || currentSchoolId === "N/A") {
      setLoading(false);
      return;
    }

    const loadStudents = () => {
      // 🚀 Step 1: Check Local Storage
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const now = Date.now();
      let shouldFetchFromFirestore = true;

      if (cachedData) {
        try {
          const { timestamp, data } = JSON.parse(cachedData);
          
          if (now - timestamp < STALE_TIME_MS) {
            // Data is fresh, use cache and skip Firestore fetch
            processAndSetStudents(data);
            shouldFetchFromFirestore = false;
            setLoading(false);
            // Optional: Show a quick message
            // toast.info("Loaded students from cache."); 
            console.log("Loaded students from cache.");
          }
        } catch (e) {
          console.error("Failed to parse cached data:", e);
          // If parsing fails, proceed to fetch from Firestore
        }
      }

      // 🚀 Step 2: Set up Firestore Listener (Always runs for real-time updates)
      const q = query(
        collection(db, "PupilsReg"),
        where("schoolId", "==", currentSchoolId)
      );
      
      // We set loading=true just before starting the Firestore watch, 
      // but only if we didn't load fresh data from cache.
      if (shouldFetchFromFirestore) {
        setLoading(true);
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          
          processAndSetStudents(fetchedData);
          
          // 🚀 Step 3: Save to Local Storage on every update
          const dataToStore = {
            timestamp: Date.now(),
            data: fetchedData,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
          
          setLoading(false);
        },
        (error) => {
          console.error("Failed to fetch students from Firestore:", error);
          toast.error("Failed to load students.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    };

    return loadStudents();
  }, [currentSchoolId]);

  // Filter students (remains the same)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return (
        (!selectedClass || s.class === selectedClass) &&
        (!selectedYear || s.academicYear === selectedYear)
      );
    });
  }, [students, selectedClass, selectedYear]);

  // Download PDF (remains the same)
  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    doc.text("Student List - Filtered", 14, 10);
    doc.setFontSize(10);
    doc.text(`School ID: ${currentSchoolId}`, 14, 15);
    doc.text(`Filter: Class=${selectedClass || 'All'}, Year=${selectedYear || 'All'}`, 14, 20);

    const tableHeaders = [
      "#", "ID", "Name", "Class", "Year", "DOB", "Age", "Gender", "Parent Name", "Parent Phone", "Reg Date"
    ];

    const tableData = filteredStudents.map((student, index) => [
      index + 1,
      student.studentID,
      student.studentName,
      student.class,
      student.academicYear,
      student.dob,
      student.age,
      student.gender,
      student.parentName,
      student.parentPhone,
      student.registrationDate,
    ]);

    autoTable(doc, {
      startY: 25, 
      head: [tableHeaders],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'ellipsize' },
      headStyles: { fillColor: [22, 163, 74] },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 20 }, 2: { cellWidth: 35 },
        3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20 },
        6: { cellWidth: 10 }, 7: { cellWidth: 15 }, 8: { cellWidth: 30 },
        9: { cellWidth: 25 }, 10: { cellWidth: 20 },
      }
    });

    doc.save("Filtered_Student_List_Landscape.pdf");
  };

  // Print Preview (remains the same)
  const printPreview = () => {
    const printContent = document.getElementById("printableArea");
    const WinPrint = window.open("", "", "width=1200,height=800"); 
    WinPrint.document.write(`
      <html>
        <head>
          <title>Print Preview</title>
          <style>
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { 
              border: 1px solid #000; 
              padding: 6px; 
              text-align: left; 
              font-size: 10px; 
              word-wrap: break-word;
            }
            th { background-color: #f0f0f0; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
            }
            @page { 
              size: landscape; 
              margin: 10mm; 
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Pupils List - ${selectedClass || 'All'} / ${selectedYear || 'All'}</h2>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500); 
            }
          </script>
        </body>
      </html>
    `);
    WinPrint.document.close();
  };

  // UI Table configuration (remains the same)
  const tableHeaders = [
    "#", "ID", "Name", "Class", "Year", "DOB", "Age", "Gender", "Parent Name", "Parent Phone", "Reg Date"
  ];
  const studentFields = [
    'studentID', 'studentName', 'class', 'academicYear', 'dob', 'age', 'gender', 'parentName', 'parentPhone', 'registrationDate'
  ];

  if (loading && students.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl font-medium text-gray-700">Loading student data...</p>
        <p className="text-sm text-gray-500 mt-2">Checking cache or fetching from database.</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
        Filter & Export Student Data 📊
      </h1>

      <div className="flex flex-col md:flex-row md:space-x-4 bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex-1 mb-4 md:mb-0">
          <label className="block mb-2 font-semibold text-gray-700">Filter by Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes ({classOptions.length})</option>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block mb-2 font-semibold text-gray-700">Filter by Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Years ({yearOptions.length})</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
        >
          ⬇️ Download Landscape PDF
        </button>
        <button
          onClick={printPreview}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
        >
          🖨️ Print Preview
        </button>
      </div>

      {/* Table Display Area */}
      <div id="printableArea" className="overflow-x-auto bg-white p-4 rounded-lg shadow-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student, index) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700">{index + 1}</td>
                {studentFields.map((field) => (
                    <td key={field} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {student[field]}
                    </td>
                ))}
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={tableHeaders.length} className="px-4 py-4 text-center text-gray-500">
                  No students found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentFilterPage;