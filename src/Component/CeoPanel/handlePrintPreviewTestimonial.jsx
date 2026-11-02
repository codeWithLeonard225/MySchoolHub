/**
 * Opens a clean standalone A4 print preview window for a School Leaving Testimonial.
 * @param {Object} result - The testimonial object containing student details, conduct, and remarks.
 */
export const handlePrintPreviewTestimonial = (result) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>School Leaving Testimonial - ${result.candidateName || "Student"}</title>
            <style>
                * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                @page { size: A4 portrait; margin: 8mm; }
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
                
                .slip-content {
    width: 100%;
    margin-bottom: 12px;
}
                
                .header { 
                    display: flex; 
                    align-items: center; 
                    border-bottom: 3px solid #000080; 
                    padding-bottom: 8px; 
                    margin-bottom: 10px; 
                }
                .logo-box { 
                    width: 100px; 
                    height: 100px; 
                    border: 2px solid #000080; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    background: #f0f4ff; 
                    margin-right: 15px; 
                    flex-shrink: 0; 
                    overflow: hidden; 
                }
                .logo-box img { width: 100%; height: 100%; object-fit: cover; }
                
                .school-info h1 { font-size: 16px; font-weight: 900; color: #000080; margin: 0 0 2px 0; text-transform: uppercase; }
                .school-info p.address { font-size: 14px; color: #333; margin: 2px 0; font-weight: 600; }
                .school-info p.tel { font-size: 14px; color: #333; margin: 2px 0; font-weight: 600; }
                .school-info p.motto { font-size: 14px; font-style: italic; color: #0000aa; margin: 2px 0 0 0; font-weight: bold; }
                
                .title-banner { background: #000080; color: #fff; text-align: center; padding: 6px; border-radius: 4px; margin-bottom: 12px; }
                .title-banner h2 { font-size: 15px; margin: 0; letter-spacing: 2px; font-weight: 900; }
                
                /* Student Details Box with Photo on Right */
                .details-box { 
                    border: 1px solid #000080; 
                    padding: 10px 12px; 
                    margin-bottom: 12px; 
                    background: #f9fbff; 
                    display: flex; 
                    justify-content: space-between; 
                    font-size: 12px; 
                    border-radius: 4px;
                }
                .details-grid { 
                    display: grid; 
                    grid-template-columns: 130px 1fr; 
                    row-gap: 6px; 
                    width: 100%; 
                    align-items: center;
                }
                .details-grid strong {
                    color: #333;
                    font-size: 11.5px;
                }
                .candidate-photo { 
                    width: 85px; 
                    height: 105px; 
                    border: 2px solid #000080; 
                    background: #fff; 
                    margin-left: 15px; 
                    flex-shrink: 0; 
                    overflow: hidden; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 10px; 
                    color: #777; 
                }
                .candidate-photo img { width: 100%; height: 100%; object-fit: cover; }

                .subjects-box {
                    border: 1px solid #000080;
                    margin-bottom: 12px;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .subjects-title {
                    background: #000080;
                    color: #fff;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 5px 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .subjects-content {
                    padding: 8px 10px;
                    background: #fff;
                    font-size: 12px;
                    line-height: 1.4;
                    font-weight: 600;
                    color: #222;
                }

                .remarks-box {
                    border: 1px solid #000080;
                    margin-bottom: 12px;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .remarks-content {
                    padding: 10px 12px;
                    background: #fff;
                    font-size: 12.5px;
                    line-height: 1.5;
                }

                .contact-strip {
                    text-align: center;
                    font-size: 10.5px;
                    font-weight: bold;
                    color: #444;
                    margin-bottom: 8px;
                    border-top: 1px dashed #bbb;
                    padding-top: 6px;
                }

                .remarks-writing-area {
    padding: 12px 15px 18px;
    background: #fff;
}

.conduct-writing-line {
    width: 100%;
    height: 35px;
    border-bottom: 1px dotted #333;
    box-sizing: border-box;
}

.principal-writing-lines {
    display: flex;
    flex-direction: column;
    gap: 25px;
    padding-top: 12px;
}

.principal-writing-line {
    width: 100%;
    height: 32px;
    border-bottom: 1px dotted #333;
    box-sizing: border-box;
}

               .footer {
    border-top: 1px solid #ccc;
    width: 100%;
    font-size: 11.5px;
    color: #333;
    padding-top: 5px;
    margin-top: 0;
    box-sizing: border-box;
}

                .footer-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    font-weight: 650;
                    margin-bottom: 8px;
                }

                .print-controls { text-align: center; background: #222; padding: 12px; margin-bottom: 20px; }
                .print-controls button { background: #16a34a; color: #fff; border: none; padding: 10px 20px; font-weight: bold; font-size: 14px; border-radius: 6px; cursor: pointer; }
                
                @media print {
                    .print-controls { display: none; }
                    body { background: none; }
                    .a4-page { padding: 8mm; box-shadow: none; margin: 0; width: 100%; height: 281mm; border: 6px double #000; background: #fff !important; }
                    .title-banner { background: #000080 !important; color: #fff !important; }
                    .subjects-title { background: #000080 !important; color: #fff !important; }
                    .details-box { background: #f9fbff !important; }
                }
            </style>
        </head>
        <body>
            <div class="print-controls">
                <button onclick="window.print()">🖨️ Click Here to Print / Save Testimonial PDF</button>
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
                        <h2>SCHOOL LEAVING TESTIMONIAL</h2>
                    </div>

                    <!-- Student Details Grid with Photo -->
                    <div class="details-box">
                        <div class="details-grid">
                            <strong>Student Name</strong> <span>: ${result.candidateName || "_________________________________________"}</span>
                            <strong>Year of Admission</strong> <span>: ${result.yearOfAdmission || ""}</span>
                            <strong>Admission No</strong> <span>: ${result.candidateNumber || ""}</span>
                            <strong>Date of Birth</strong> <span>: ${result.dateOfBirth || ""}</span>
                            <strong>Sex</strong> <span>: ${result.sex || ""}</span>
                            <strong>Address</strong> <span>: ${result.address || ""}</span>
                            <strong>Form Completed</strong> <span>: ${result.formCompleted || "SSS 4"}</span>
                            <strong>Place of Birth</strong> <span>: ${result.placeOfBirth || ""}</span>
                            <strong>Nationality</strong> <span>: ${result.nationality || "Sierra Leonean"}</span>
                        </div>
                        <div class="candidate-photo">
                            ${result.pupilImgUrl ? `<img src="${result.pupilImgUrl}" alt="Photo" />` : 'No Photo'}
                        </div>
                    </div>

                    <!-- Subjects Offered -->
                    <div class="subjects-box">
                        <div class="subjects-title">Subjects Offered</div>
                        <div class="subjects-content">
                            ${result.subjectsOffered || "Mathematics, English Language, Financial Accounting, Prin. of Cost Accounting, Biology, Business Management, Health Science, Commerce & Economics"}
                        </div>
                    </div>

                  <!-- Conduct & Principal's Remarks -->
<div class="remarks-box">
    <div class="subjects-title">Conduct & Principal’s Remarks</div>

    <div class="remarks-writing-area">

        <strong>Conduct:</strong>
        <div class="conduct-writing-line"></div>

        <div style="margin-top: 20px;">
            <strong>Principal’s Remarks & Recommendation:</strong>

            <div class="principal-writing-lines">
                ${Array.from({ length: 4 }, () => `
                    <div class="principal-writing-line"></div>
                `).join("")}
            </div>
        </div>

    </div>
</div>
                </div>

                <!-- Footer Signatures & Contact -->
                <div class="footer">
                    <div class="contact-strip">
                        Contact: +23276619022 / +232767801 / +23299085208 / +23277588551
                    </div>
                    <div class="footer-row">
                        <div>Date issued: ${result.dateIssued || "_________________________"}</div>
                        <div>Principal’s Sign: _________________________</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};