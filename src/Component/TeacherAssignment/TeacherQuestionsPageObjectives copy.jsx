import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { schoollpq } from "../Database/schoollibAndPastquestion"; // past question database api
import { 
    collection, 
    setDoc, 
    doc, 
    serverTimestamp, 
    onSnapshot, // Import the onSnapshot function
    query, 
    where,
    // Removed getDocs as we are using onSnapshot
    updateDoc, 
} from "firebase/firestore";
import { useAuth } from "../Security/AuthContext";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TeacherQuestionsPageObjectives = () => {
  const { user } = useAuth();
  const location = useLocation();
  const schoolId = location.state?.schoolId || "N/A";

  const [academicYear] = useState("2025/2026"); // Changed to static const
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTest, setSelectedTest] = useState("Term 1 T1");
  const [assignments, setAssignments] = useState([]);
    
    // State for question creation/editing
  const [questions, setQuestions] = useState([
    { number: 1, question: "", options: { A: "", B: "", C: "", D: "" }, answer: "" },
  ]);
    
    // State for fetched questions from the database
    const [fetchedQuestions, setFetchedQuestions] = useState([]);
    // State for tracking the database document ID
    const [existingDocId, setExistingDocId] = useState(null);
    // State to track if the main form is currently editing a question from the bank
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null); 

  const [submitting, setSubmitting] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  const teacherName = user?.data?.teacherName;
  const tests = ["Term 1 T1", "Term 1 Exam", "Term 2 T1", "Term 2 Exam", "Term 3 T1", "Term 3 Exam"];

  // Load assignments (Existing Logic - uses onSnapshot for assignments)
  useEffect(() => {
    if (!teacherName) return;
    const q = query(collection(db, "TeacherAssignments"), where("teacher", "==", teacherName), where("schoolId", "==", schoolId));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAssignments(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].className);
        setSelectedSubject(data[0].subjects[0]);
      }
    });
    return () => unsub();
  }, [teacherName, schoolId, selectedClass]);


    // 🔄 REAL-TIME FETCH Questions from Database using onSnapshot
    useEffect(() => {
        // 1. Check if we have enough parameters to query
        if (!selectedClass || !selectedSubject || !selectedTest || !schoolId) {
            setFetchedQuestions([]);
            setExistingDocId(null);
            return;
        }

        // 2. Build the query
        const q = query(
            collection(schoollpq, "QuestionsBank"),
            where("schoolId", "==", schoolId),
            where("className", "==", selectedClass),
            where("subject", "==", selectedSubject),
            where("term", "==", selectedTest),
            where("academicYear", "==", academicYear)
        );

        // 3. Set up the real-time listener
        const unsub = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docSnapshot = snapshot.docs[0];
                const docData = docSnapshot.data();
                
                // Set the document ID for future updates/deletes
                setExistingDocId(docSnapshot.id);
                
                // Map loaded questions, adding client-side IDs for React keys and table actions
                const loadedQuestions = docData.questions.map((q, index) => ({ 
                    ...q, 
                    tempId: index, // Using index as a tempId since the array order is reliable for this purpose
                    number: index + 1, 
                }));
                setFetchedQuestions(loadedQuestions);

            } else {
                // Document doesn't exist yet
                setFetchedQuestions([]);
                setExistingDocId(null);
            }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            // Handle error, e.g., show a user message
        });

        // 4. Cleanup function to stop listening when component unmounts or dependencies change
        return () => unsub();
    }, [selectedClass, selectedSubject, selectedTest, schoolId, academicYear]);


    // Helper functions
    const resetForm = () => {
        setQuestions([
            { number: 1, question: "", options: { A: "", B: "", C: "", D: "" }, answer: "" },
        ]);
        setEditingQuestionIndex(null);
    }

    const addQuestion = () => {
        // Cannot add new questions while editing an existing one
        if (editingQuestionIndex !== null) {
          alert("Please finish updating the current question or click 'Cancel Edit' before adding new ones.");
          return;
        }
        setQuestions([
          ...questions,
          { number: questions.length + 1, question: "", options: { A: "", B: "", C: "", D: "" }, answer: "" },
        ]);
    };
    
    const updateQuestion = (index, field, value) => {
        const newQs = [...questions];
        newQs[index][field] = value;
        setQuestions(newQs);
    };

    const updateOption = (index, option, value) => {
        const newQs = [...questions];
        newQs[index].options[option] = value;
        setQuestions(newQs);
    };
    

    // ✍️ EDIT Question - Loads question data from the table into the main form
    const handleEditQuestion = (questionToEdit, index) => {
        // Scroll to the top where the form is
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        
        // Load the single question into the form state
        setQuestions([questionToEdit]); 
        
        // Set the index of the question being edited in the fetchedQuestions array
        setEditingQuestionIndex(index); 
    };

    // 🗑️ DELETE Question - Removes question from the database
    const handleDeleteQuestion = async (qToDelete, index) => {
        if (!existingDocId) {
            alert("Error: Test document not found.");
            return;
        }
        if (!window.confirm(`Are you sure you want to permanently delete question #${index + 1}?`)) {
            return;
        }

        try {
            // Prepare the updated list for Firestore: filter out the deleted item
            // Use the stable 'tempId' or original index for filtering if necessary, but here we use the one passed in
            const questionsAfterDeletion = fetchedQuestions.filter(q => q.tempId !== qToDelete.tempId);
            
            // Remove client-side tempId/number before sending to Firestore
            const dataToSave = questionsAfterDeletion.map(({ tempId, number, ...rest }) => rest);

            const docRef = doc(schoollpq, "QuestionsBank", existingDocId);
            await updateDoc(docRef, {
                questions: dataToSave,
                timestamp: serverTimestamp(),
            });
            
            // Reset the form if the question being edited was just deleted
            if (editingQuestionIndex === index) {
                resetForm();
            }

            alert("Question deleted successfully (Table will update automatically).");
        } catch (err) {
            console.error("Error deleting question:", err);
            alert("Error deleting question!");
        }
    };


    // 💾 SUBMIT/UPDATE Logic 
  const handleSubmitQuestions = async () => {
    if (!selectedClass || !selectedSubject || !selectedTest) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
        // 1. Get the questions currently in the form
      const newQuestionsFromForm = questions.filter((q) => q.question.trim() !== "");
      if (newQuestionsFromForm.length === 0) {
        alert("Please enter at least one valid question.");
        setSubmitting(false);
        return;
      }

        let finalQuestionsToSave = [];

        if (editingQuestionIndex !== null) {
            // 2. UPDATE EXISTING QUESTION
            if (newQuestionsFromForm.length > 1) {
                alert("Only one question can be submitted when in edit mode.");
                setSubmitting(false);
                return;
            }
            // Start with the currently fetched list
            finalQuestionsToSave = [...fetchedQuestions];
            
            // Replace the question at the specific index with the updated one from the form
            finalQuestionsToSave[editingQuestionIndex] = newQuestionsFromForm[0];
            
        } else {
            // 3. CREATE NEW QUESTIONS (append to existing or start new)
            // Remove client-side tempId/number from existing questions before combining
            const existingQs = fetchedQuestions.map(({ tempId, number, ...rest }) => rest);
            // New questions don't have tempId/number (if the form state was correctly reset)
            const newQs = newQuestionsFromForm.map(({ number, ...rest }) => rest);
            finalQuestionsToSave = [...existingQs, ...newQs];
        }

        // Prepare final data (remove client-side 'number' and 'tempId' field used for display/keys)
        const dataToSave = finalQuestionsToSave.map(({ number, tempId, ...rest }) => rest);
        

        // Determine if we create a new doc or update existing
      const docRef = existingDocId 
            ? doc(schoollpq, "QuestionsBank", existingDocId) 
            : doc(collection(schoollpq, "QuestionsBank"));
            
      await setDoc(docRef, {
        schoolId,
        className: selectedClass,
        subject: selectedSubject,
        term: selectedTest,
        academicYear,
        teacher: teacherName,
        questions: dataToSave,
        timestamp: serverTimestamp(),
      });

        // Reset form and close editing mode
        resetForm();
        
      setShowDownloadPopup(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting questions!");
    } finally {
      setSubmitting(false);
    }
  };

  // PDF Download Logic (Unchanged)
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
    let startY = 30;

    doc.setFontSize(16).text("Submitted Questions Record", 40, startY);
    startY += 20;
    doc.setFontSize(11);
    doc.text(`Teacher: ${teacherName}`, 40, startY);
    doc.text(`Class: ${selectedClass}`, 200, startY);
    doc.text(`Subject: ${selectedSubject}`, 350, startY);
    startY += 15;
    doc.text(`Term: ${selectedTest}`, 40, startY);
    doc.text(`Academic Year: ${academicYear}`, 200, startY);
    startY += 20;

    // Use the questions currently in the form state for the PDF
    const tableData = questions
        .filter((q) => q.question.trim() !== "")
        .map((q, index) => [
            index + 1, 
            q.question,
            `A) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}`,
            q.answer,
        ]);

    autoTable(doc, {
        startY,
        head: [["#", "Question", "Options", "Answer"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, valign: "top" },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 180 }, 2: { cellWidth: 220 }, 3: { cellWidth: 40 } },
    });

    doc.save(`${selectedClass}_${selectedSubject}_${selectedTest}_Questions.pdf`);
    setShowDownloadPopup(false);
  };

  // 7. JSX Rendering
    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
                Submit Exam/Test Questions ({academicYear})
              </h2>
            
            <hr/>

      
            <div className="flex flex-wrap gap-4 mb-6 p-4 border rounded-lg bg-gray-100">
                {/* Class Selection JSX */}
                <div>
                    <label className="font-medium text-gray-700">Class:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="border px-3 py-2 rounded-md w-40"
                    >
                        {assignments.map((a) => (
                            <option key={a.id} value={a.className}>
                                {a.className}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subject Selection JSX */}
                <div>
                    <label className="font-medium text-gray-700">Subject:</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="border px-3 py-2 rounded-md w-40"
                    >
                        {assignments
                            .find((a) => a.className === selectedClass)
                            ?.subjects.map((subject, i) => (
                                <option key={i} value={subject}>
                                    {subject}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Term Selection JSX */}
                <div>
                    <label className="font-medium text-gray-700">Term/Test:</label>
                    <select
                        value={selectedTest}
                        onChange={(e) => setSelectedTest(e.target.value)}
                        className="border px-3 py-2 rounded-md w-40"
                    >
                        {tests.map((t, i) => (
                            <option key={i} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <hr className="my-8"/>

            {/* Questions Entry (Form) */}
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                {editingQuestionIndex !== null ? `✏️ Edit Question` : `📝 Enter New Questions`}
            </h3>

            <div className="space-y-6">
                {questions.map((q, i) => (
                    <div key={i} className={`border p-4 rounded-lg ${editingQuestionIndex !== null ? 'bg-yellow-100 border-yellow-500' : 'bg-gray-50'}`}>
                        <p className="font-semibold mb-2 text-gray-700">
                            {editingQuestionIndex !== null ? `Question #${editingQuestionIndex + 1} being edited` : `New Question ${q.number}`}
                        </p>
                        <textarea
                            value={q.question}
                            onChange={(e) => updateQuestion(i, "question", e.target.value)}
                            placeholder="Enter question text"
                            className="w-full border rounded-md p-2 mb-3"
                            rows="2"
                        />

                        {/* Options inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            {["A", "B", "C", "D"].map((opt) => (
                                <div key={opt}>
                                    <label className="text-sm font-medium text-gray-600">Option {opt}</label>
                                    <input
                                        type="text"
                                        value={q.options[opt]}
                                        onChange={(e) => updateOption(i, opt, e.target.value)}
                                        className="w-full border rounded-md p-2"
                                        placeholder={`Enter option ${opt}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                            <label className="font-medium text-gray-700">Correct Answer:</label>
                            <select
                                value={q.answer}
                                onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                                className="border px-3 py-2 rounded-md ml-2"
                            >
                                <option value="">Select</option>
                                {["A", "B", "C", "D"].map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            {editingQuestionIndex !== null && (
                                <button
                                    onClick={resetForm}
                                    className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-gray-500 text-sm"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add & Submit Buttons */}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={addQuestion}
                    disabled={editingQuestionIndex !== null}
                    className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${editingQuestionIndex !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    ➕ Add Question Field
                </button>
                <button
                    onClick={handleSubmitQuestions}
                    disabled={submitting}
                    className={`px-4 py-2 rounded-md ${
                        submitting ? "bg-gray-400 cursor-not-allowed" 
                        : editingQuestionIndex !== null 
                            ? "bg-orange-600 text-white hover:bg-orange-700" 
                            : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                    {submitting 
                        ? "Saving..." 
                        : editingQuestionIndex !== null 
                            ? "Update Question" 
                            : "Submit New Questions"
                    }
                </button>
            </div>

            <hr className="my-8" />

            {/* 🌟 QUESTIONS BANK TABLE (REAL-TIME FETCHED DATA) 🌟 */}
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Questions in Bank for **{selectedClass} - {selectedSubject} ({selectedTest})**: {fetchedQuestions.length} Total
            </h3>

            {fetchedQuestions.length === 0 ? (
                <p className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                    No questions found for the selected criteria. Use the form above to submit the first batch.
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-md">
                    <table className="min-w-full text-sm">
                        <thead className="bg-indigo-500 text-white">
                            <tr>
                                <th className="px-3 py-2 text-center w-10">#</th>
                                <th className="px-3 py-2 text-left">Question Summary & Options</th>
                                <th className="px-3 py-2 text-center w-20">Answer</th>
                                <th className="px-3 py-2 text-center w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fetchedQuestions.map((q, index) => (
                                <tr key={q.tempId} className={editingQuestionIndex === index ? "bg-yellow-50 border-yellow-300 border-2" : "border-b hover:bg-indigo-50"}>
                                    <td className="px-3 py-3 text-center font-bold text-gray-700">{index + 1}</td>
                                    <td className="px-3 py-3 text-gray-800">
                                        <p className="font-medium mb-1">{q.question}</p>
                                        <ul className="list-disc pl-5 text-xs text-gray-600 space-y-0.5 mt-1">
                                            <li>**A:** {q.options.A}</li>
                                            <li>**B:** {q.options.B}</li>
                                            <li>**C:** {q.options.C}</li>
                                            <li>**D:** {q.options.D}</li>
                                        </ul>
                                    </td>
                                    <td className={`px-3 py-3 text-center text-lg font-extrabold ${q.answer ? 'text-green-600' : 'text-red-500'}`}>
                                        {q.answer || 'N/A'}
                                    </td>
                                    <td className="px-3 py-3 text-center space-x-2">
                                        {/* *** ADJUSTED BUTTONS START HERE ***
                                            Using handleEditQuestion and handleDeleteQuestion with the correct parameters (q and index)
                                        */}
                                        <button 
                                            onClick={() => handleEditQuestion(q, index)}
                                            className="bg-orange-500 text-white text-xs px-3 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
                                            disabled={editingQuestionIndex === index}
                                        >
                                            {editingQuestionIndex === index ? "Editing..." : "Edit"}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteQuestion(q, index)}
                                            className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                            disabled={editingQuestionIndex !== null}
                                        >
                                            Delete
                                        </button>
                                        {/* *** ADJUSTED BUTTONS END HERE *** */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


            {/* Download Popup (Unchanged) */}
            {showDownloadPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full text-center border-4 border-green-500">
                        <h3 className="text-xl font-bold mb-4 text-green-700">SUBMISSION COMPLETE</h3>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                            You can download the record PDF or close this popup.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex-1 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold"
                            >
                                ⬇️ DOWNLOAD QUESTIONS RECORD
                            </button>
                            <button
                                onClick={() => setShowDownloadPopup(false)}
                                className="flex-1 py-3 rounded-md bg-gray-400 hover:bg-gray-500 text-white font-bold"
                            >
                                ❌ CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuestionsPageObjectives;