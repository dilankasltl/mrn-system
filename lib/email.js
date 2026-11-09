import nodemailer from 'nodemailer';

function getTransporter() {
  const emailUser = process.env.EMAIL_USER || 'drmpoint12@gmail.com';
  const emailPass = (process.env.EMAIL_PASS || 'dfqbitcgrgrqvuwx').replace(/\s+/g, '');

  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    }),
    emailUser,
  };
}

// 1. Sent to Mr. Niranjan when Supervisor Approves
export async function sendSupervisorApprovalNotification({ mrn, supervisorName }) {
  try {
    const { transporter, emailUser } = getTransporter();
    const recipient = process.env.NIRANJAN_EMAIL || 'dilanka.it@sun-tws.com';

    const itemsHtml = (mrn.items || [])
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0284c7;">${it.itemCode || '-'}</td>
          <td style="padding: 10px; color: #1e293b; font-weight: 500;">${it.description}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold; color: #0f172a;">${it.requestQty} ${it.unit || 'NOS'}</td>
          <td style="padding: 10px; color: #64748b;">${it.remarks || '-'}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; color: #ffffff;">
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #bae6fd;">Sundaram Lanka Tyres LTD. - MRN Portal</div>
          <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 900; color: #ffffff;">Material Request Note Approved by Supervisor</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;">
              Dear <strong>Mr. Niranjan</strong>,
            </p>
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
              A Material Request Note from <strong>${mrn.department}</strong> has been reviewed and approved by Supervisor <strong>${supervisorName || 'Supervisor'}</strong> and is now pending your management review and sign-off.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">MRN Number:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0284c7; font-size: 15px;">${mrn.mrnNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Department:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${mrn.department}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Requested By:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${mrn.requestedBy}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Approved By:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #16a34a;">${supervisorName || 'Supervisor'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date & Time:</td>
              <td style="padding: 6px 0; color: #334155;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Requested Material Items:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 10px; width: 30px; text-align: center;">#</th>
                <th style="padding: 10px; width: 120px;">Item No.</th>
                <th style="padding: 10px;">Description</th>
                <th style="padding: 10px; width: 90px; text-align: center;">Qty</th>
                <th style="padding: 10px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://mrn-system.vercel.app/" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.4);">
              Open MRN Portal to Review & Approve
            </a>
          </div>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          This is an automated notification sent from Sundaram Lanka Tyres LTD. MRN Management System.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sundaram MRN Portal" <${emailUser}>`,
      to: recipient,
      subject: `[MRN Approval Pending] ${mrn.department} - ${mrn.mrnNo}`,
      html: htmlContent,
    });

    console.log(`Email sent successfully to Mr. Niranjan (${recipient}): ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send automated MRN email to Mr. Niranjan:', error);
    return { success: false, error: error.message };
  }
}

// 2. Sent to Mr. Vinod when Mr. Niranjan Approves (Final Authorization)
export async function sendNiranjanApprovalNotification({ mrn, approverName, comments }) {
  try {
    const { transporter, emailUser } = getTransporter();
    const recipient = process.env.VINOD_EMAIL || 'savindur980@gmail.com';

    const itemsHtml = (mrn.items || [])
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #7e22ce;">${it.itemCode || '-'}</td>
          <td style="padding: 10px; color: #1e293b; font-weight: 500;">${it.description}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold; color: #0f172a;">${it.requestQty} ${it.unit || 'NOS'}</td>
          <td style="padding: 10px; color: #64748b;">${it.remarks || '-'}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #7e22ce 0%, #581c87 100%); padding: 24px; color: #ffffff;">
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #f3e8ff;">Sundaram Lanka Tyres LTD. - MRN Portal</div>
          <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 900; color: #ffffff;">Final Plant Authorization Required (Mr. Vinod)</h1>
        </div>

        <div style="padding: 24px;">
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #3b0764;">
              Dear <strong>Mr. Vinod</strong>,
            </p>
            <p style="margin: 0; font-size: 13px; color: #581c87; line-height: 1.5;">
              A Material Request Note from <strong>${mrn.department}</strong> has been approved by Supervisor <strong>${mrn.supervisorApproval?.approvedBy || 'Supervisor'}</strong> and signed off by <strong>${approverName || 'Mr. Niranjan'}</strong>. It is now awaiting your <strong>Final Plant Authorization</strong> before Stores can issue materials.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 150px;">MRN Number:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #7e22ce; font-size: 15px;">${mrn.mrnNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Department:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${mrn.department}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Requested By:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${mrn.requestedBy}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Supervisor Approved:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #16a34a;">${mrn.supervisorApproval?.approvedBy || 'Supervisor'} (Approved)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Mr. Niranjan Signed:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${approverName || 'Mr. Niranjan'} (Approved)</td>
            </tr>
            ${comments ? `<tr><td style="padding: 6px 0; color: #64748b;">Comments:</td><td style="padding: 6px 0; color: #475569; font-style: italic;">"${comments}"</td></tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date & Time:</td>
              <td style="padding: 6px 0; color: #334155;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Requested Material Items:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 10px; width: 30px; text-align: center;">#</th>
                <th style="padding: 10px; width: 120px;">Item No.</th>
                <th style="padding: 10px;">Description</th>
                <th style="padding: 10px; width: 90px; text-align: center;">Qty</th>
                <th style="padding: 10px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://mrn-system.vercel.app/" style="display: inline-block; background: #7e22ce; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(126, 34, 206, 0.4);">
              Open MRN Portal for Final Authorization
            </a>
          </div>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          This is an automated notification sent from Sundaram Lanka Tyres LTD. MRN Management System.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sundaram MRN Portal" <${emailUser}>`,
      to: recipient,
      subject: `[Final Approval Required] ${mrn.department} - ${mrn.mrnNo}`,
      html: htmlContent,
    });

    console.log(`Email sent successfully to Mr. Vinod (${recipient}): ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send automated MRN email to Mr. Vinod:', error);
    return { success: false, error: error.message };
  }
}
