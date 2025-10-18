import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";

const SubjectPage = () => {
  const location = useLocation();
  const schoolId = location.state?.schoolId || "N/A"; // School ID passed via navigation

  const [className, setClassName] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [classList, setClassList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ✅ Fetch all classes for the selected school only
  useEffect(() => {
    if (!schoolId || schoolId === "N/A") return;

    const classRef = collection(db, "Classes");
    const q = query(classRef, where("schoolId", "==", schoolId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClasses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClassList(fetchedClasses);
    });

    return () => unsubscribe();
  }, [schoolId]);

  // ✅ Add subject to temporary list
  const handleAddSubject = () => {
    if (subjectInput.trim() !== "") {
      setSubjects((prev) => [...prev, subjectInput.trim()]);
      setSubjectInput("");
    }
  };

  const handleSave = async () => {
    if (!className.trim() || subjects.length === 0) {
      alert("Please select a class and enter at least one subject.");
      return;
    }

    if (!schoolId || schoolId === "N/A") {
      alert("Missing school ID. Please navigate from a valid school context.");
      return;
    }

    // 🔠 Sort subjects alphabetically before saving
    const sortedSubjects = [...subjects].sort((a, b) => a.localeCompare(b));

    if (editingId) {
      // Update existing record
      const docRef = doc(db, "ClassesAndSubjects", editingId);
      await updateDoc(docRef, {
        className,
        subjects: sortedSubjects,
        schoolId,
        updatedAt: new Date(),
      });
      setEditingId(null);
    } else {
      // Add new record
      await addDoc(collection(db, "ClassesAndSubjects"), {
        className,
        subjects: sortedSubjects,
        schoolId,
        createdAt: new Date(),
      });
    }

    setClassName("");
    setSubjects([]);
  };


  // ✅ Fetch ClassesAndSubjects filtered by schoolId
  useEffect(() => {
    if (!schoolId || schoolId === "N/A") return;

    const subjRef = collection(db, "ClassesAndSubjects");
    const q = query(subjRef, where("schoolId", "==", schoolId));

    const unsub = onSnapshot(q, (snapshot) => {
      const classData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllClasses(classData);
    });

    return () => unsub();
  }, [schoolId]);

  // ✅ Delete class + subjects
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class and its subjects?")) {
      await deleteDoc(doc(db, "ClassesAndSubjects", id));
    }
  };

  // ✅ Edit existing data
  const handleEdit = (cls) => {
    setClassName(cls.className);
    setSubjects(cls.subjects);
    setEditingId(cls.id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
        Class and Subjects Setup
      </h2>

      {/* ✅ Input Section */}
      <div className="space-y-4">
        {/* Class Dropdown */}
        <div>
          <label className="font-medium text-gray-700">Class Name:</label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-300 bg-white"
          >
            <option value="">-- Select Class --</option>
            {classList.map((cls) => (
              <option key={cls.id} value={cls.className}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Input */}
        <div>
          <label className="font-medium text-gray-700">Subjects:</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
              placeholder="Enter subject e.g. Mathematics"
            />
            <button
              onClick={handleAddSubject}
              className="bg-green-600 text-white px-4 rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>

          {/* List of Added Subjects */}
          {subjects.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {subjects.map((subj, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {subj}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {editingId ? "Update Class & Subjects" : "Save Class & Subjects"}
        </button>
      </div>

      {/* ✅ Table */}
      <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-800 text-center">
        Saved Classes & Subjects
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-md text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2 text-left">#</th>
              <th className="border px-3 py-2 text-left">Class Name</th>
              <th className="border px-3 py-2 text-left">Subjects</th>
              <th className="border px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allClasses.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No classes added yet.
                </td>
              </tr>
            ) : (
              allClasses.map((cls, index) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{cls.className}</td>
                  <td className="border px-3 py-2">
                    {cls.subjects
                      ?.slice() // make a shallow copy so we don’t modify Firestore data directly
                      .sort((a, b) => a.localeCompare(b))
                      .join(", ") || "—"}
                  </td>

                  <td className="border px-3 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectPage;
