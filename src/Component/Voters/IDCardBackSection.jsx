import React from 'react';
// Reverted to Font Awesome icons (react-icons/fa) as requested
import { FaExclamationTriangle, FaHome, FaClock, FaQrcode, FaFileAlt } from 'react-icons/fa';

// --- CONSTANTS ---
// ID Card dimensions in inches (standard CR80 size is approx 3.375 x 2.125 inches)
const CARD_WIDTH = "3.650in";
const CARD_HEIGHT = "2.320in";

// --- MOCK DATA ---
const mockSchoolInfo = {
  schoolName: "Academia Heights High School",
  schoolLogoUrl: "https://placehold.co/100x100/1D4ED8/ffffff?text=AHHS",
  schoolAddress: "140 Main St, Schooltown, State 12345",
  schoolMotto: "Excellence in Spirit and Mind",
  schoolContact: "+1 (555) 123-4567",
  email: "info@ahhs.edu",
};

const mockStudentData = {
  studentID: "AHHS2025-001A",
  studentName: "Alex R. Johnson",
  class: "Y11A",
  dob: "2007-05-15",
  addressLine1: "45 Elm Drive",
  userPhotoUrl: "https://placehold.co/150x180/7F1D1D/ffffff?text=Alex+Photo",
};

// --- HELPER FUNCTION ---
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  // Ensure date is a valid object before formatting
  if (isNaN(date)) return dateStr; 
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ---------------------------------------------------------------------
// --- FRONT CARD COMPONENT (Based on User's input) ---
// ---------------------------------------------------------------------

const PupilIDCardFront = ({ studentData, schoolInfo }) => (
  <div
    className="relative bg-white shadow-lg border-2 border-blue-600 rounded-lg flex flex-col justify-between"
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      padding: "0.15in",
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    {/* Background Watermark */}
    <img
      src={schoolInfo.schoolLogoUrl}
      alt="School Logo Background"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5"
      style={{ width: "90%", height: "auto", objectFit: "contain" }}
    />

    {/* Header */}
    <div className="flex items-center border-b border-blue-200 pb-[2px] relative z-10 bg-blue-50/70">
      <img
        src={schoolInfo.schoolLogoUrl}
        alt="Logo"
        className="w-8 h-8 object-cover rounded-full border-2 border-blue-600 p-[1px]"
      />
      <div className="text-center flex-1">
        <h2 className="text-[10pt] font-extrabold leading-tight text-blue-900">
          {schoolInfo.schoolName}
        </h2>
        <p className="text-[7pt] italic text-blue-600 -mt-[1px]">
          {schoolInfo.schoolMotto}
        </p>
      </div>
    </div>

    {/* Details Section */}
    <div className="flex mt-[4px] gap-[8px] flex-1 items-start relative z-10">
      <img
        src={studentData.userPhotoUrl}
        alt="Student"
        className="w-[1.1in] h-[1.3in] object-cover border-2 border-blue-400 rounded-md shadow-md"
      />
      <div className="text-[8.5pt] leading-[1.2] pt-[4px] flex flex-col justify-start space-y-[2px]">
        <p><span className="font-bold text-gray-700">ID:</span> <span className="text-blue-700 font-mono">{studentData.studentID}</span></p>
        <p><span className="font-bold text-gray-700">Name:</span> {studentData.studentName}</p>
        <p>
          <span className="font-bold text-gray-700">Class:</span>{" "}
          <span className="bg-yellow-200 px-1 rounded text-red-700 font-semibold text-[8pt]">{studentData.class}</span>
        </p>
        <p><span className="font-bold text-gray-700">DOB:</span> {formatDate(studentData.dob)}</p>
        <p><span className="font-bold text-gray-700">Address:</span> <span className='text-[8pt]'>{studentData.addressLine1}</span></p>
        
        {/* Signature Placeholder */}
        <div className="mt-2 text-center text-[7pt] pt-1 border-t border-dashed border-gray-400">
            <p className='italic text-gray-500'>Student Signature</p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-blue-300 mt-[2px] pt-[2px] text-[6.5pt] text-gray-700 flex justify-between relative z-10">
      <span className="truncate">{schoolInfo.schoolAddress}</span>
      <span className='font-semibold'>Valid: 2024-2025</span>
    </div>
  </div>
);


// ---------------------------------------------------------------------
// --- BACK CARD DESIGNS (8 Variations) ---
// ---------------------------------------------------------------------

const BackCardWrapper = ({ title, children, className = '' }) => (
    // Note: This div is one of the flex items inside the new card-grid-wrapper
    <div className="p-4 bg-white rounded-xl shadow-xl border border-gray-200 card-wrapper-item">
        <h3 className="text-center font-bold text-md mb-3 text-gray-700 border-b pb-1">Design: {title}</h3>
        <div
            className={`relative bg-white shadow-inner rounded-lg flex flex-col justify-between ${className}`}
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                padding: "0.15in",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    </div>
);

// --- DESIGN 1: Emergency Focus (Classic & Clear) ---
const IDCardBackDesign1 = ({ schoolInfo }) => (
    <div className="flex flex-col h-full text-[8pt] p-2 bg-gray-50">
        <div className="bg-red-600 text-white text-center font-bold py-1 mb-2 rounded-sm flex items-center justify-center gap-1">
            <FaExclamationTriangle className="w-3 h-3"/> EMERGENCY CONTACT
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 flex-1">
            <div>
                <p className="font-semibold text-gray-700">Guardian Name:</p>
                <p className="text-red-700 font-bold">Jane Johnson</p>
            </div>
            <div>
                <p className="font-semibold text-gray-700">Contact #1:</p>
                <p className="text-red-700 font-bold">555-888-9999</p>
            </div>
            <div className="col-span-2 border-t pt-1 mt-1">
                <p className="font-semibold text-gray-700">School Security:</p>
                <p className="text-blue-700 font-bold">555-100-2000 (24/7)</p>
            </div>
        </div>
        <div className="mt-2 text-[7pt] text-center text-gray-500 border-t pt-1">
            <p className="font-bold">Important Notice:</p>
            <p className="leading-tight italic">Card must be shown upon request. If found, please return to {schoolInfo.schoolName}.</p>
        </div>
    </div>
);

// --- DESIGN 2: QR Code & Minimal Rules ---
const IDCardBackDesign2 = () => (
    <div className="flex h-full p-1.5 justify-between">
        <div className="flex flex-col text-[7.5pt] leading-snug flex-1 pr-2">
            <div className="text-blue-700 font-bold mb-1 border-b border-blue-200 pb-1">CODE OF CONDUCT</div>
            <ul className="list-disc pl-3 space-y-[1px]">
                <li>Respect all staff and property.</li>
                <li>No unauthorized entry.</li>
                <li>Report lost card immediately.</li>
                <li>Card is non-transferable.</li>
            </ul>
            <div className="mt-2 text-red-600 font-bold border-t border-red-200 pt-1">
                Emergency: 555-000-HELP
            </div>
        </div>
        <div className="w-[1.1in] h-full flex flex-col items-center justify-center bg-white p-1 rounded-md border-2 border-gray-300">
            <FaQrcode className="w-10 h-10 text-gray-800"/>
            <p className='text-[6pt] font-mono mt-1'>[Student Data QR]</p>
        </div>
    </div>
);

// --- DESIGN 3: Vertical Strip Layout (Two-Tone) ---
const IDCardBackDesign3 = () => (
    <div className="flex h-full">
        {/* Left Strip: Emergency Info */}
        <div className="w-1/3 bg-blue-700 text-white p-1.5 flex flex-col justify-center items-center text-center">
            <FaExclamationTriangle className="w-4 h-4 mb-1"/>
            <p className="text-[7pt] font-semibold leading-none">EMERGENCY</p>
            <p className="text-[9pt] font-extrabold mt-1">555-911-0000</p>
        </div>
        {/* Right Content: Rules & Disclaimers */}
        <div className="flex-1 p-2 text-[7.5pt] bg-white">
            <p className="font-bold text-red-600 mb-1">CONDITIONS OF USE:</p>
            <ul className="list-none space-y-[2px]">
                <li className="flex items-start"><span className="text-blue-700 mr-1">&#9679;</span> Must be carried at all times.</li>
                <li className="flex items-start"><span className="text-blue-700 mr-1">&#9679;</span> Misuse leads to confiscation.</li>
                <li className="flex items-start"><span className="text-blue-700 mr-1">&#9679;</span> Property of AHHS.</li>
            </ul>
            <div className="mt-2 text-center border-t border-gray-300 pt-1">
                <p className='text-[6pt] italic'>Issuing Authority Signature</p>
                <div className="h-4 border-b border-dashed border-gray-600 mx-4"></div>
            </div>
        </div>
    </div>
);

// --- DESIGN 4: Signature Focused (Bank Card Style) ---
const IDCardBackDesign4 = () => (
    <div className="flex flex-col h-full p-2 text-[8pt] bg-gray-100">
        <div className="bg-white p-1 mb-2 border border-gray-300 rounded-sm shadow-inner">
            <p className="text-[6pt] text-gray-500 font-mono mb-0.5">AUTH/ISSUE - 2024</p>
            <div className="h-5 bg-yellow-100 border-y border-yellow-400 flex items-center px-1">
                <span className="text-[8pt] font-serif italic text-gray-800">For Official Use Only - Do Not Alter</span>
            </div>
        </div>
        <div className="flex justify-between items-center flex-1">
            <div className="flex flex-col justify-center space-y-1">
                <div className="w-[1.2in] h-6 border-b border-black border-dashed"></div>
                <p className="text-[7pt] text-center font-bold text-gray-700">Principal Signature</p>
                <p className="text-[6pt] text-center text-gray-500">Issued Date: {formatDate(new Date())}</p>
            </div>
            <div className="flex flex-col items-center">
                <FaFileAlt className="w-6 h-6 text-gray-500"/>
                <p className="text-[7pt] font-bold text-red-600 mt-1">REPORT THEFT: 555-111-2222</p>
            </div>
        </div>
    </div>
);

// --- DESIGN 5: School Hours & Attendance Rules ---
const IDCardBackDesign5 = () => (
    <div className="flex flex-col h-full p-2 text-[7.5pt] bg-green-50">
        <div className="flex justify-center items-center gap-2 text-green-800 font-extrabold mb-1 pb-1 border-b border-green-300">
            <FaClock className="w-3 h-3"/> SCHOOL POLICY HIGHLIGHTS
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-3">
            <div>
                <p className="font-bold text-green-700">School Hours:</p>
                <ul className="list-disc pl-3">
                    <li>Mon-Fri: 8:00 AM - 3:00 PM</li>
                    <li>Library: Closes 4:30 PM</li>
                </ul>
            </div>
            <div>
                <p className="font-bold text-green-700">Emergency Contacts:</p>
                <ul className="list-disc pl-3">
                    <li>Main Office: 555-5000</li>
                    <li>First Aid: 555-5001</li>
                </ul>
            </div>
        </div>
        <div className="mt-2 text-[6.5pt] text-center text-gray-600 italic pt-1 border-t border-green-300">
            "Prompt attendance is mandatory. Absence requires parental notification."
        </div>
    </div>
);

// --- DESIGN 6: Data Barcode Emphasis (Security Look) ---
const IDCardBackDesign6 = () => (
    <div className="flex flex-col h-full p-2 bg-slate-800 text-white">
        <div className="flex items-center justify-between mb-1">
            <p className="text-[8pt] font-extrabold text-red-400">LOST & FOUND</p>
            <p className="text-[7pt] text-gray-300">Non-Transferable</p>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-1 bg-white rounded-md shadow-lg">
            {/* Barcode Placeholder - Simulating a wide magnetic/barcode strip */}
            <div className="w-full h-8 bg-black flex items-center justify-center">
                <div className="w-1/2 h-4 bg-white/10 border-y border-white"></div>
            </div>
            <p className="text-[6pt] font-mono text-gray-600 mt-1">***AHHS2025-001A***</p>
            <p className="text-[7pt] font-bold text-red-700 mt-0.5">Scan for Entry & Library Access</p>
        </div>
        <div className="text-[7pt] text-center mt-2 border-t border-slate-600 pt-1">
            <p className="text-gray-400">Issued by: Administration Department</p>
        </div>
    </div>
);

// --- DESIGN 7: Clean Two-Column Layout (Contact & Rules) ---
const IDCardBackDesign7 = ({ schoolInfo }) => (
    <div className="flex h-full p-2 text-[8pt] bg-white">
        <div className="w-1/2 pr-2 border-r border-gray-200">
            <div className="font-bold text-blue-600 mb-1 flex items-center gap-1">
                <FaHome className="w-3 h-3"/> CONTACT
            </div>
            <div className="space-y-0.5">
                <p className="font-semibold">Office:</p>
                <p className="text-gray-700 leading-tight">{schoolInfo.schoolContact}</p>
                <p className="font-semibold">Email:</p>
                <p className="text-gray-700 leading-tight text-[7pt] truncate">{schoolInfo.email}</p>
            </div>
        </div>
        <div className="w-1/2 pl-2">
            <div className="font-bold text-red-600 mb-1 flex items-center gap-1">
                <FaFileAlt className="w-3 h-3"/> RULES
            </div>
            <ul className="list-disc pl-3 space-y-[2px] text-[7.5pt]">
                <li>ID must be visible.</li>
                <li>Replacement fee applies for loss.</li>
                <li>Valid only for stated academic year.</li>
            </ul>
        </div>
        <img
            src={schoolInfo.schoolLogoUrl}
            alt="Watermark"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 w-1/3 h-auto"
        />
    </div>
);

// --- DESIGN 8: Minimalist Disclaimer (Focus on Signature & Date) ---
const IDCardBackDesign8 = ({ schoolInfo }) => (
    <div className="flex flex-col h-full p-3 justify-center items-center text-[8pt] bg-yellow-50">
        <div className="text-center mb-4">
            <p className="font-bold text-gray-800">This card is property of {schoolInfo.schoolName}.</p>
            <p className="text-[7pt] italic text-gray-600 leading-tight">Unauthorized use is prohibited and subject to disciplinary action.</p>
        </div>

        <div className="w-full flex justify-between items-end border-t border-gray-300 pt-3">
            <div className="text-center">
                <div className="w-[1in] h-6 border-b border-black border-dashed mx-auto"></div>
                <p className="text-[7pt] font-bold text-gray-700 mt-1">Principal Seal/Stamp</p>
            </div>
            <div className="text-center">
                <div className="w-[1in] h-6 border-b border-black border-dashed mx-auto"></div>
                <p className="text-[7pt] font-bold text-gray-700 mt-1">Issuance Date</p>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------
// --- MAIN APP COMPONENT ---
// ---------------------------------------------------------------------

const App = () => {
  const schoolInfo = mockSchoolInfo;
  const studentData = mockStudentData;

  const backDesigns = [
    { title: "1. Emergency Priority", component: IDCardBackDesign1 },
    { title: "2. QR & Code of Conduct", component: IDCardBackDesign2 },
    { title: "3. Vertical Strip Highlight", component: IDCardBackDesign3 },
    { title: "4. Signature/Security Focus", component: IDCardBackDesign4 },
    { title: "5. Policy & Hours", component: IDCardBackDesign5 },
    { title: "6. Barcode & Dark Theme", component: IDCardBackDesign6 },
    { title: "7. Clean Contact/Rules", component: IDCardBackDesign7 },
    { title: "8. Minimalist Disclaimer", component: IDCardBackDesign8 },
  ];
    
  // Function to trigger native browser print dialog
  const handlePrint = () => {
    window.print();
  };
    
  // Constants for Print Layout - Adjusted for A4 (approx 8.27in wide)
  const PRINT_WRAPPER_WIDTH = "48%"; // Allows two 3.65in cards to fit with margin/gap
  const PRINT_GAP = "0.2in"; 


  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-2xl font-extrabold text-center mb-2 text-blue-800">
        ID Card Design Showcase
      </h1>
      <p className="text-center text-gray-600 mb-4">
        8 mock back-section designs displayed alongside the front card for visual comparison.
      </p>

      {/* PRINT BUTTON - Hidden during printing */}
      <div className="flex justify-center mb-8 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform hover:scale-105"
        >
            <FaFileAlt className="w-5 h-5"/>
            <span>Print Designs</span>
        </button>
      </div>
      {/* END PRINT BUTTON */}

      {/* --- NEW DEDICATED WRAPPER FOR FLEX CONTROL --- */}
      <div className="card-grid-wrapper flex flex-wrap justify-center gap-6 print-container">
        {/* Display Front Card for Reference */}
        <div className="p-4 bg-white rounded-xl shadow-2xl border-4 border-yellow-500 card-wrapper-item">
             <h3 className="text-center font-bold text-md mb-3 text-gray-700 border-b pb-1">FRONT CARD (Your Template)</h3>
            <PupilIDCardFront studentData={studentData} schoolInfo={schoolInfo} />
        </div>

        {/* Display Back Cards */}
        {backDesigns.map((design, index) => (
            <BackCardWrapper key={index} title={design.title}>
                <design.component schoolInfo={schoolInfo} />
            </BackCardWrapper>
        ))}
      </div>
      {/* --- END NEW DEDICATED WRAPPER --- */}

       {/* Tailwind CSS for Inter Font and Print Styles */}
       <script src="https://cdn.tailwindcss.com"></script>
       <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Custom CSS to improve print output */
          @media print {
            /* 1. Set A4 Paper Size and Orientation */
            @page {
              size: A4; /* A4 dimensions: 210mm x 297mm (approx 8.27in x 11.69in) */
              margin: 0.5cm; /* Reduce print margins for max space */
            }

            .print\\:hidden {
              display: none !important;
            }
            .p-8.bg-gray-100.min-h-screen.font-sans {
                padding: 10px !important;
                background-color: white !important;
                min-height: auto !important;
            }
            
            /* 2. Layout to achieve 2 cards per row on A4 */
            .card-grid-wrapper {
                /* Target the new main container */
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                justify-content: space-between !important; /* Distribute cards across the width */
                align-items: flex-start !important;
                gap: ${PRINT_GAP} 0 !important; /* Vertical gap, remove horizontal gap */
                width: 100%; /* Ensure container takes full print width */
            }
            
            /* 3. Target the individual card wrapper elements by their shared class */
            .card-grid-wrapper > .card-wrapper-item,
            .card-grid-wrapper > .p-4.bg-white.rounded-xl.shadow-xl.border {
                /* Set width to just under 50% to fit two across with margin and border */
                width: ${PRINT_WRAPPER_WIDTH} !important; 
                /* Remove unnecessary styling for print */
                box-shadow: none !important; 
                border-width: 1px !important;
                border-style: solid !important;
                margin: 0.25rem 0 !important; /* Add vertical margin between rows */
                padding: 0.5rem !important;
            }
            
            /* Remove the top heading/description text in print */
            h1, p.text-center.text-gray-600 {
                display: none !important;
            }
          }
       `}</style>

    </div>
  );
};

export default App;