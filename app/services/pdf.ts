import * as Print from 'expo-print';

export interface PDFExportData {
  drugName: string;
  source?: string;
  isEli12?: boolean;
  sections: {
    whatItDoes?: string | null;
    howToTake?: string | null;
    warnings?: string | null;
    sideEffects?: string | null;
  };
}

export const PDFService = {
  generateMedicationReport: async (data: PDFExportData): Promise<string> => {
    const html = generateHTML(data);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  },
};

const generateHTML = (data: PDFExportData) => {
  const { drugName, source = 'FDA (OpenFDA)', isEli12 = false, sections } = data;
  const date = new Date().toLocaleDateString();

  const formatContent = (content: string | null | undefined) => {
    if (!content) return '<p class="missing-data">Information not available.</p>';
    
    // Remove any existing bullet point characters to standardize
    const cleanContent = content.replace(/^[•\-\*]\s*/gm, '').trim();
    
    // Split into sentences (simple heuristic)
    const sentences = cleanContent.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    if (sentences.length === 1 && cleanContent.length < 120) {
      return `<p class="content-text">${cleanContent}</p>`;
    }

    return `
      <ul class="bullet-list">
        ${sentences.map(s => `<li>${s.trim()}</li>`).join('')}
      </ul>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Medication Report - ${drugName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .header-label {
            font-size: 10pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.1em;
          }
          .header-branding {
            font-size: 8pt;
            font-weight: 600;
            color: #64748b;
            margin-top: 2px;
          }
          .header-date {
            font-size: 9pt;
            color: #94a3b8;
          }
          .divider {
            height: 1.5pt;
            background-color: #f1f5f9;
            margin-bottom: 20px;
          }
          .drug-info {
            margin-bottom: 24px;
          }
          .drug-name {
            font-size: 24pt;
            font-weight: 800;
            color: #1e293b;
            margin: 0 0 4px 0;
            letter-spacing: -0.02em;
          }
          .meta-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .source-text {
            font-size: 10pt;
            color: #64748b;
            font-weight: 500;
          }
          .tag {
            background-color: #d0ddfb;
            color: #0b348e;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
          }
          .sections {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .section {
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 10pt;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding-left: 10px;
          }
          .section-whatItDoes { border-left: 3px solid #10b981; color: #0c8d62; }
          .section-howToTake { border-left: 3px solid #4077f1; color: #0b348e; }
          .section-warnings { border-left: 3px solid #ec7b18; color: #bd600f; }
          .section-sideEffects { border-left: 3px solid #73428a; color: #563267; }
          
          .section-content {
            padding-left: 13px;
          }
          .content-text {
            font-size: 11pt;
            color: #334155;
            margin: 0;
          }
          .bullet-list {
            margin: 0;
            padding-left: 18px;
            color: #334155;
          }
          .bullet-list li {
            font-size: 11pt;
            margin-bottom: 6px;
          }
          .missing-data {
            font-size: 10pt;
            color: #94a3b8;
            font-style: italic;
            margin: 0;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #f1f5f9;
            padding-top: 16px;
            text-align: center;
          }
          .disclaimer {
            font-size: 9pt;
            line-height: 1.4;
            color: #64748b;
            font-style: italic;
            margin-bottom: 12px;
          }
          .footer-branding {
            font-size: 8pt;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="header-label">MEDICATION SUMMARY REPORT</div>
            <div class="header-branding">PREPARED BY MEDQUIRE AI</div>
          </div>
          <div class="header-date">${date}</div>
        </div>
        
        <div class="divider"></div>

        <div class="drug-info">
          <h1 class="drug-name">${drugName}</h1>
          <div class="meta-row">
            <span class="source-text">Source: ${source}</span>
            ${isEli12 ? '<span class="tag">ELI12 Mode</span>' : ''}
          </div>
        </div>

        <div class="sections">
          <div class="section">
            <div class="section-title section-whatItDoes">What it does</div>
            <div class="section-content">
              ${formatContent(sections.whatItDoes)}
            </div>
          </div>

          <div class="section">
            <div class="section-title section-howToTake">How to take it</div>
            <div class="section-content">
              ${formatContent(sections.howToTake)}
            </div>
          </div>

          <div class="section">
            <div class="section-title section-warnings">Warnings</div>
            <div class="section-content">
              ${formatContent(sections.warnings)}
            </div>
          </div>

          <div class="section">
            <div class="section-title section-sideEffects">Possible side effects</div>
            <div class="section-content">
              ${formatContent(sections.sideEffects)}
            </div>
          </div>
        </div>

        <div class="footer">
          <p class="disclaimer">
            MedQuire simplifies medical information for understanding. This document is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.
          </p>
          <div class="footer-branding">© ${new Date().getFullYear()} MedQuire Health Literacy Systems</div>
        </div>
      </body>
    </html>
  `;
};
