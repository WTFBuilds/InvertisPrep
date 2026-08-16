/**
 * Build a meaningful download filename for watermarked PDFs.
 * E.g., "Database Management Systems CSE Computer Science Semester 3 2024-25 Mid-Term [www.invertisprep.in].pdf"
 */

export const buildDownloadFilename = (paper, isSyllabus = false) => {
  const brand = 'www.invertisprep.in';

  if (isSyllabus) {
    const syllabusName = (paper.name || 'Document').trim();
    return `${syllabusName} [${brand}].pdf`;
  }

  const dept =
    typeof paper.departmentId === 'object' && paper.departmentId
      ? paper.departmentId.displayName || paper.departmentId.name || ''
      : '';
  const branch =
    typeof paper.branchId === 'object' && paper.branchId ? paper.branchId.name || '' : '';
  const session =
    typeof paper.sessionId === 'object' && paper.sessionId ? paper.sessionId.name || '' : '';

  const EXAM_TYPE_LABEL = {
    'mid-term': 'Mid-Term',
    'end-term': 'End-Term',
  };

  const parts = [
    paper.subjectName,
    dept,
    branch,
    paper.semester ? `Semester ${paper.semester}` : '',
    session,
    EXAM_TYPE_LABEL[paper.examType] || '',
  ].filter(Boolean);

  const base = parts.join(' ') || 'Document';
  // Remove characters that are invalid in filenames, keep spaces
  const safe = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  return `${safe} [${brand}].pdf`;
};

/**
 * Build Content-Disposition header with ASCII fallback + RFC 5987 filename* for UTF-8
 */
export const buildContentDisposition = (filename, disposition = 'attachment') => {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/"/g, "'")
    .slice(0, 120);
  const encodedFilename = encodeURIComponent(filename);

  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`;
};