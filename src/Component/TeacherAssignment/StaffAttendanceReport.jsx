
import React, { useState, useEffect, useMemo } from "react";
import {
    collection,
    query,
    where,
    onSnapshot
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../Security/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getTodayDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (time) => {

  if (!time) {
    return "N/A";
  }

  // Firebase Timestamp
  if (time?.toDate) {
    return time.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // JavaScript Date
  if (time instanceof Date) {
    return time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // String time such as "11:30 AM"
  if (typeof time === "string") {
    return time;
  }

  return "N/A";
};


// =====================================================
// STAFF SELF ATTENDANCE REPORT
// =====================================================

const StaffSelfAttendanceReport = () => {

  const { user } = useAuth();

  const schoolId =
    user?.schoolId ||
    user?.data?.schoolId ||
    "";

  const teacherID =
    user?.data?.teacherID ||
    user?.teacherID ||
    user?.id ||
    "";

  const teacherName =
    user?.data?.teacherName ||
    user?.teacherName ||
    "Teacher";


  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);


  // =====================================================
  // FILTER MODES
  // =====================================================

  const [filterMode, setFilterMode] = useState("single");

  const [singleDate, setSingleDate] =
    useState(getTodayDate());

  const [startDate, setStartDate] =
    useState(getTodayDate());

  const [endDate, setEndDate] =
    useState(getTodayDate());


  // =====================================================
  // FETCH MY ATTENDANCE
  // =====================================================

 useEffect(() => {

    if (!teacherID || !schoolId) {
        setAttendanceHistory([]);
        setLoading(false);
        return;
    }

    setLoading(true);

    const q = query(
        collection(db, "StaffAttendance"),
        where("schoolId", "==", schoolId),
        where("teacherID", "==", teacherID)
    );

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {

            const records = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAttendanceHistory(records);
            setLoading(false);
        },
        (error) => {

            console.error(
                "Error listening to staff attendance:",
                error
            );

            setAttendanceHistory([]);
            setLoading(false);
        }
    );

    return () => unsubscribe();

}, [schoolId, teacherID]);


  // =====================================================
  // FILTER RECORDS
  // =====================================================

  const filteredRecords = useMemo(() => {

    return attendanceHistory

      .filter(record => {

        if (!record.date) {
          return false;
        }


        // -----------------------------------------
        // SINGLE DATE
        // -----------------------------------------

        if (filterMode === "single") {

          return record.date === singleDate;

        }


        // -----------------------------------------
        // DATE RANGE
        // -----------------------------------------

        if (startDate && endDate) {

          return (
            record.date >= startDate &&
            record.date <= endDate
          );

        }


        if (startDate) {

          return record.date >= startDate;

        }


        if (endDate) {

          return record.date <= endDate;

        }


        return true;

      })


      // Latest date first
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      );

  }, [
    attendanceHistory,
    filterMode,
    singleDate,
    startDate,
    endDate
  ]);


  // =====================================================
  // STATISTICS
  // =====================================================

  const presentCount =
    filteredRecords.filter(
      r => r.status === "Present"
    ).length;


  const lateCount =
    filteredRecords.filter(
      r => r.status === "Late"
    ).length;


  const absentCount =
    filteredRecords.filter(
      r => r.status === "Absent"
    ).length;


  const excusedCount =
    filteredRecords.filter(
      r => r.status === "Excused"
    ).length;


  const leaveCount =
    filteredRecords.filter(
      r => r.status === "On Leave"
    ).length;


  // =====================================================
  // EXPORT PDF
  // =====================================================

  const exportPDF = () => {

    const doc = new jsPDF();


    const dateRangeLabel =
      filterMode === "single"
        ? `Date: ${singleDate}`
        : `Range: ${startDate} to ${endDate}`;


    doc.setFontSize(16);

    doc.text(
      "Staff Attendance Report",
      14,
      15
    );


    doc.setFontSize(10);

    doc.text(
      `Name: ${teacherName}`,
      14,
      22
    );


    doc.text(
      `Staff ID: ${teacherID}`,
      14,
      28
    );


    doc.text(
      dateRangeLabel,
      14,
      34
    );


    autoTable(doc, {

      startY: 41,

      head: [[
        "Date",
        "Status",
        "Clock-In",
        "Clock-Out",
        "Note"
      ]],

      body: filteredRecords.map(record => [

        record.date,

        record.status || "N/A",

        formatTime(
          record.clockInTime
        ),

        formatTime(
          record.clockOutTime
        ),

        record.note || ""

      ]),

      styles: {
        fontSize: 8
      },

      headStyles: {
        fillColor: [79, 70, 229]
      }

    });


    const fileName =
      filterMode === "single"
        ? `Attendance_${teacherName}_${singleDate}.pdf`
        : `Attendance_${teacherName}_${startDate}_to_${endDate}.pdf`;


    doc.save(fileName);

  };


  // =====================================================
  // CALENDAR MAP
  // =====================================================

  const calendarMap = useMemo(() => {

    const map = {};


    filteredRecords.forEach(record => {

      map[record.date] =
        record.status;

    });


    return map;

  }, [filteredRecords]);


  // =====================================================
  // ACTIVE MONTH
  // =====================================================

  const activeMonthStr =
    filterMode === "single"
      ? singleDate.slice(0, 7)
      : startDate.slice(0, 7);


  // =====================================================
  // CALENDAR DAYS
  // =====================================================

  const calendarDays = useMemo(() => {

    if (!activeMonthStr) {
      return [];
    }


    const [
      year,
      month
    ] = activeMonthStr.split("-");


    const daysInMonth =
      new Date(
        Number(year),
        Number(month),
        0
      ).getDate();


    return Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    );

  }, [activeMonthStr]);


  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "Present":
        return "bg-green-100 text-green-700 border-green-200";

      case "Late":
        return "bg-amber-100 text-amber-700 border-amber-200";

      case "Absent":
        return "bg-red-100 text-red-700 border-red-200";

      case "Excused":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "On Leave":
        return "bg-purple-100 text-purple-700 border-purple-200";

      default:
        return "bg-gray-50 text-gray-400 border-gray-100";

    }

  };


  // =====================================================
  // RETURN
  // =====================================================

  return (

    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">

      <div className="max-w-5xl mx-auto flex flex-col gap-6">


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-tight">

              Daily Attendance Log

            </h1>


            <p className="text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest">

              Staff Attendance Record

            </p>

          </div>


          <div className="bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-indigo-100 text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase">

              Staff Name

            </p>


            <p className="text-xs sm:text-sm font-bold text-indigo-900">

              {teacherName}

            </p>


            <p className="text-[9px] text-indigo-500 mt-0.5">

              ID: {teacherID}

            </p>

          </div>

        </div>


        {/* =====================================================
            FILTER CONTROL
        ===================================================== */}

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">

            <label className="text-xs font-black uppercase text-gray-500 tracking-wider">

              Filter Mode:

            </label>


            <div className="flex gap-2 w-full sm:w-auto">

              <button
                onClick={() =>
                  setFilterMode("single")
                }
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterMode === "single"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >

                📅 By Specific Day

              </button>


              <button
                onClick={() =>
                  setFilterMode("range")
                }
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterMode === "range"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >

                📆 Between Dates

              </button>

            </div>

          </div>


          {/* =====================================================
              DATE INPUTS
          ===================================================== */}

          <div className="flex flex-col sm:flex-row justify-between items-end gap-4">

            {filterMode === "single" ? (

              <div className="w-full sm:w-auto">

                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">

                  Select Day:

                </label>


                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) =>
                    setSingleDate(e.target.value)
                  }
                  className="border rounded-xl px-4 py-2 text-sm font-bold bg-gray-50 shadow-sm w-full sm:w-64 focus:bg-white transition"
                />

              </div>

            ) : (

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                <div className="w-full sm:w-auto">

                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">

                    From Date:

                  </label>


                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="border rounded-xl px-4 py-2 text-sm font-bold bg-gray-50 shadow-sm w-full sm:w-48 focus:bg-white transition"
                  />

                </div>


                <div className="w-full sm:w-auto">

                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">

                    To Date:

                  </label>


                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                    className="border rounded-xl px-4 py-2 text-sm font-bold bg-gray-50 shadow-sm w-full sm:w-48 focus:bg-white transition"
                  />

                </div>

              </div>

            )}


            {/* EXPORT */}

            <button
              onClick={exportPDF}
              disabled={filteredRecords.length === 0}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-indigo-700 w-full sm:w-auto transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >

              📄 Export PDF

            </button>

          </div>

        </div>


        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">


          {/* PRESENT */}

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">

              Days Present

            </p>

            <p className="text-xl sm:text-2xl font-black text-green-600">

              {presentCount}

            </p>

          </div>


          {/* LATE */}

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">

              Days Late

            </p>

            <p className="text-xl sm:text-2xl font-black text-amber-500">

              {lateCount}

            </p>

          </div>


          {/* ABSENT */}

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">

              Days Absent

            </p>

            <p className="text-xl sm:text-2xl font-black text-red-600">

              {absentCount}

            </p>

          </div>


          {/* EXCUSED */}

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">

              Excused

            </p>

            <p className="text-xl sm:text-2xl font-black text-blue-600">

              {excusedCount}

            </p>

          </div>


          {/* LEAVE */}

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase">

              On Leave

            </p>

            <p className="text-xl sm:text-2xl font-black text-purple-600">

              {leaveCount}

            </p>

          </div>

        </div>


        {/* =====================================================
            ATTENDANCE RECORDS
        ===================================================== */}

        <div className="space-y-3 overflow-x-auto">


          {loading ? (

            <div className="text-center py-6 font-bold text-gray-400 animate-pulse uppercase text-sm">

              Syncing Records...

            </div>

          ) : filteredRecords.length > 0 ? (

            filteredRecords.map(record => (

              <div
                key={record.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
              >

                {/* DATE + STATUS */}

                <div className="flex flex-col sm:flex-row justify-between gap-3">

                  <div className="flex items-center gap-3 sm:gap-4">

                    <div className="bg-gray-100 h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex flex-col items-center justify-center text-gray-500">

                      <span className="text-[7px] sm:text-[8px] font-black uppercase">

                        Date

                      </span>


                      <span className="text-xs sm:text-sm font-bold">

                        {record.date.split("-")[2]}

                      </span>

                    </div>


                    <div>

                      <p className="text-[9px] sm:text-xs font-black text-gray-400 uppercase">

                        {new Date(
                          `${record.date}T00:00:00`
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          }
                        )}

                      </p>


                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">

                        Attendance Record

                      </h3>

                    </div>

                  </div>


                  <div
                    className={`self-start px-3 sm:px-5 py-1 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${getStatusClass(
                      record.status
                    )}`}
                  >

                    {record.status}

                  </div>

                </div>


                {/* CLOCK TIMES */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">

                    <p className="text-[9px] font-black uppercase text-green-500">

                      Clock-In

                    </p>


                    <p className="text-sm font-bold text-green-800">

                      {formatTime(
                        record.clockInTime
                      )}

                    </p>

                  </div>


                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">

                    <p className="text-[9px] font-black uppercase text-red-500">

                      Clock-Out

                    </p>


                    <p className="text-sm font-bold text-red-800">

                      {formatTime(
                        record.clockOutTime
                      )}

                    </p>

                  </div>

                </div>


                {/* NOTE */}

                {record.note && (

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">

                    <p className="text-[9px] font-black uppercase text-gray-400">

                      Note

                    </p>


                    <p className="text-xs text-gray-600 italic">

                      "{record.note}"

                    </p>

                  </div>

                )}


                {/* MANUAL / FINAL STATUS */}

                <div className="flex flex-wrap gap-2">

                  {record.isManual && (

                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase">

                      Manual Entry

                    </span>

                  )}


                  {record.isFinal && (

                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[9px] font-bold uppercase">

                      Finalized

                    </span>

                  )}

                </div>

              </div>

            ))

          ) : (

            <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">

              <p className="text-gray-400 font-bold uppercase text-sm">

                No attendance records found for this date selection.

              </p>

            </div>

          )}

        </div>


        {/* =====================================================
            MONTHLY CALENDAR
        ===================================================== */}

        {activeMonthStr && (

          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border mt-2">

            <h3 className="font-black text-gray-700 mb-3 uppercase text-sm sm:text-base">

              Monthly Visual Overview ({activeMonthStr})

            </h3>


            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[8px] sm:text-xs font-bold">


              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat"
              ].map(day => (

                <div
                  key={day}
                  className="text-gray-400"
                >

                  {day}

                </div>

              ))}


              {calendarDays.map(day => {

                const dateStr =
                  `${activeMonthStr}-${String(day).padStart(2, "0")}`;


                const status =
                  calendarMap[dateStr];


                return (

                  <div
                    key={dateStr}
                    className={`h-8 sm:h-10 flex items-center justify-center rounded-xl border text-[8px] sm:text-xs font-bold ${getStatusClass(
                      status
                    )}`}
                  >

                    {day}

                  </div>

                );

              })}

            </div>


            {/* CALENDAR LEGEND */}

            <div className="flex flex-wrap gap-3 mt-4 text-[9px] font-bold uppercase">

              <span className="text-green-600">
                🟢 Present
              </span>

              <span className="text-amber-600">
                🟡 Late
              </span>

              <span className="text-red-600">
                🔴 Absent
              </span>

              <span className="text-blue-600">
                🔵 Excused
              </span>

              <span className="text-purple-600">
                🟣 On Leave
              </span>

            </div>

          </div>

        )}

      </div>

    </div>

  );

};


export default StaffSelfAttendanceReport;
