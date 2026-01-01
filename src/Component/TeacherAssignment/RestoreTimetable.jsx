import React, { useState, useEffect } from "react";
import { 
  collection, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { schoollpq } from "../Database/schoollibAndPastquestion"; 
import { useAuth } from "../Security/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import localforage from "localforage";
import "react-toastify/dist/ReactToastify.css";

// Configure the exact cache instance
const timetableCache = localforage.createInstance({
  name: "TimetableManagerCache",
  storeName: "Daaily",
});

const RecoveryPage = () => {
  const { user } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [cachedData, setCachedData] = useState([]);

  // 1. Fetch the data from the specific "timetableList" key
  useEffect(() => {
    const getCache = async () => {
      try {
        const data = await timetableCache.getItem("timetableList");
        if (data && Array.isArray(data)) {
          setCachedData(data);
        }
      } catch (err) {
        console.error("Cache read error:", err);
        toast.error("Could not read local cache.");
      }
    };
    getCache();
  }, []);

  const startRestoration = async () => {
    if (!user?.schoolId) return toast.error("User session not found.");
    if (cachedData.length === 0) return toast.error("No data found in 'timetableList' key.");

    const confirmRestore = window.confirm(
      `Found ${cachedData.length} entries in 'timetableList'. Restore them now?`
    );
    if (!confirmRestore) return;

    setIsRestoring(true);
    
    // Use schoollpq as the database instance for the batch
    const batch = writeBatch(schoollpq);

    try {
      cachedData.forEach((item) => {
        // --- DATA CLEANING ---
        // Strip out any complex objects/circular references
        const cleanItem = JSON.parse(JSON.stringify(item));

        // Remove old IDs and timestamps to let Firestore generate fresh ones
        delete cleanItem.id;
        delete cleanItem.updatedAt;
        delete cleanItem.createdAt;

        // Create a new document reference in the Timetables collection
        const newDocRef = doc(collection(schoollpq, "Timetables")); 

        batch.set(newDocRef, {
          ...cleanItem,
          schoolId: user.schoolId,
          restoredAt: serverTimestamp(),
          status: "recovered_from_cache"
        });
      });

      await batch.commit();
      
      toast.success("✅ RESTORATION SUCCESSFUL!");
      setCachedData([]); // Clear list after success
    } catch (err) {
      console.error("Restoration error:", err);
      toast.error("❌ Failed: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <ToastContainer position="top-right" theme="dark" />

      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-black text-teal-400 mb-4">TIMETABLE RECOVERY</h1>
        <p className="text-gray-400 mb-10">
          Source: Browser Cache (<span className="text-white font-mono">timetableList</span>) 
          &rarr; Target: <span className="text-white font-mono">Firestore</span>
        </p>

        {cachedData.length > 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="text-6xl font-black text-white mb-2">{cachedData.length}</div>
              <div className="text-teal-500 font-bold tracking-widest uppercase text-sm">Rows Ready to Restore</div>
            </div>

            <button
              onClick={startRestoration}
              disabled={isRestoring}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${
                isRestoring
                  ? "bg-gray-700 text-gray-500 cursor-wait"
                  : "bg-teal-500 hover:bg-teal-400 text-gray-900 shadow-xl shadow-teal-500/20 active:scale-95"
              }`}
            >
              {isRestoring ? "RESTORING DATA..." : "RESTORE EVERYTHING NOW"}
            </button>

            <div className="mt-8 max-h-64 overflow-y-auto border border-gray-700 rounded-xl bg-gray-900/50">
              <table className="w-full text-left text-xs text-gray-400">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Class</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Day</th>
                  </tr>
                </thead>
                <tbody>
                  {cachedData.map((item, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="p-3 font-bold text-white">{item.className}</td>
                      <td className="p-3 uppercase">{item.subject}</td>
                      <td className="p-3">{item.day}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 bg-gray-800 rounded-3xl border-2 border-dashed border-gray-700">
            <p className="text-gray-500 mb-4">No data found in your browser's "timetableList" key.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-teal-500 underline font-bold"
            >
              Check Again
            </button>
          </div>
        )}

        <div className="mt-12">
          <a href="/" className="text-gray-600 hover:text-white transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;