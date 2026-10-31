import MRN from '@/models/MRN';
import Department from '@/models/Department';

/**
 * Generates MRN numbers with department code + date + 5-digit sequential:
 * Example: HRD2026103100001, IT2026103100001, ENG2026103100002
 */
export async function generateUniqueMRNNo(department) {
  // Look up department code from DB
  const dept = await Department.findOne({ name: department }).select('code').lean();
  
  // Use department code, or first 3 chars of name (uppercase, alphanumeric only)
  let deptCode = '';
  if (dept && dept.code) {
    deptCode = dept.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  } else {
    deptCode = (department || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  // Limit code to max 5 chars
  if (deptCode.length > 5) deptCode = deptCode.substring(0, 5);
  if (deptCode.length === 0) deptCode = 'GEN';

  // Date string: YYYYMMDD
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  // Build prefix
  const prefix = deptCode + dateStr;

  // Find max sequence for this prefix
  const prefixRegex = new RegExp('^' + prefix + '(\\d{5})$');
  const existingMRNs = await MRN
    .find({ mrnNo: prefixRegex })
    .select('mrnNo')
    .lean();

  let maxSeq = 0;
  if (existingMRNs && existingMRNs.length > 0) {
    for (const doc of existingMRNs) {
      const match = (doc.mrnNo || '').match(prefixRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = prefix + String(nextSeq).padStart(5, '0');

  // Ensure candidate does not collide
  while (await MRN.exists({ mrnNo: candidate })) {
    nextSeq++;
    candidate = prefix + String(nextSeq).padStart(5, '0');
  }

  return candidate;
}
