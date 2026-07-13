import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../firebase";
import { schooldb } from "../Database/SchoolsResults";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";

const TermResult = () => {
  const [academicYear, setAcademicYear] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedPupil, setSelectedPupil] = useState("all");
  const [pupils, setPupils] = useState([]);
  const [classGradesData, setClassGradesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const location = useLocation();

  const { schoolId, schoolName, schoolLogoUrl } = location.state || {};

  const termTests = {
    "Term 1": ["Term 1 T1", "Term 1 T2"],
    "Term 2": ["Term 2 T1", "Term 2 T2"],
    "Term 3": ["Term 3 T1", "Term 3 T2"],
  };

  const tests = termTests[selectedTerm];

  // Fetch initial metadata
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(schooldb, "PupilGrades"), where("schoolId", "==", schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      const years = [...new Set(data.map((d) => d.academicYear))].sort().reverse();
      const classes = [...new Set(data.map((d) => d.className))].sort();
      setAcademicYears(years);
      setAvailableClasses(classes);
      if (years.length > 0 && !academicYear) setAcademicYear(years[0]);
      if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
    });
    return () => unsubscribe();
  }, [schoolId]);

  // Fetch pupils and grades data streams
  useEffect(() => {
    if (!academicYear || !selectedClass || !schoolId) return;
    setLoading(true);
    const pQuery = query(collection(db, "PupilsReg"), where("schoolId", "==", schoolId), where("academicYear", "==", academicYear), where("class", "==", selectedClass));
    const gQuery = query(collection(schooldb, "PupilGrades"), where("academicYear", "==", academicYear), where("schoolId", "==", schoolId), where("className", "==", selectedClass));

    const unsubPupils = onSnapshot(pQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.studentName.localeCompare(b.studentName));
      setPupils(data);
    });

    const unsubGrades = onSnapshot(gQuery, (snapshot) => {
      setClassGradesData(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    });

    return () => { unsubPupils(); unsubGrades(); };
  }, [academicYear, selectedClass, schoolId]);

  // Matrix Processing Engine
  const broadSheetData = useMemo(() => {
    if (classGradesData.length === 0 || pupils.length === 0) return { subjects: [], studentMap: {}, summaries: {} };

    const uniqueSubjects = [...new Set(classGradesData.map(d => d.subject))].sort();
    const studentMap = {};
    const summaries = {};

    const subjectRanks = {};
    uniqueSubjects.forEach(subject => {
      const scores = pupils.map(p => {
        const g = classGradesData.filter(x => x.pupilID === p.studentID && x.subject === subject);
        const t1 = Number(g.find(x => x.test === tests[0])?.grade || 0);
        const t2 = Number(g.find(x => x.test === tests[1])?.grade || 0);
        return { id: p.studentID, mean: (t1 + t2) / 2 };
      });
      scores.sort((a, b) => b.mean - a.mean);
      scores.forEach((s, i) => {
        if (i > 0 && s.mean === scores[i - 1].mean) s.rank = scores[i - 1].rank;
        else s.rank = i + 1;
      });
      subjectRanks[subject] = scores;
    });

    const overallScores = pupils.map(p => {
      const pData = classGradesData.filter(x => x.pupilID === p.studentID);
      const total = uniqueSubjects.reduce((acc, sub) => {
        const g = pData.filter(x => x.subject === sub);
        const t1 = Number(g.find(x => x.test === tests[0])?.grade || 0);
        const t2 = Number(g.find(x => x.test === tests[1])?.grade || 0);
        return acc + ((t1 + t2) / 2);
      }, 0);
      return { id: p.studentID, total };
    });

    overallScores.sort((a, b) => b.total - a.total);
    overallScores.forEach((s, i) => {
      if (i > 0 && s.total === overallScores[i - 1].total) s.pos = overallScores[i - 1].pos;
      else s.pos = i + 1;
    });

    pupils.forEach(pupil => {
      const results = {};
      uniqueSubjects.forEach(sub => {
        const g = classGradesData.filter(x => x.pupilID === pupil.studentID && x.subject === sub);
        const t1 = g.find(x => x.test === tests[0])?.grade || 0;
        const t2 = g.find(x => x.test === tests[1])?.grade || 0;
        results[sub] = { t1, t2, mean: Math.round((Number(t1) + Number(t2)) / 2), rank: subjectRanks[sub].find(s => s.id === pupil.studentID)?.rank || "—" };
      });
      studentMap[pupil.studentID] = results;

      const ov = overallScores.find(o => o.id === pupil.studentID);
      summaries[pupil.studentID] = {
        total: Math.round(ov.total),
        percentage: uniqueSubjects.length > 0 ? ((ov.total / (uniqueSubjects.length * 100)) * 100).toFixed(1) : 0,
        rank: ov.pos
      };
    });

    return { subjects: uniqueSubjects, studentMap, summaries };
  }, [classGradesData, pupils, tests]);

  // Print Mode A: Original Layout (Subjects on Left, Students on Top)
 // Print Mode A: Original Layout (Subjects on Left, Students on Top)
  const handlePrintStandard = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    const allFilteredPupils = pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil);
    
    const pupilsPerPage = 8; 
    const totalPupils = allFilteredPupils.length;

    for (let i = 0; i < totalPupils; i += pupilsPerPage) {
      const pupilChunk = allFilteredPupils.slice(i, i + pupilsPerPage);
      if (i > 0) doc.addPage();

      doc.setFontSize(22).setFont(undefined, 'bold');
      doc.text(schoolName.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 45, { align: "center" });
      
      doc.setFontSize(14).setFont(undefined, 'normal');
      doc.text(`${selectedClass} BROAD SHEET - ${selectedTerm} (${academicYear}) | Page ${Math.floor(i / pupilsPerPage) + 1}`, doc.internal.pageSize.getWidth() / 2, 70, { align: "center" });

      const head1 = [
        { content: "SUBJECTS", styles: { halign: 'left', fillColor: [40, 44, 52] } }, 
        ...pupilChunk.map(p => ({ content: p.studentName.toUpperCase(), colSpan: 4, styles: { halign: 'center', fillColor: [63, 81, 181], fontSize: 11 } })) // Increased header student name size slightly
      ];
      const head2 = ["", ...pupilChunk.flatMap(() => ["T1", "T2", "Mn", "RNK"])];

      const body = broadSheetData.subjects.map(sub => [
        sub,
        ...pupilChunk.flatMap(p => {
          const r = broadSheetData.studentMap[p.studentID]?.[sub] || {};
          return [r.t1 || "0", r.t2 || "0", r.mean || "0", r.rank || "-"];
        })
      ]);

      const footerStyles = { fontStyle: 'bold', halign: 'center', fontSize: 13 }; // Increased footer text size
      const totalRow = ["TOTAL MARKS", ...pupilChunk.flatMap(p => [{ content: broadSheetData.summaries[p.studentID].total, colSpan: 4, styles: { ...footerStyles, fillColor: [240, 240, 240] } }])];
      const percRow = ["PERCENTAGE", ...pupilChunk.flatMap(p => [{ content: broadSheetData.summaries[p.studentID].percentage + "%", colSpan: 4, styles: { ...footerStyles, fillColor: [240, 240, 240] } }])];
      const rankRow = ["OVERALL RANK", ...pupilChunk.flatMap(p => [{ content: broadSheetData.summaries[p.studentID].rank, colSpan: 4, styles: { ...footerStyles, textColor: [200, 0, 0], fillColor: [230, 230, 250], fontSize: 14 } }])];

      autoTable(doc, {
        startY: 90,
        head: [head1, head2],
        body: [...body, totalRow, percRow, rankRow],
        theme: 'grid',
        // CHANGED: Increased general body font size from 10 to 12 for better grade legibility
        styles: { fontSize: 12, cellPadding: 6, valign: 'middle', lineWidth: 0.5, lineColor: [150, 150, 150] }, 
        headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255], fontSize: 11, cellPadding: 8 },
        // CHANGED: Match or scale the subject column size to complement the new grade size
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120, fillColor: [245, 245, 245], fontSize: 12 } }, 
        didParseCell: (data) => {
          if (data.section === 'body' && typeof data.cell.raw === 'number' && data.cell.raw < 50) {
            data.cell.styles.textColor = [220, 0, 0];
          }
        },
        margin: { left: 20, right: 20, bottom: 40 },
      });
    }
    doc.save(`${selectedClass}_Standard_BroadSheet_${selectedTerm}.pdf`);
  };

  // Print Mode B: Transposed Layout (Names on Left, Subjects on Top)
  const handlePrintTransposed = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    const allFilteredPupils = pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil);
    
    // Chunking subjects up to 6 items per page to safely fit horizontal structures cleanly
    const subjectsPerPage = 6; 
    const totalSubjects = broadSheetData.subjects.length;

    for (let sIdx = 0; sIdx < totalSubjects; sIdx += subjectsPerPage) {
      const subjectChunk = broadSheetData.subjects.slice(sIdx, sIdx + subjectsPerPage);
      
      // Determine if this layout represents the terminal subject chunk
      const isLastChunk = (sIdx + subjectsPerPage) >= totalSubjects;

      if (sIdx > 0) doc.addPage();

      // Heading block
      doc.setFontSize(22).setFont(undefined, 'bold');
      doc.text(schoolName.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 45, { align: "center" });
      
      doc.setFontSize(14).setFont(undefined, 'normal');
      doc.text(`${selectedClass} TRANSPOSED BROAD SHEET - ${selectedTerm} (${academicYear}) | Part ${Math.floor(sIdx / subjectsPerPage) + 1}`, doc.internal.pageSize.getWidth() / 2, 70, { align: "center" });

      // Build fundamental structural header cells
      const head1 = [
        { content: "STUDENT NAMES", rowSpan: 2, styles: { valign: 'middle', halign: 'left', fillColor: [40, 44, 52] } },
        ...subjectChunk.map(sub => ({ content: sub.toUpperCase(), colSpan: 4, styles: { halign: 'center', fillColor: [63, 81, 181], fontSize: 9 } }))
      ];

      const head2 = [
        ...subjectChunk.flatMap(() => ["T1", "T2", "AVG", "RANK"])
      ];

      // Append general calculations row array configurations only on final chunk
      if (isLastChunk) {
        head1.push({ content: "OVERALL STATS", colSpan: 3, styles: { halign: 'center', fillColor: [30, 41, 59], fontSize: 9 } });
        head2.push("TOTAL", "PERC", "OVERALL RANK");
      }

      // Build out row content mapping strings per student record
      const body = allFilteredPupils.map(p => {
        const studentRow = [p.studentName.toUpperCase()];
        
        // Subject scores block loop
        subjectChunk.forEach(sub => {
          const r = broadSheetData.studentMap[p.studentID]?.[sub] || {};
          studentRow.push(r.t1 || "0", r.t2 || "0", r.mean || "0", r.rank || "-");
        });

        // Add overall metrics safely tracking trailing position on last sheet
        if (isLastChunk) {
          const summary = broadSheetData.summaries[p.studentID] || {};
          studentRow.push(summary.total || "0", (summary.percentage || "0") + "%", summary.rank || "-");
        }

        return studentRow;
      });

      autoTable(doc, {
        startY: 90,
        head: [head1, head2],
        body: body,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 5, valign: 'middle', lineWidth: 0.5, lineColor: [150, 150, 150], halign: 'center' },
        headStyles: { textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 150, halign: 'left', fillColor: [245, 245, 245] }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const subjectsActiveSpan = subjectChunk.length * 4;
            
            if (data.column.index > 0 && data.column.index <= subjectsActiveSpan) {
              // Highlight ranks inside subject columns
              const isRankSubCol = data.column.index % 4 === 0;
              if (isRankSubCol) {
                data.cell.styles.textColor = [190, 24, 74];
                data.cell.styles.fontStyle = 'bold';
              } else {
                const scoreVal = parseFloat(data.cell.raw);
                if (!isNaN(scoreVal) && scoreVal < 50) {
                  data.cell.styles.textColor = [220, 0, 0];
                }
              }
            }
            
            // Style the overall final rank summary column uniquely on final chunk sheet
            if (isLastChunk && data.column.index === subjectsActiveSpan + 3) {
              data.cell.styles.textColor = [200, 0, 0];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 253];
            }
          }
        },
        margin: { left: 20, right: 20, bottom: 40 },
      });
    }
    doc.save(`${selectedClass}_Transposed_BroadSheet_${selectedTerm}.pdf`);
  };

  const getGradeColor = (val) => {
    const grade = Number(val);
    if (grade >= 50) return "text-blue-600 font-bold";
    if (grade > 0 && grade <= 49) return "text-red-600 font-bold";
    return "text-gray-400";
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-xl rounded-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-indigo-700">{schoolName} Broad Sheet Control Center</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrintStandard}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-semibold text-sm"
          >
            Print Standard Matrix (Subjects Left)
          </button>
          <button
            onClick={handlePrintTransposed}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-semibold text-sm"
          >
            Print Transposed Matrix (Names Left)
          </button>
        </div>
      </div>

      {/* Filters Form Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 border rounded-lg bg-indigo-50">
        <div>
          <label className="block text-xs font-bold mb-1">Term</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
            {Object.keys(termTests).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Academic Year</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            {academicYears.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Class</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {availableClasses.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">View Mode</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedPupil} onChange={(e) => setSelectedPupil(e.target.value)}>
            <option value="all">All Students</option>
            {pupils.map((p) => <option key={p.studentID} value={p.studentID}>{p.studentName}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-indigo-600 font-bold">Fetching grades...</div>
      ) : (
        <div className="overflow-x-auto border rounded-xl shadow-inner">
          <table className="min-w-full text-[10px] text-center border-collapse">
            <thead className="bg-indigo-700 text-white sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 border-r sticky left-0 bg-indigo-800 z-30" rowSpan="2">Subject</th>
                {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => (
                  <th key={p.studentID} colSpan="4" className="px-2 py-2 border-b border-r min-w-[140px] uppercase">
                    {p.studentName}
                  </th>
                ))}
              </tr>
              <tr className="bg-indigo-600 text-[9px]">
                {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => (
                  <React.Fragment key={`sub-${p.studentID}`}>
                    <th className="px-1 py-1 border-r">T1</th>
                    <th className="px-1 py-1 border-r">T2</th>
                    <th className="px-1 py-1 border-r bg-indigo-800">Mn</th>
                    <th className="px-1 py-1 border-r text-red-200">Rnk</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {broadSheetData.subjects.map((sub) => (
                <tr key={sub} className="border-b hover:bg-gray-50 bg-white">
                  <td className="text-left px-4 py-2 font-bold border-r sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{sub}</td>
                  {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => {
                    const res = broadSheetData.studentMap[p.studentID]?.[sub] || {};
                    return (
                      <React.Fragment key={`${p.studentID}-${sub}`}>
                        <td className={`px-1 py-2 border-r ${getGradeColor(res.t1)}`}>{res.t1 || "-"}</td>
                        <td className={`px-1 py-2 border-r ${getGradeColor(res.t2)}`}>{res.t2 || "-"}</td>
                        <td className={`px-1 py-2 border-r font-bold bg-gray-50 ${getGradeColor(res.mean)}`}>{res.mean || "-"}</td>
                        <td className="px-1 py-2 border-r font-bold text-red-600">{res.rank}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              
              {/* Table Footer Elements */}
              <tr className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                <td className="sticky left-0 bg-gray-100 px-4 py-3 border-r text-indigo-900">Combined Scores</td>
                {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => (
                  <td key={`tot-${p.studentID}`} colSpan="4" className="border-r text-sm text-indigo-700">
                    {broadSheetData.summaries[p.studentID]?.total}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-100 font-bold border-t">
                <td className="sticky left-0 bg-gray-100 px-4 py-3 border-r text-indigo-900">Percentage</td>
                {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => (
                  <td key={`per-${p.studentID}`} colSpan="4" className="border-r text-sm text-indigo-700">
                    {broadSheetData.summaries[p.studentID]?.percentage}%
                  </td>
                ))}
              </tr>
              <tr className="bg-indigo-50 font-black border-t-2 border-indigo-300">
                <td className="sticky left-0 bg-indigo-100 px-4 py-3 border-r text-indigo-900">Final Position</td>
                {pupils.filter(p => selectedPupil === "all" || p.studentID === selectedPupil).map(p => (
                  <td key={`pos-${p.studentID}`} colSpan="4" className="border-r text-lg text-red-600">
                    {broadSheetData.summaries[p.studentID]?.rank}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TermResult;