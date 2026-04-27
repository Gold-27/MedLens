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
  const { drugName, source = 'OpenFDA', isEli12 = false, sections } = data;
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });

  const formatContent = (content: string | null | undefined) => {
    if (!content) return '<p class="missing-data">Information not available for this section.</p>';
    
    const cleanContent = content.replace(/^[•\-\*]\s*/gm, '').trim();
    const items = cleanContent.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    if (items.length <= 1) {
      return `<p class="content-text">${cleanContent}</p>`;
    }

    return `
      <ul class="bullet-list">
        ${items.map(s => `<li>${s.trim()}</li>`).join('')}
      </ul>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 40px;
            background-color: white;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .top-label {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          .date-stamp {
            color: #e2e2e2;
          }
          .drug-header {
            margin-bottom: 30px;
          }
          .drug-name {
            font-size: 32pt;
            font-weight: 900;
            color: #1a233b;
            margin: 0;
            line-height: 1;
            letter-spacing: -1.5px;
          }
          .drug-meta {
            margin-top: 8px;
            font-size: 10pt;
            display: flex;
            gap: 15px;
          }
          .source-label {
            color: #7d7d7d;
          }
          .mode-label {
            color: #1e40af;
            font-weight: 800;
            text-transform: uppercase;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 11pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          .section-title::before {
            content: "";
            display: inline-block;
            width: 3px;
            height: 18px;
            margin-right: 10px;
          }
          
          /* Section Colors */
          .title-whatItDoes { color: #10b981; }
          .title-whatItDoes::before { background-color: #10b981; }
          
          .title-howToTake { color: #3b82f6; }
          .title-howToTake::before { background-color: #3b82f6; }
          
          .title-warnings { color: #f59e0b; }
          .title-warnings::before { background-color: #f59e0b; }
          
          .title-sideEffects { color: #8b5cf6; }
          .title-sideEffects::before { background-color: #8b5cf6; }

          .content-text {
            font-size: 11pt;
            color: #444;
            margin: 0;
            padding-left: 13px;
          }
          .bullet-list {
            margin: 0;
            padding-left: 13px;
            list-style-type: disc;
          }
          .bullet-list li {
            font-size: 11pt;
            color: #444;
            margin-bottom: 8px;
            padding-left: 5px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
            text-align: center;
          }
          .disclaimer {
            font-size: 9pt;
            color: #999;
            font-style: italic;
            line-height: 1.4;
            margin-bottom: 15px;
          }
          .copyright {
            font-size: 8pt;
            color: #aaa;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-label">
            <span>Medication Summary Report</span>
            <span class="date-stamp">${date}</span>
          </div>

          <div class="drug-header">
            <h1 class="drug-name">${drugName}</h1>
            <div class="drug-meta">
              <span class="source-label">Source: ${source}</span>
              ${isEli12 ? '<span class="mode-label">ELI12 Mode</span>' : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title title-whatItDoes">What it does</div>
            <div class="section-content">
              ${formatContent(sections.whatItDoes)}
            </div>
          </div>

          <div class="section">
            <div class="section-title title-howToTake">How to take it</div>
            <div class="section-content">
              ${formatContent(sections.howToTake)}
            </div>
          </div>

          <div class="section">
            <div class="section-title title-warnings">Warnings</div>
            <div class="section-content">
              ${formatContent(sections.warnings)}
            </div>
          </div>

          <div class="section">
            <div class="section-title title-sideEffects">Possible side effects</div>
            <div class="section-content">
              ${formatContent(sections.sideEffects)}
            </div>
          </div>

          <div class="footer">
            <p class="disclaimer">
              MedQuire simplifies medical information for understanding. This document is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.
            </p>
            <div class="copyright">
              © 2026 MedQuire Health Literacy Systems
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
