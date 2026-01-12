import { Request, Response, NextFunction } from 'express';
import { generatePDF } from '../services/pdfService';
import { AppError } from '../middleware/errorHandler';

export const downloadPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Generate PDF
    const pdfBuffer = await generatePDF(id, req.user.userId);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};






