// src/Component/Utils/ResultCalculator.jsx

/**
 * Safely parses and retrieves term scores.
 * Keeps raw float averages intact to ensure calculation accuracy,
 * while returning rounded integers for UI display.
 */
export const getTermScores = (gradesArray, pupilId, subj, termPrefix) => {
    const records = gradesArray.filter(
        (g) => g.pupilID === pupilId && g.subject === subj && g.test.startsWith(termPrefix)
    );

    const t1Record = records.find(r => r.test.endsWith("T1"));
    const t2Record = records.find(r => r.test.endsWith("T2"));

    const t1Val = t1Record && t1Record.grade !== "" && t1Record.grade !== undefined ? Number(t1Record.grade) : null;
    const t2Val = t2Record && t2Record.grade !== "" && t2Record.grade !== undefined ? Number(t2Record.grade) : null;

    let rawMean = null;
    if (t1Val !== null || t2Val !== null) {
        // Match the fallback logic of treating missing test grades as 0
        const v1 = t1Val !== null ? t1Val : 0;
        const v2 = t2Val !== null ? t2Val : 0;
        rawMean = (v1 + v2) / 2;
    }

    return { 
        t1: t1Val !== null ? Math.round(t1Val) : null, 
        t2: t2Val !== null ? Math.round(t2Val) : null, 
        rawMean: rawMean, // High-precision float for ranking and summation
        mean: rawMean !== null ? Math.round(rawMean) : null 
    };
};

/**
 * Calculates Subject Ranks dynamically matching the tie-breaker/ranking strategy.
 */
export const calculateSubjectRanks = (gradesArray, pupilIDs, uniqueSubjects, terms = ["Term 1", "Term 2", "Term 3"]) => {
    const subjectTermRanks = {};

    uniqueSubjects.forEach((subj) => {
        terms.forEach((term) => {
            const studentMeans = pupilIDs.map((id) => {
                const { rawMean } = getTermScores(gradesArray, id, subj, term);
                return { id, rawMean };
            }).filter(item => item.rawMean !== null);

            // Sort descending by raw float averages
            studentMeans.sort((a, b) => b.rawMean - a.rawMean);

            const rankKey = `${subj}_${term}`;
            subjectTermRanks[rankKey] = {};

            studentMeans.forEach((student, idx) => {
                if (idx > 0 && student.rawMean === studentMeans[idx - 1].rawMean) {
                    subjectTermRanks[rankKey][student.id] = subjectTermRanks[rankKey][studentMeans[idx - 1].id];
                } else {
                    subjectTermRanks[rankKey][student.id] = idx + 1;
                }
            });
        });
    });

    return subjectTermRanks;
};

/**
 * Calculates subject-specific annual ranks across all subjects using raw float averages.
 */
export const calculateSubjectAnnualRanks = (gradesArray, pupilIDs, uniqueSubjects) => {
    const subjectAnnualRanks = {};

    uniqueSubjects.forEach((subj) => {
        const studentSubjAnnuals = pupilIDs.map((id) => {
            const t1 = getTermScores(gradesArray, id, subj, "Term 1").rawMean;
            const t2 = getTermScores(gradesArray, id, subj, "Term 2").rawMean;
            const t3 = getTermScores(gradesArray, id, subj, "Term 3").rawMean;

            const active = [t1, t2, t3].filter(v => v !== null);
            const annualAvg = active.length > 0 ? active.reduce((a, b) => a + b, 0) / active.length : null;
            return { id, annualAvg };
        }).filter(item => item.annualAvg !== null);

        studentSubjAnnuals.sort((a, b) => b.annualAvg - a.annualAvg);
        subjectAnnualRanks[subj] = {};

        studentSubjAnnuals.forEach((student, idx) => {
            if (idx > 0 && student.annualAvg === studentSubjAnnuals[idx - 1].annualAvg) {
                subjectAnnualRanks[subj][student.id] = subjectAnnualRanks[subj][studentSubjAnnuals[idx - 1].id];
            } else {
                subjectAnnualRanks[subj][student.id] = idx + 1;
            }
        });
    });

    return subjectAnnualRanks;
};

/**
 * Calculates Term summaries (Total, Percentage, Overall Class Rank) 
 * using high-precision calculations.
 */
export const calculateOverallMetrics = (gradesArray, pupilIDs, uniqueSubjects, selectedPupilId, totalSubjectPercentage = null) => {
    const classTermTotals = { "Term 1": [], "Term 2": [], "Term 3": [] };
    const classAnnualAverages = [];

    pupilIDs.forEach((id) => {
        let annualSumOfAverages = 0;
        let annualSubjectCount = 0;

        ["Term 1", "Term 2", "Term 3"].forEach((term) => {
            let termSum = 0;
            let termSubjectCount = 0;

            uniqueSubjects.forEach((subj) => {
                const { rawMean } = getTermScores(gradesArray, id, subj, term);
                if (rawMean !== null) {
                    termSum += rawMean; // Maintain raw fractional accuracy
                    termSubjectCount++;
                }
            });

            if (termSubjectCount > 0) {
                // If specific class subject percentage is passed, calculate relative to that.
                // Otherwise, fall back to standard subject count * 100
                const maxTermPercentage = totalSubjectPercentage && totalSubjectPercentage > 0 
                    ? totalSubjectPercentage 
                    : (termSubjectCount * 100);

                const percentage = (termSum / maxTermPercentage) * 100;
                classTermTotals[term].push({ id, total: termSum, percentage });
            }
        });

        uniqueSubjects.forEach((subj) => {
            const t1 = getTermScores(gradesArray, id, subj, "Term 1").rawMean;
            const t2 = getTermScores(gradesArray, id, subj, "Term 2").rawMean;
            const t3 = getTermScores(gradesArray, id, subj, "Term 3").rawMean;

            const activeTerms = [t1, t2, t3].filter(v => v !== null);

            if (activeTerms.length > 0) {
                annualSumOfAverages += (activeTerms.reduce((s, v) => s + v, 0) / activeTerms.length);
                annualSubjectCount++;
            }
        });

        if (annualSubjectCount > 0) {
            classAnnualAverages.push({ id, average: annualSumOfAverages / annualSubjectCount });
        }
    });

    // 1. Process Term Summaries with Ties
    const termSummariesCalculated = {};
    ["Term 1", "Term 2", "Term 3"].forEach((term) => {
        const list = classTermTotals[term];
        // Sort descending by raw float percentage to eliminate rounding ranking anomalies
        list.sort((a, b) => b.total - a.total);
        list.forEach((entry, idx) => {
            if (idx > 0 && entry.total === list[idx - 1].total) {
                entry.rank = list[idx - 1].rank;
            } else {
                entry.rank = idx + 1;
            }
        });

        const studentTermStats = list.find((x) => x.id === selectedPupilId);
        termSummariesCalculated[term] = studentTermStats ? {
            total: Math.round(studentTermStats.total),
            percentage: studentTermStats.percentage.toFixed(1),
            rank: studentTermStats.rank
        } : { total: "—", percentage: "—", rank: "—" };
    });

    // 2. Process Annual Summaries with Ties
    classAnnualAverages.sort((a, b) => b.average - a.average);
    classAnnualAverages.forEach((entry, idx) => {
        if (idx > 0 && entry.average === classAnnualAverages[idx - 1].average) {
            entry.rank = classAnnualAverages[idx - 1].rank;
        } else {
            entry.rank = idx + 1;
        }
    });

    const selectedAnnualStats = classAnnualAverages.find((x) => x.id === selectedPupilId);
    const annualSummary = {
        avg: selectedAnnualStats ? selectedAnnualStats.average.toFixed(1) : "0.0",
        rank: selectedAnnualStats ? selectedAnnualStats.rank : "—"
    };

    return { 
        termSummaries: termSummariesCalculated, 
        annualSummary,
        classTermTotals, 
        classAnnualAverages 
    };
};