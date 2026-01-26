import puppeteer from 'puppeteer';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

interface ResumeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  profession?: string;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any[];
  languages?: any[];
}

export const generatePDF = async (resumeId: string, userId: string): Promise<Buffer> => {
  try {
    // Fetch resume data
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Generate HTML from resume data
    const html = generateHTMLFromResume(resume);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
      },
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to generate PDF', 500);
  }
};

const generateHTMLFromResume = (resume: any): string => {
  const templateId = resume.templateId || 'modern';
  
  // Get template HTML
  let html = getTemplateHTML(templateId);
  
  // Replace placeholders with actual data
  html = html.replace(/\{\{firstName\}\}/g, resume.firstName || '');
  html = html.replace(/\{\{lastName\}\}/g, resume.lastName || '');
  html = html.replace(/\{\{email\}\}/g, resume.email || '');
  html = html.replace(/\{\{phone\}\}/g, resume.phone || '');
  html = html.replace(/\{\{location\}\}/g, resume.location || '');
  html = html.replace(/\{\{profession\}\}/g, resume.profession || '');
  html = html.replace(/\{\{summary\}\}/g, resume.summary || '');
  
  // Process experience
  if (resume.experience && Array.isArray(resume.experience)) {
    const experienceHTML = resume.experience.map((exp: any) => {
      const dateStr = formatDate(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear, exp.isCurrent);
      const description = exp.description ? 
        exp.description.split('\n').map((line: string) => `<li>${escapeHtml(line.trim())}</li>`).join('') : '';
      
      return `
        <div class="mb-4">
          <div class="flex justify-between items-baseline mb-1">
            <h3 class="text-sm font-bold text-slate-900">${escapeHtml(exp.jobTitle || '')}</h3>
            <span class="text-xs text-slate-500 font-medium">${dateStr}</span>
          </div>
          <p class="text-xs text-slate-700 italic mb-2">${escapeHtml(exp.company || '')}</p>
          ${description ? `<ul class="list-disc list-inside text-xs text-slate-600 leading-relaxed space-y-1">${description}</ul>` : ''}
        </div>
      `;
    }).join('');
    html = html.replace(/\{\{experience\}\}/g, experienceHTML);
  } else {
    html = html.replace(/\{\{experience\}\}/g, '');
  }
  
  // Process education
  if (resume.education && Array.isArray(resume.education)) {
    const educationHTML = resume.education.map((edu: any) => {
      const dateStr = formatDate(edu.startMonth, edu.startYear, edu.endMonth, edu.endYear, edu.isCurrent);
      return `
        <div class="mb-3">
          <h3 class="text-sm font-bold text-slate-900">${escapeHtml(edu.degree || edu.schoolName || '')}</h3>
          <p class="text-xs text-slate-700">${escapeHtml(edu.schoolName || '')}</p>
          <p class="text-xs text-slate-500 mt-1">${dateStr}</p>
        </div>
      `;
    }).join('');
    html = html.replace(/\{\{education\}\}/g, educationHTML);
  } else {
    html = html.replace(/\{\{education\}\}/g, '');
  }
  
  // Process skills
  if (resume.skills && Array.isArray(resume.skills)) {
    const skillsHTML = resume.skills.map((skill: any) => {
      return `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">${escapeHtml(skill.name || skill)}</span>`;
    }).join('');
    html = html.replace(/\{\{skills\}\}/g, skillsHTML);
  } else {
    html = html.replace(/\{\{skills\}\}/g, '');
  }
  
  // Process languages
  if (resume.languages && Array.isArray(resume.languages)) {
    const languagesHTML = resume.languages.map((lang: any) => {
      return `<p class="text-xs text-slate-600">${escapeHtml(lang.name || lang)} - ${escapeHtml(lang.level || '')}</p>`;
    }).join('');
    html = html.replace(/\{\{languages\}\}/g, languagesHTML);
  } else {
    html = html.replace(/\{\{languages\}\}/g, '');
  }
  
  return html;
};

const formatDate = (startMonth?: string, startYear?: string, endMonth?: string, endYear?: string, isCurrent?: boolean): string => {
  let start = '';
  if (startMonth && startYear) {
    start = `${startMonth} ${startYear}`;
  } else if (startYear) {
    start = startYear.toString();
  }
  
  let end = '';
  if (isCurrent) {
    end = 'Günümüz';
  } else if (endMonth && endYear) {
    end = `${endMonth} ${endYear}`;
  } else if (endYear) {
    end = endYear.toString();
  }
  
  if (start && end) {
    return `${start} - ${end}`;
  } else if (start) {
    return start;
  }
  return '';
};

const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const getTemplateHTML = (templateId: string): string => {
  // Modern template (default)
  const modernTemplate = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Özgeçmiş</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1e293b;
      background: white;
      padding: 20px;
    }
    .container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
    }
    .header {
      border-bottom: 2px solid #1e293b;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 5px;
    }
    .header .profession {
      font-size: 14px;
      color: #475569;
      margin-bottom: 10px;
    }
    .contact-info {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      font-size: 10px;
      color: #64748b;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 10px;
      color: #1e293b;
    }
    .section-content {
      font-size: 11px;
      color: #475569;
      text-align: justify;
    }
    .experience-item, .education-item {
      margin-bottom: 15px;
    }
    .experience-item h3, .education-item h3 {
      font-size: 12px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .experience-item .company, .education-item .school {
      font-size: 11px;
      font-style: italic;
      color: #475569;
      margin-bottom: 5px;
    }
    .experience-item .date, .education-item .date {
      font-size: 10px;
      color: #64748b;
    }
    .experience-item ul {
      margin-top: 5px;
      padding-left: 20px;
    }
    .experience-item li {
      margin-bottom: 3px;
      color: #475569;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .skill-tag {
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      color: #475569;
    }
    .languages {
      font-size: 11px;
      color: #475569;
    }
    @media print {
      body {
        padding: 0;
      }
      .container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{firstName}} {{lastName}}</h1>
      <div class="profession">{{profession}}</div>
      <div class="contact-info">
        <span>{{email}}</span>
        <span>{{phone}}</span>
        <span>{{location}}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Özet</div>
      <div class="section-content">{{summary}}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Deneyim</div>
      {{experience}}
    </div>
    
    <div class="section">
      <div class="section-title">Eğitim</div>
      {{education}}
    </div>
    
    <div class="section">
      <div class="section-title">Yetenekler</div>
      <div class="skills">{{skills}}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Diller</div>
      <div class="languages">{{languages}}</div>
    </div>
  </div>
</body>
</html>
  `;

  // Return template based on templateId
  switch (templateId) {
    case 'modern':
    default:
      return modernTemplate;
    // Add more templates here as needed
  }
};







