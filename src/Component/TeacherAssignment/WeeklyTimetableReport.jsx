import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { schoollpq } from "../Database/schoollibAndPastquestion";
import { useAuth } from "../Security/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const WeeklyTimetableReport = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || "N/A";

    const [timetable, setTimetable] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(""); // Class filter

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = ["1", "2", "3", "4", "Lunch", "5", "6", "7", "8"];

    useEffect(() => {
        if (schoolId === "N/A") return;

        // Fetch Classes
        const unsubC = onSnapshot(
            query(collection(db, "ClassesAndSubjects"), where("schoolId", "==", schoolId)),
            (snapshot) => setAvailableClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        // Fetch Timetable
        const unsubT = onSnapshot(
            query(collection(schoollpq, "Timetables"), where("schoolId", "==", schoolId)),
            (snapshot) => setTimetable(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        return () => { unsubC(); unsubT(); };
    }, [schoolId]);

    const renderTimetableForClass = (className) => {
        const classTimetable = timetable
            .filter(t => t.className === className)
            .sort((a, b) => periods.indexOf(a.period) - periods.indexOf(b.period));

        return (
            <div key={`class-${className}`} className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{className} - Weekly Timetable</h2>
                    <button
                        className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-teal-700"
                        onClick={() => handleDownloadPDF(className, classTimetable)}
                    >
                        📄 Download PDF
                    </button>
                    <button
                        className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-teal-700"
                        onClick={() => handleDownloadLandscapePDF(className, classTimetable)}
                    >
                        📄 Download PDF landscape
                    </button>
                </div>

                {days.map((day, dayIdx) => {
                    const dayPeriods = classTimetable.filter(t => t.day === day);

                    return (
                        <div key={`day-${className}-${dayIdx}`} className="mb-4">
                            <h3 className="font-semibold text-teal-600">{day}</h3>
                            <table className="w-full text-sm border mt-2">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border px-2 py-1">Period</th>
                                        <th className="border px-2 py-1">Subject</th>
                                        <th className="border px-2 py-1">Teacher</th>
                                        <th className="border px-2 py-1">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayPeriods.map((p, idx) => (
                                        <tr key={`${p.id}-${p.day}-${p.period}-${idx}`}>
                                            <td className="border px-2 py-1 text-center">
                                                {p.period === "Lunch" ? "LUNCH" : `P${p.period}`}
                                            </td>
                                            <td className="border px-2 py-1 text-center">{p.subject || "-"}</td>
                                            <td className="border px-2 py-1 text-center">{p.teacher}</td>
                                            <td className="border px-2 py-1 text-center">{p.time}</td>
                                        </tr>
                                    ))}
                                    {dayPeriods.length === 0 && (
                                        <tr key={`empty-${dayIdx}`}>
                                            <td colSpan="4" className="text-center py-2 text-gray-400 italic">
                                                No periods scheduled
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        );
    };

   const handleDownloadPDF = (className, classTimetable) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(`${className} - Weekly Timetable`, pageWidth / 2, 40, { align: "center" });

    // Split days into two groups
    const firstHalfDays = ["Monday", "Tuesday", "Wednesday"];
    const secondHalfDays = ["Thursday", "Friday"];

    let startY = 70;

    const renderDays = (daysArray) => {
        daysArray.forEach((day) => {
            const dayPeriods = classTimetable.filter(t => t.day === day);

            doc.setFontSize(12);
            doc.setTextColor(20, 100, 100);
            doc.text(day, 40, startY);
            startY += 15;

            const tableData = dayPeriods.length > 0
                ? dayPeriods.map(p => [
                    p.period === "Lunch" ? "LUNCH" : `P${p.period}`,
                    p.subject || "-",
                    p.teacher,
                    p.time
                ])
                : [["-", "-", "-", "-"]];

            autoTable(doc, {
                startY,
                head: [["Period", "Subject", "Teacher", "Time"]],
                body: tableData,
                theme: "grid",
                styles: { fontSize: 9 },
                headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
                margin: { left: 40, right: 40 },
                didParseCell: (data) => {
                    if (data.row.index >= 0) {
                        const periodCell = data.row.cells[0];
                        if (periodCell.raw === "LUNCH") {
                            periodCell.styles.fillColor = [255, 247, 237]; // Light orange
                            periodCell.styles.textColor = [255, 102, 0];
                            periodCell.styles.fontStyle = "bold";
                        }
                    }
                }
            });

            startY = doc.lastAutoTable.finalY + 20;
        });
    };

    // Page 1: Monday - Wednesday
    renderDays(firstHalfDays);

    // Page 2: Thursday - Friday
    doc.addPage();
    startY = 70;
    doc.setFontSize(16);
    doc.text(`${className} - Weekly Timetable`, pageWidth / 2, 40, { align: "center" });
    renderDays(secondHalfDays);

    doc.save(`${className}_Weekly_Timetable.pdf`);
};

const handleDownloadLandscapePDF = (className, classTimetable) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(`${className} - Weekly Timetable`, pageWidth / 2, 30, { align: "center" });

    const periods = ["1", "2", "3", "4", "Lunch", "5", "6", "7", "8"];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Prepare table head
    const tableHead = ["Day", ...periods];

    // Prepare table body
    const tableBody = days.map(day => {
        const row = [day];

        periods.forEach(period => {
            const entry = classTimetable.find(t => t.day === day && t.period === period);
            if (entry) {
                if (period === "Lunch") {
                    row.push("LUNCH");
                } else {
                    row.push(`${entry.subject || "-"}\n${entry.teacher}\n${entry.time}`);
                }
            } else {
                row.push("-");
            }
        });

        return row;
    });

    autoTable(doc, {
        startY: 60,
        head: [tableHead],
        body: tableBody,
        styles: { fontSize: 9, cellPadding: 4, halign: "center", valign: "middle" },
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
        didParseCell: (data) => {
            if (data.cell.raw === "LUNCH") {
                data.cell.styles.fillColor = [255, 247, 237]; // Light orange
                data.cell.styles.textColor = [255, 102, 0];
                data.cell.styles.fontStyle = "bold";
            }
        }
    });

    doc.save(`${className}_Weekly_Timetable_Landscape.pdf`);
};



    const classesToDisplay = selectedClass
        ? availableClasses.filter(c => c.className === selectedClass)
        : availableClasses;

    return (
        <div className="p-4 min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold mb-6">Weekly Timetable Report</h1>

            {/* Class Filter */}
            <div className="mb-6">
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="border p-2 rounded-lg bg-white text-sm font-bold"
                >
                    <option value="">📚 All Classes</option>
                    {availableClasses.map((c, idx) => (
                        <option key={`${c.id}-${idx}`} value={c.className}>{c.className}</option>
                    ))}
                </select>
            </div>

            {classesToDisplay.length > 0 ? (
                classesToDisplay.map(c => renderTimetableForClass(c.className))
            ) : (
                <p className="text-gray-400 italic">No classes found</p>
            )}
        </div>
    );
};

export default WeeklyTimetableReport;
