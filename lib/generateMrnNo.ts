import MRN from '@/models/MRN';

/**
 * Generates sequential 5-digit MRN numbers:
 * Example: MRN-00001, MRN-00002, MRN-00003, ... MRN-99999
 */
export async function generateUniqueMRNNo(): Promise<string> {
  // Look for any existing MRN with 5-digit format
  const fiveDigitRegex = /^MRN-(\d{5})$/;
  const existingMRNs = await (MRN as any)
    .find({ mrnNo: fiveDigitRegex })
    .select('mrnNo')
    .lean();

  let maxSeq = 0;
  if (existingMRNs && existingMRNs.length > 0) {
    for (const doc of existingMRNs) {
      const match = (doc.mrnNo || '').match(fiveDigitRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  } else {
    // If no 5-digit MRNs exist yet, check total existing MRN count
    const totalCount = await MRN.countDocuments();
    maxSeq = totalCount;
  }

  let nextSeq = maxSeq + 1;
  let candidate = `MRN-${String(nextSeq).padStart(5, '0')}`;

  // Ensure candidate does not collide with any existing MRN
  while (await MRN.exists({ mrnNo: candidate })) {
    nextSeq++;
    candidate = `MRN-${String(nextSeq).padStart(5, '0')}`;
  }

  return candidate;
}
