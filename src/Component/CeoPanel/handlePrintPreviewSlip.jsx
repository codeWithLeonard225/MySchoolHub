/**
 * Opens a clean standalone A4 print preview window for a WASSCE result slip.
 * @param {Object} result - The WASSCE result object containing candidate and subject details.
 */
export const handlePrintPreviewSlip = (result) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    
    const coreRows = Object.entries(result.core || {}).map(([key, data]) => 
        data.grade ? `
            <tr>
                <td style="padding: 9px 12px; text-transform: capitalize; border-right: 1px solid #000080; font-size: 13.5px; font-weight: 500;">${key.replace(/([A-Z])/g, ' $1')}</td>
                <td style="padding: 9px 12px; text-align: center; font-weight: bold; color: #000080; border-right: 1px solid #000080; font-size: 14px;">${data.grade}</td>
                <td style="padding: 9px 12px; font-size: 13.5px; font-weight: 500;">${data.interpretation}</td>
            </tr>
        ` : ''
    ).join('');

    const electiveRows = Object.entries(result.electives || {}).map(([key, data]) => 
        data.grade ? `
            <tr>
                <td style="padding: 9px 12px; text-transform: capitalize; border-right: 1px solid #000080; font-size: 13.5px; font-weight: 500;">${key.replace(/([A-Z])/g, ' $1')}</td>
                <td style="padding: 9px 12px; text-align: center; font-weight: bold; color: #000080; border-right: 1px solid #000080; font-size: 14px;">${data.grade}</td>
                <td style="padding: 9px 12px; font-size: 13.5px; font-weight: 500;">${data.interpretation}</td>
            </tr>
        ` : ''
    ).join('');

    const subjectsListed =
    result.subjectsListed ||
    [...Object.values(result.core || {}), ...Object.values(result.electives || {})]
        .filter((subject) => subject.grade?.trim())
        .length;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>WASSCE Result Slip - ${result.candidateName}</title>
            <style>
                @page { size: A4; margin: 8mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; background: #fff; }
                /* Compact A4 container to prevent page 2 spillover */
                .a4-page {
    width: 210mm;
    height: 281mm;
    padding: 8mm;
    margin: auto;
    box-sizing: border-box;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border: 8px double #003366;
}
                .slip-content { width: 100%; }
                .header { display: flex; align-items: center; border-bottom: 3px solid #000080; padding-bottom: 8px; margin-bottom: 10px; }
                .logo-box { width: 90px; height: 90px; border: 2px solid #000080; display: flex; align-items: center; justify-content: center; background: #f0f4ff; margin-right: 15px; flex-shrink: 0; overflow: hidden; }
                .logo-box img { width: 100%; height: 100%; object-fit: cover; }
                .school-info h1 { font-size: 16px; font-weight: 900; color: #000080; margin: 0 0 2px 0; text-transform: uppercase; }
                .school-info p.address { font-size: 16px; color: #333; margin: 2px 0; font-weight: 600; }
                .school-info p.tel { font-size: 16px; color: #333; margin: 2px 0; font-weight: 600; }
                .school-info p.motto { font-size: 16px; font-style: italic; color: #0000aa; margin: 2px 0 0 0; font-weight: bold; }
                .title-banner { background: #000080; color: #fff; text-align: center; padding: 6px; border-radius: 4px; margin-bottom: 10px; }
                .title-banner h2 { font-size: 11px; margin: 0; letter-spacing: 1px; font-weight: bold; }
                .title-banner h3 { font-size: 14px; margin: 2px 0; letter-spacing: 2px; font-weight: 900; }
                .sub-badge { background: #0022b3; display: inline-block; padding: 2px 12px; font-size: 11px; font-weight: bold; border-radius: 3px; margin-top: 3px; letter-spacing: 1px; }
                .section-title { background: #000080; color: #fff; font-size: 11px; font-weight: bold; padding: 4px 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                .details-box { border: 1px solid #000080; border-top: none; padding: 10px 12px; margin-bottom: 10px; background: #f9fbff; display: flex; justify-content: space-between; font-size: 12px; }
                .details-grid { display: grid; grid-template-columns: 130px 1fr; row-gap: 5px; width: 100%; }
                .candidate-photo { width: 90px; height: 110px; border: 2px solid #000080; background: #fff; margin-left: 15px; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #777; }
                .candidate-photo img { width: 100%; height: 100%; object-fit: cover; }
                table { width: 100%; border-collapse: collapse; border: 1px solid #000080; font-size: 13px; margin-bottom: 5px; }
                th { background: #e6edff; color: #000080; border: 1px solid #000080; padding: 6px 12px; text-align: left; font-weight: bold; font-size: 12px; }
                td { border: 1px solid #000080; }
                tr:nth-child(even) { background-color: #fafbfc; }
                
                /* Footer Styling with increased spacing between rows */
                .footer {
    border-top: 1px solid #ccc;
    width: 100%;
    font-size: 11.5px;
    color: #333;
    margin-top: 5px;
    padding-top: 50px;
    box-sizing: border-box;
}

.footer-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 30px;
    font-weight: 650;
}

.footer-row:last-child {
    margin-bottom: 4px;
}
                .print-controls { text-align: center; background: #222; padding: 12px; margin-bottom: 20px; }
                .print-controls button { background: #16a34a; color: #fff; border: none; padding: 10px 20px; font-weight: bold; font-size: 14px; border-radius: 6px; cursor: pointer; }
              @media print {
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    .print-controls {
        display: none !important;
    }

    body {
        background: #fff !important;
    }

    .a4-page {
        padding: 8mm;
        box-shadow: none;
        margin: 0;
        width: 100%;
        height: 281mm;
        border: 6px double #000;
        background: #fff !important;
    }

    .title-banner,
    .section-title,
    .sub-badge {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    .title-banner {
        background: #000080 !important;
        color: #fff !important;
    }

    .section-title {
        background: #000080 !important;
        color: #fff !important;
    }

    .sub-badge {
        background: #0022b3 !important;
        color: #fff !important;
    }

    th {
        background: #e6edff !important;
        color: #000080 !important;
    }

    .details-box {
        background: #f9fbff !important;
    }

    tr:nth-child(even) {
        background-color: #fafbfc !important;
    }
}
    .subjects-listed {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #000080;
    background: #e6edff;
    color: #000080;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 13px;
    font-weight: bold;
}

.subjects-listed span {
    background: #000080;
    color: #fff;
    padding: 4px 14px;
    border-radius: 4px;
}

@media print {
    .subjects-listed {
        background: #e6edff !important;
        color: #000080 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    .subjects-listed span {
        background: #000080 !important;
        color: #fff !important;
    }
}
            </style>
        </head>
        <body>
            <div class="print-controls">
                <button onclick="window.print()">🖨️ Click Here to Print / Save as A4 PDF</button>
            </div>
            <div class="a4-page">
                <div class="slip-content">
                    <!-- Header with Logo on Left, School Details on Right -->
                    <div class="header">
                        <div class="logo-box">
                            ${result.schoolLogoUrl ? `<img src="${result.schoolLogoUrl}" alt="Logo" />` : 'LOGO'}
                        </div>
                        <div class="school-info">
                            <h1>${result.schoolName || "ZADET PREPARATORY & INTERNATIONAL SECONDARY SCHOOL"}</h1>
                            <p class="address">${result.schoolAddress || "30 Parsonage Street Kissy Freetown"}</p>
                            <p class="tel">${result.schoolTel || "Tel +23276 619002 / +23276817801"}</p>
                            <p class="motto">${result.schoolMotto || "Striving for Excellence — Knowledge • Discipline • Character • Global Future"}</p>
                        </div>
                    </div>

                    <div class="title-banner">
                        <h2>WEST AFRICAN SENIOR SCHOOL CERTIFICATE EXAMINATION</h2>
                        <h3>(WASSCE)</h3>
                        <div class="sub-badge">RESULT SLIP</div>
                    </div>

                    <div class="section-title">CANDIDATE'S DETAILS</div>
                    <div class="details-box">
                        <div class="details-grid">
                            <strong>Candidate Number</strong> <span>: ${result.candidateNumber}</span>
                            <strong>Candidate Name</strong> <span>: ${result.candidateName}</span>
                            <strong>Date of Birth</strong> <span>: ${result.dateOfBirth || "N/A"}</span>
                            <strong>School</strong> <span>: ${result.schoolName}</span>
                            <strong>Date of Exam</strong> <span>: ${result.dateOfExam}</span>
                        </div>
                        <div class="candidate-photo">
                            ${result.pupilImgUrl ? `<img src="${result.pupilImgUrl}" alt="Photo" />` : 'No Photo'}
                        </div>
                    </div>

                    <div class="section-title">RESULTS</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50%;">Subject</th>
                                <th style="width: 20%; text-align: center;">Grade</th>
                                <th style="width: 30%;">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${coreRows}
                            ${electiveRows}
                        </tbody>
                    </table>
                    <div class="subjects-listed">
    <strong>SUBJECTS LISTED:</strong>
    <span>${subjectsListed}</span>
</div>
                </div>

                <!-- Footer Signatures & Validation Notice -->
                <div class="footer">
                    <div class="footer-row">
                        <div style="margin-bottom:60px;">Principal Signature: _________________________</div>
                        <div style="margin-bottom: 60px;">Proprietor Signature: _________________________</div>
                    </div>
                    <div class="footer-row" style="align-items: flex-end; margin-bottom: 4px;">
                        <div>Date of Issue: _________________________</div>
                        <div style="color: #dc2626; font-weight: bold; font-size: 11.5px;">Any Alteration will render this Certificate Invalid</div>
                    </div>
                </div>
            </div>
        </body>


        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};