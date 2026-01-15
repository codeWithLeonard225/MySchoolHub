import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from "firebase/firestore";
import { schoollpq } from "../Database/schoollibAndPastquestion"; 
import { useAuth } from "../Security/AuthContext";

const AttendancePage = () => {
  const { user } = useAuth();
  const schoolId = user?.schoolId || "N/A";

  // --- STATE ---
  const [timetableToday, setTimetableToday] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  
  // Date State - Defaults to today's date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Determine the day of the week based on the selected date
  const activeDay = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date(selectedDate);
    return days[d.getDay()];
  }, [selectedDate]);

  // --- FETCH TIMETABLE BASED ON DAY OF WEEK ---
  useEffect(() => {
    if (schoolId === "N/A") return;
    setLoading(true);
    
    // We fetch the timetable that matches the day of the selected date (e.g., "Monday")
    const q = query(
      collection(schoollpq, "Timetables"), 
      where("schoolId", "==", schoolId), 
      where("day", "==", activeDay)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimetableToday(data.sort((a, b) => parseFloat(a.period) - parseFloat(b.period)));
      setLoading(false);
    });
    return () => unsub();
  }, [schoolId, activeDay]);

  // --- FETCH ATTENDANCE BASED ON SELECTED DATE ---
  useEffect(() => {
    const fetchAttendance = async () => {
      const q = query(
        collection(schoollpq, "TeacherAttendance"),
        where("schoolId", "==", schoolId),
        where("date", "==", selectedDate)
      );
      const snapshot = await getDocs(q);
      const marks = {};
      snapshot.forEach((d) => { 
        marks[d.data().timetableId] = { status: d.data().status, docId: d.id }; 
      });
      setAttendanceLog(marks);
    };
    if (schoolId !== "N/A") fetchAttendance();
  }, [schoolId, selectedDate]);

  // --- ACTIONS ---
  const handleMarkStatus = async (item, status) => {
    try {
      const docRef = await addDoc(collection(schoollpq, "TeacherAttendance"), {
        schoolId,
        timetableId: item.id,
        teacherName: item.teacher,
        subject: item.subject,
        className: item.className,
        date: selectedDate,
        status,
        markedAt: serverTimestamp(),
      });
      setAttendanceLog(prev => ({ ...prev, [item.id]: { status, docId: docRef.id } }));
      toast.success(`Marked ${status}`);
    } catch (err) { toast.error("Error saving"); }
  };

  const deleteEntry = async (timetableId) => {
    const entry = attendanceLog[timetableId];
    if (!entry) return;
    try {
      await deleteDoc(doc(schoollpq, "TeacherAttendance", entry.docId));
      const newLog = { ...attendanceLog };
      delete newLog[timetableId];
      setAttendanceLog(newLog);
      toast.success("Entry removed");
    } catch (err) { toast.error("Delete failed"); }
  };

  const clearAllAttendance = async () => {
    if (!window.confirm(`Delete ALL records for ${selectedDate}?`)) return;
    try {
      const q = query(
        collection(schoollpq, "TeacherAttendance"),
        where("schoolId", "==", schoolId),
        where("date", "==", selectedDate)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(schoollpq);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setAttendanceLog({});
      toast.success("Date cleared successfully");
    } catch (err) { toast.error("Bulk delete failed"); }
  };

  const filteredList = timetableToday.filter(t => (filterClass === "" || t.className === filterClass) && t.period !== "Lunch");

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">ATTENDANCE</h1>
              <p className="text-teal-600 font-bold text-xs uppercase">{activeDay}</p>
            </div>

            {/* Date Picker Input */}
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Choose Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-100 border-none rounded-xl px-4 py-2 font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <button 
              onClick={clearAllAttendance}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all"
            >
              CLEAR THIS DATE
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select 
            className="w-full p-3 rounded-2xl border-2 border-white shadow-sm font-bold text-gray-500 text-sm focus:outline-teal-500"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {[...new Set(timetableToday.map(t => t.className))].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-gray-300 font-bold animate-pulse uppercase">Fetching Schedule...</div>
        ) : (
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl text-gray-400 italic font-medium">
                No classes scheduled for {activeDay}.
              </div>
            ) : (
              filteredList.map((item) => {
                const logEntry = attendanceLog[item.id];
                return (
                  <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center font-black text-[10px]">
                        P{item.period}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm uppercase leading-tight">{item.teacher}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.subject} • {item.className}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!logEntry ? (
                        <>
                          <button onClick={() => handleMarkStatus(item, "Present")} className="bg-green-500 text-white px-4 py-2 rounded-xl text-[9px] font-black shadow-sm active:scale-95 transition-transform">PRESENT</button>
                          <button onClick={() => handleMarkStatus(item, "Absent")} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-black shadow-sm active:scale-95 transition-transform">ABSENT</button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${logEntry.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {logEntry.status}
                          </span>
                          <button 
                            onClick={() => deleteEntry(item.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;