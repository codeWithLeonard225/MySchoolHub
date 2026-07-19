import React from 'react';

// ==========================================
// 1. MOCK DATA OBJECT (From Image Data)
// ==========================================
export const mockReportCardData = {
  schoolInfo: {
    name: "INTERNATIONAL ISLAMIC PRIMARY SCHOOL",
    address: "84 CIRCULAR ROAD, FREETOWN",
    motto: "Knowledge, Piety and Morals",
    contacts: ["+23274205500", "+232 33205000"],
    email: "internationalislamicpjss@gmail.com",
    academicYear: "2025/2026",
    reportSheetTitle: "PUPIL'S CONTINUOUS ASSESSMENT REPORT SHEET"
  },
  studentPersonalData: {
    name: "SOW ALHAJI ATIGOU",
    classTeacher: "AUNTY AMINATA",
    sex: "MALE",
    class: "NURSERY 1",
    admissionNo: "2025000",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face" // Placeholder representative portrait
  },
  attendance: {
    timesLate: 2,
    timesPresent: 363,
    timesAbsent: 1
  },
  terminalDuration: {
    termBegins: "20/04/2026",
    termEnds: "04/06/2026",
    nextTermBegins: "07/09/2026"
  },
  academicSummary: {
    totalScoreObtainable: 7200.0,
    totalScoreObtained: 6286.0,
    averagePercentage: 87.31,
    noInClass: 52,
    position: "40th"
  },
  academicPerformance: [
    {
      subject: "Al-Anasheed الأناشيد",
      max: 100,
      firstTerm: { test: 99, exam: 100, mean: 99.5, rank: "3rd" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      yearly: { mean: 99.8, rank: "15th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Al-Huruful Hijaa eeya الحروف الهجائية",
      max: 100,
      firstTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      yearly: { mean: 100.0, rank: "12th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Al-Kath الخط",
      max: 100,
      firstTerm: { test: 90, exam: 90, mean: 90.0, rank: "29th" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 97, exam: 100, mean: 98.5, rank: "28th" },
      yearly: { mean: 96.2, rank: "25th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Alphabet Ability",
      max: 100,
      firstTerm: { test: 100, exam: 97, mean: 98.5, rank: "32nd" },
      secondTerm: { test: 90, exam: 100, mean: 95.0, rank: "35th" },
      thirdTerm: { test: 90, exam: 100, mean: 95.0, rank: "35th" },
      yearly: { mean: 96.2, rank: "34th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "CPA",
      max: 100,
      firstTerm: { test: 100, exam: 95, mean: 92.5, rank: "39th" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 100, exam: 75, mean: 87.5, rank: "36th" },
      yearly: { mean: 93.3, rank: "37th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Hadith الحديث",
      max: 100,
      firstTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      yearly: { mean: 100.0, rank: "18th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Hand Writing",
      max: 100,
      firstTerm: { test: 80, exam: 50, mean: 65.0, rank: "30th" },
      secondTerm: { test: 20, exam: 40, mean: 30.0, rank: "46th" },
      thirdTerm: { test: 30, exam: 50, mean: 40.0, rank: "44th" },
      yearly: { mean: 45.0, rank: "43rd", grade: "D", remarks: "FAIR" }
    },
    {
      subject: "Health Education",
      max: 100,
      firstTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      secondTerm: { test: 65, exam: 70, mean: 67.5, rank: "49th" },
      thirdTerm: { test: 80, exam: 100, mean: 90.0, rank: "44th" },
      yearly: { mean: 85.8, rank: "47th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Number Work",
      max: 100,
      firstTerm: { test: 100, exam: 95, mean: 97.5, rank: "20th" },
      secondTerm: { test: 55, exam: 50, mean: 52.5, rank: "46th" },
      thirdTerm: { test: 70, exam: 30, mean: 50.0, rank: "44th" },
      yearly: { mean: 66.7, rank: "43rd", grade: "B", remarks: "VERY GOOD" }
    },
    {
      subject: "Qura'n القرآن الكريم",
      max: 100,
      firstTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 100, exam: 98, mean: 99.0, rank: "30th" },
      yearly: { mean: 99.7, rank: "16th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Reading",
      max: 100,
      firstTerm: { test: 100, exam: 95, mean: 97.5, rank: "30th" },
      secondTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      thirdTerm: { test: 45, exam: 100, mean: 72.5, rank: "43rd" },
      yearly: { mean: 90.0, rank: "37th", grade: "A", remarks: "EXCELLENT" }
    },
    {
      subject: "Rhyming",
      max: 100,
      firstTerm: { test: 100, exam: 100, mean: 100.0, rank: "1st" },
      secondTerm: { test: 100, exam: 20, mean: 60.0, rank: "49th" },
      thirdTerm: { test: 30, exam: 100, mean: 65.0, rank: "50th" },
      yearly: { mean: 75.0, rank: "48th", grade: "A", remarks: "EXCELLENT" }
    }
  ],
  totalsAndPercentages: {
    firstTerm: { testTotal: 1164, examTotal: 1117, meanTotal: 1140.5, testPercent: 97.0, examPercent: 93.1, meanPercent: 95.0, rank: "23rd" },
    secondTerm: { testTotal: 1030, examTotal: 980, meanTotal: 1005.0, testPercent: 85.8, examPercent: 81.7, meanPercent: 83.8, rank: "45th" },
    thirdTerm: { testTotal: 942, examTotal: 1053, meanTotal: 997.5, testPercent: 78.5, examPercent: 87.8, meanPercent: 83.1, rank: "42nd" },
    yearly: { meanTotal: 1047.7, percentage: 87.3, rank: "40th" }
  },
  remarksAndPromotion: {
    classTeachersComment: "EXCELLENT RESULT",
    promotionStatus: "PROMOTED TO NURSERY 2. CONGRATULATIONS",
    date: "15/07/2026"
  }
};

// ==========================================
// 2. REPORT CARD INTERFACE COMPONENT
// ==========================================
export default function AllInOneReportCard() {
  const data = mockReportCardData;

  // Rating keys rendering helper
  const keysToRating = [
    { range: "100-70", label: "EXCELLENT" },
    { range: "60-69", label: "VERY GOOD" },
    { range: "55-59", label: "GOOD" },
    { range: "45-54", label: "FAIR" },
    { range: "40-44", label: "POOR" },
    { range: "0-39", label: "VERY POOR" }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl border border-gray-300 rounded-lg font-sans text-slate-800 selection:bg-blue-100 print:shadow-none print:p-0">
      
      {/* Header Banner Section */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-blue-900 pb-4 mb-4 gap-4">
        {/* Left Placeholder Seal / Logo */}
        <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 border-2 border-blue-900 rounded-full p-1 text-center bg-slate-50">
          <span className="text-[10px] font-bold text-blue-950 uppercase tracking-tighter">IIPS</span>
          <span className="text-[8px] text-gray-500">FREETOWN</span>
        </div>

        {/* Center School Identity */}
        <div className="text-center flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-wide uppercase">
            {data.schoolInfo.name}
          </h1>
          <p className="text-xs md:text-sm font-semibold tracking-wide text-slate-700">
            {data.schoolInfo.address}
          </p>
          <p className="italic text-xs text-blue-800 font-medium my-0.5">
            Motto: {data.schoolInfo.motto}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500">
            Contacts: {data.schoolInfo.contacts.join(' | ')} &bull; Email: {data.schoolInfo.email}
          </p>
          
          <h2 className="mt-3 px-3 py-1.5 text-xs md:text-sm font-bold bg-blue-50 text-blue-950 border border-blue-200 rounded-md tracking-wider inline-block">
            ({data.schoolInfo.academicYear}) - {data.schoolInfo.reportSheetTitle}
          </h2>
        </div>

        {/* Right Seal */}
        <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 border-2 border-emerald-800 rounded-full p-1 text-center bg-slate-50">
          <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-tighter">OFFICIAL</span>
          <span className="text-[8px] text-gray-500">SEAL</span>
        </div>
      </div>

      {/* Grid of Student Details and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        
        {/* Student Personal Data (6 Columns) */}
        <div className="lg:col-span-6 border border-slate-200 rounded-lg p-3 bg-slate-50/50 shadow-inner">
          <h3 className="text-xs font-bold bg-blue-900 text-white px-2 py-1 rounded mb-2 tracking-wide">
            STUDENT'S PERSONAL DATA
          </h3>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <p className="col-span-2"><strong>Name:</strong> <span className="text-slate-900 uppercase font-medium">{data.studentPersonalData.name}</span></p>
            <p className="col-span-2"><strong>Class Teacher:</strong> <span className="text-slate-900">{data.studentPersonalData.classTeacher}</span></p>
            <p><strong>Sex:</strong> <span className="text-slate-900">{data.studentPersonalData.sex}</span></p>
            <p><strong>Class:</strong> <span className="text-slate-900">{data.studentPersonalData.class}</span></p>
            <p className="col-span-2"><strong>Admission No:</strong> <span className="text-slate-900">{data.studentPersonalData.admissionNo}</span></p>
          </div>
        </div>

        {/* Attendance (3 Columns) */}
        <div className="lg:col-span-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50 shadow-inner">
          <h3 className="text-xs font-bold bg-blue-900 text-white px-2 py-1 rounded mb-2 tracking-wide">
            ATTENDANCE
          </h3>
          <div className="space-y-1.5 text-xs">
            <p className="flex justify-between"><strong>No. of Times Late:</strong> <span className="font-semibold text-red-600">{data.attendance.timesLate}</span></p>
            <p className="flex justify-between"><strong>No. of Times Present:</strong> <span className="font-semibold text-emerald-700">{data.attendance.timesPresent}</span></p>
            <p className="flex justify-between"><strong>No. of Times Absent:</strong> <span className="font-semibold text-amber-600">{data.attendance.timesAbsent}</span></p>
          </div>
        </div>

        {/* Global Summary Indicators (3 Columns) */}
        <div className="lg:col-span-3 border border-blue-200 rounded-lg p-3 bg-blue-50/40 shadow-inner">
          <h3 className="text-xs font-bold bg-emerald-800 text-white px-2 py-1 rounded mb-2 tracking-wide">
            OVERALL STANDING
          </h3>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between"><strong>Obtainable Score:</strong> <span>{data.academicSummary.totalScoreObtainable.toFixed(1)}</span></p>
            <p className="flex justify-between"><strong>Total Obtained:</strong> <span className="font-semibold">{data.academicSummary.totalScoreObtained.toFixed(1)}</span></p>
            <p className="flex justify-between"><strong>Average Avg %:</strong> <span className="font-semibold text-blue-900">{data.academicSummary.averagePercentage}%</span></p>
            <p className="flex justify-between border-t pt-1 mt-1"><strong>No. in Class:</strong> <span>{data.academicSummary.noInClass}</span></p>
            <p className="flex justify-between text-rose-700 font-bold"><strong>Final Position:</strong> <span>{data.academicSummary.position}</span></p>
          </div>
        </div>
      </div>

      {/* Primary Academic Results Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-300 mb-6">
        <table className="w-full border-collapse text-left bg-white">
          <thead>
            {/* Main Header Rows */}
            <tr className="bg-slate-800 text-white text-[10px] uppercase font-semibold text-center divide-x divide-slate-700">
              <th className="p-2 min-w-[160px]" rowSpan="2">Subject</th>
              <th className="p-2 w-[45px]" rowSpan="2">Max</th>
              <th className="p-1" colSpan="4">First Term</th>
              <th className="p-1" colSpan="4">Second Term</th>
              <th className="p-1" colSpan="4">Third Term</th>
              <th className="p-1" colSpan="4">Yearly Summary</th>
            </tr>
            <tr className="bg-slate-700 text-white text-[8px] uppercase tracking-wider text-center divide-x divide-slate-600">
              {/* First Term Headers */}
              <th className="p-1 w-[35px]">Test</th>
              <th className="p-1 w-[35px]">Exam</th>
              <th className="p-1 w-[35px]">MN</th>
              <th className="p-1 w-[35px]">Rnk</th>
              {/* Second Term Headers */}
              <th className="p-1 w-[35px]">Test</th>
              <th className="p-1 w-[35px]">Exam</th>
              <th className="p-1 w-[35px]">MN</th>
              <th className="p-1 w-[35px]">Rnk</th>
              {/* Third Term Headers */}
              <th className="p-1 w-[35px]">Test</th>
              <th className="p-1 w-[35px]">Exam</th>
              <th className="p-1 w-[35px]">MN</th>
              <th className="p-1 w-[35px]">Rnk</th>
              {/* Yearly Headers */}
              <th className="p-1 w-[40px]">Mean</th>
              <th className="p-1 w-[35px]">Rank</th>
              <th className="p-1 w-[35px]">Gr.</th>
              <th className="p-1 min-w-[75px]">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[10px] font-medium text-slate-800">
            {data.academicPerformance.map((row, index) => (
              <tr key={index} className="hover:bg-blue-50/30 transition-colors odd:bg-slate-50/30 even:bg-white text-center divide-x divide-slate-200">
                {/* Subject name aligned to the left */}
                <td className="p-2 text-left font-semibold text-slate-900 border-r border-slate-200">
                  {row.subject}
                </td>
                <td className="p-2 font-semibold text-slate-500 bg-slate-100/50">{row.max}</td>
                
                {/* First Term Metrics */}
                <td className="p-1">{row.firstTerm.test}</td>
                <td className="p-1">{row.firstTerm.exam}</td>
                <td className="p-1 bg-blue-50/20 font-semibold text-blue-950">{row.firstTerm.mean.toFixed(1)}</td>
                <td className="p-1 text-slate-400 text-[9px]">{row.firstTerm.rank}</td>
                
                {/* Second Term Metrics */}
                <td className={`p-1 ${row.secondTerm.test < 40 ? 'text-rose-600 font-bold' : ''}`}>{row.secondTerm.test}</td>
                <td className={`p-1 ${row.secondTerm.exam < 50 ? 'text-rose-600 font-bold' : ''}`}>{row.secondTerm.exam}</td>
                <td className="p-1 bg-blue-50/20 font-semibold text-blue-950">{row.secondTerm.mean.toFixed(1)}</td>
                <td className="p-1 text-slate-400 text-[9px]">{row.secondTerm.rank}</td>
                
                {/* Third Term Metrics */}
                <td className={`p-1 ${row.thirdTerm.test < 50 ? 'text-rose-600 font-bold' : ''}`}>{row.thirdTerm.test}</td>
                <td className={`p-1 ${row.thirdTerm.exam < 50 ? 'text-rose-600 font-bold' : ''}`}>{row.thirdTerm.exam}</td>
                <td className="p-1 bg-blue-50/20 font-semibold text-blue-950">{row.thirdTerm.mean.toFixed(1)}</td>
                <td className="p-1 text-slate-400 text-[9px]">{row.thirdTerm.rank}</td>
                
                {/* Yearly Statistics */}
                <td className="p-1 bg-emerald-50/30 font-bold text-slate-900 text-[11px]">{row.yearly.mean.toFixed(1)}</td>
                <td className="p-1 text-slate-500 font-normal">{row.yearly.rank}</td>
                <td className={`p-1 font-bold ${row.yearly.grade === 'A' ? 'text-emerald-700' : 'text-slate-800'}`}>{row.yearly.grade}</td>
                <td className={`p-1 font-bold text-[9px] tracking-tight ${row.yearly.remarks === 'EXCELLENT' ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {row.yearly.remarks}
                </td>
              </tr>
            ))}

            {/* Calculations Totals Bottom Row */}
            <tr className="bg-slate-100 font-bold text-[10px] text-center divide-x divide-slate-200 border-t border-slate-300">
              <td className="p-2 text-left text-slate-950 uppercase font-black">TOTAL MARKS</td>
              <td className="p-2 bg-slate-200 text-slate-500">1200</td>
              <td className="p-1">{data.totalsAndPercentages.firstTerm.testTotal}</td>
              <td className="p-1">{data.totalsAndPercentages.firstTerm.examTotal}</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.firstTerm.meanTotal.toFixed(1)}</td>
              <td className="p-1 text-slate-400">---</td>
              
              <td className="p-1">{data.totalsAndPercentages.secondTerm.testTotal}</td>
              <td className="p-1">{data.totalsAndPercentages.secondTerm.examTotal}</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.secondTerm.meanTotal.toFixed(1)}</td>
              <td className="p-1 text-slate-400">---</td>

              <td className="p-1">{data.totalsAndPercentages.thirdTerm.testTotal}</td>
              <td className="p-1">{data.totalsAndPercentages.thirdTerm.examTotal}</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.thirdTerm.meanTotal.toFixed(1)}</td>
              <td className="p-1 text-slate-400">---</td>

              <td className="p-1 bg-emerald-100 font-extrabold text-slate-950" colSpan="2">
                {data.totalsAndPercentages.yearly.meanTotal.toFixed(1)}
              </td>
              <td className="p-1 text-slate-400" colSpan="2">---</td>
            </tr>

            {/* Total Percentage Score Row */}
            <tr className="bg-slate-100 font-bold text-[10px] text-center divide-x divide-slate-200">
              <td className="p-2 text-left text-slate-950 uppercase font-black">PERCENTAGE</td>
              <td className="p-2 bg-slate-200 text-slate-500">---</td>
              <td className="p-1 text-blue-950">{data.totalsAndPercentages.firstTerm.testPercent}%</td>
              <td className="p-1 text-blue-950">{data.totalsAndPercentages.firstTerm.examPercent}%</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.firstTerm.meanPercent}%</td>
              <td className="p-1 text-blue-900 text-[9px]">{data.totalsAndPercentages.firstTerm.rank}</td>
              
              <td className="p-1 text-blue-950">{data.totalsAndPercentages.secondTerm.testPercent}%</td>
              <td className="p-1 text-blue-950">{data.totalsAndPercentages.secondTerm.examPercent}%</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.secondTerm.meanPercent}%</td>
              <td className="p-1 text-blue-900 text-[9px]">{data.totalsAndPercentages.secondTerm.rank}</td>

              <td className="p-1 text-blue-950">{data.totalsAndPercentages.thirdTerm.testPercent}%</td>
              <td className="p-1 text-blue-950">{data.totalsAndPercentages.thirdTerm.examPercent}%</td>
              <td className="p-1 bg-blue-100 text-blue-950">{data.totalsAndPercentages.thirdTerm.meanPercent}%</td>
              <td className="p-1 text-blue-900 text-[9px]">{data.totalsAndPercentages.thirdTerm.rank}</td>

              <td className="p-1 bg-emerald-100 font-extrabold text-slate-950" colSpan="2">
                {data.totalsAndPercentages.yearly.percentage}%
              </td>
              <td className="p-1 text-rose-700 font-extrabold" colSpan="2">
                {data.totalsAndPercentages.yearly.rank}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Keys to Ratings Legend */}
      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 mb-6">
        <h4 className="text-[10px] font-bold text-slate-700 tracking-wider mb-2 text-center uppercase">
          Keys to Rating
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] text-center font-semibold">
          {keysToRating.map((key, i) => (
            <div key={i} className="p-1 border border-slate-200 rounded bg-white shadow-sm">
              <span className="text-slate-500">{key.range}</span> &rarr; <span className="text-blue-950">{key.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Comments, Promotion Status, Signatures */}
      <div className="border-t border-slate-300 pt-4 flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6">
        {/* Comments Block */}
        <div className="flex-1 space-y-3">
          <div className="text-xs">
            <span className="font-bold text-slate-700 uppercase">Class Teacher's Comments:</span>
            <span className="ml-2 font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 decoration-wavy">
              {data.remarksAndPromotion.classTeachersComment}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-700 uppercase">Promotion Status:</span>
            <span className="ml-2 font-bold text-emerald-800 tracking-wide">
              {data.remarksAndPromotion.promotionStatus}
            </span>
          </div>
        </div>

        {/* Date and Signature Blocks */}
        <div className="flex flex-col sm:flex-row md:items-end gap-6 text-xs min-w-[280px]">
          <div className="flex-1">
            <span className="font-bold text-slate-700 block mb-3 uppercase">Sign:</span>
            <div className="w-full border-b border-dashed border-slate-400 h-6"></div>
          </div>
          <div>
            <span className="font-bold text-slate-700 block mb-1 uppercase">Date:</span>
            <span className="font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-800 text-[11px] font-bold">
              {data.remarksAndPromotion.date}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}