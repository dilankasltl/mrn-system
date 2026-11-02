import * as XLSX from 'xlsx';

export function exportMRNsToExcel(mrns, { title = 'Sundaram_MRN_Report', department = 'All', dateRangeLabel = '' } = {}) {
  if (!mrns || mrns.length === 0) {
    alert('No MRN records to export.');
    return;
  }

  const rows = [];

  mrns.forEach((m) => {
    const formattedDate = m.date ? new Date(m.date).toLocaleDateString() : '';
    const supApproved = m.supervisorApproval?.approved ? 'YES' : 'NO';
    const supName = m.supervisorApproval?.approvedBy || '';
    const supDate = m.supervisorApproval?.approvedAt ? new Date(m.supervisorApproval.approvedAt).toLocaleDateString() : '';

    const niranjanApproved = m.niranjanApproval?.approved ? 'YES' : 'NO';
    const niranjanDate = m.niranjanApproval?.approvedAt ? new Date(m.niranjanApproval.approvedAt).toLocaleDateString() : '';

    const vinodApproved = m.vinodApproval?.approved ? 'YES' : 'NO';
    const vinodDate = m.vinodApproval?.approvedAt ? new Date(m.vinodApproval.approvedAt).toLocaleDateString() : '';
    const withoutNiranjan = m.vinodApproval?.withoutNiranjan ? 'YES' : 'NO';

    const storesIssued = m.storesIssue?.issued || m.isLocked ? 'YES' : 'NO';
    const storesOfficer = m.storesIssue?.issuedBy || '';
    const storesDate = m.storesIssue?.issuedAt ? new Date(m.storesIssue.issuedAt).toLocaleDateString() : '';
    const storesRemarks = m.storesIssue?.storesRemarks || '';

    if (m.items && m.items.length > 0) {
      m.items.forEach((it) => {
        rows.push({
          'MRN Number': m.mrnNo,
          'Date': formattedDate,
          'Department': m.department,
          'Requested By': m.requestedBy,
          'Shift': m.shift || 'General',
          'Overall Status': m.status?.replace(/_/g, ' '),
          'Item No': it.itemNo,
          'Item Description': it.description,
          'Material Request Qty': it.requestQty,
          'Material Issued QTY': it.issueQty || 0,
          'Item Remarks': it.remarks || '',
          'Supervisor Approved': supApproved,
          'Supervisor Name': supName,
          'Supervisor Date': supDate,
          'Mr. Niranjan Approved': niranjanApproved,
          'Mr. Niranjan Date': niranjanDate,
          'Mr. Vinod Approved': vinodApproved,
          'Mr. Vinod Date': vinodDate,
          'Direct Approved (No Niranjan)': withoutNiranjan,
          'Stores Issued': storesIssued,
          'Stores Officer': storesOfficer,
          'Stores Issue Date': storesDate,
          'Stores Remarks': storesRemarks,
          'General Remarks': m.generalRemarks || '',
        });
      });
    } else {
      rows.push({
        'MRN Number': m.mrnNo,
        'Date': formattedDate,
        'Department': m.department,
        'Requested By': m.requestedBy,
        'Shift': m.shift || 'General',
        'Overall Status': m.status?.replace(/_/g, ' '),
        'Item No': '-',
        'Item Description': 'No items',
        'Request Qty': 0,
        'Unit': '-',
        'Issue Qty': 0,
        'Item Remarks': '',
        'Supervisor Approved': supApproved,
        'Supervisor Name': supName,
        'Supervisor Date': supDate,
        'Mr. Niranjan Approved': niranjanApproved,
        'Mr. Niranjan Date': niranjanDate,
        'Mr. Vinod Approved': vinodApproved,
        'Mr. Vinod Date': vinodDate,
        'Direct Approved (No Niranjan)': withoutNiranjan,
        'Stores Issued': storesIssued,
        'Stores Officer': storesOfficer,
        'Stores Issue Date': storesDate,
        'Stores Remarks': storesRemarks,
        'General Remarks': m.generalRemarks || '',
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'MRN History');

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 18 }, // MRN Number
    { wch: 12 }, // Date
    { wch: 18 }, // Department
    { wch: 16 }, // Requested By
    { wch: 10 }, // Shift
    { wch: 18 }, // Overall Status
    { wch: 8 },  // Item No
    { wch: 32 }, // Item Description
    { wch: 12 }, // Request Qty
    { wch: 8 },  // Unit
    { wch: 10 }, // Issue Qty
    { wch: 16 }, // Item Remarks
    { wch: 18 }, // Supervisor Approved
    { wch: 16 }, // Supervisor Name
    { wch: 14 }, // Supervisor Date
    { wch: 18 }, // Mr. Niranjan Approved
    { wch: 14 }, // Mr. Niranjan Date
    { wch: 16 }, // Mr. Vinod Approved
    { wch: 14 }, // Mr. Vinod Date
    { wch: 22 }, // Direct Approved
    { wch: 14 }, // Stores Issued
    { wch: 16 }, // Stores Officer
    { wch: 14 }, // Stores Date
    { wch: 20 }, // Stores Remarks
    { wch: 20 }, // General Remarks
  ];

  const dateSuffix = new Date().toISOString().slice(0, 10);
  const cleanDept = department.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${title}_${cleanDept}_${dateRangeLabel ? `${dateRangeLabel}_` : ''}${dateSuffix}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
