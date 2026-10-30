import MRN from '@/models/MRN';

export async function generateUniqueMRNNo(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Find the highest sequence for today
  const regex = new RegExp(`^MRN-${datePrefix}-(\\d{4})$`);
  const latestMRN = await MRN.findOne({ mrnNo: regex }).sort({ mrnNo: -1 }).select('mrnNo').lean();

  let nextSeq = 1;
  if (latestMRN && (latestMRN as any).mrnNo) {
    const match = (latestMRN as any).mrnNo.match(regex);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(4, '0');
  return `MRN-${datePrefix}-${seqStr}`;
}
