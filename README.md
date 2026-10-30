# Sundaram Lanka Tyres LTD. - MRN (Material Request Note) System

A full-stack, enterprise-grade Material Request Note (MRN) workflow and inventory issuance application built for **Sundaram Lanka Tyres LTD.**, ready for direct deployment on **Vercel** with **MongoDB Atlas**.

---

## 🚀 Key Features

### 1. Department & Shift Multi-Role System
- **All Company Departments Included**:
  - HRD, Engineering Stores, Finished Goods Store (FGS), Purchasing, Raw Material Store (RMS), Band Painting, Band Room, Bead, Mixing, Non mark, Planning, Press Lines, Shot Blast, Trimming, Tyre Building, Tyre Repair, Boiler, Electrician, Maintenance, Mould, EDC, Laboratory, IT, Finance & Accounting, HRD & Admin, Logistic, Production, Quality Assurance, Research & Development, Supply Chain.
  - Shifts: **Shift A**, **Shift B**, **Shift C**.
- **Designated Supervisors Assigned**:
  - Finance: *Mr. Vidura*, *Mrs. Pavithra*
  - HR: *Mr. Rohitha*
  - IT: *Mr. Tharindu*
  - Quality Assurance: *Mr. Wickrama*, *Mr. Dulan*
  - Production: *Mr. Ravimal*, *Mr. Dhammika*
  - Planning: *Mr. Avishka*, *Mr. Dhammika*
  - Laboratory: *Mr. Hasula*
  - Engineering & Maintenance: *Mr. Dilanka*, *Mr. Shemba*
  - Engineering Store & RMS: *Mr. Thiwanka*, *Mr. Subash*
  - Finished Goods Store (FGS): *Mr. Dimuthu*, *Mr. Dhammika*
  - Purchasing: *Mr. Manjula*, *Mr. Gayashan*
  - Shift A: *Mr. Thushara*, *Mr. Ravimal*, *Mr. Dhammika*, *Mr. Rusiru*
  - Shift B: *Mr. Rathnayake*, *Mr. Ravimal*, *Mr. Dhammika*
  - Shift C: *Mr. Viraj*, *Mr. Ravimal*, *Mr. Dhammika*

### 2. Multi-Tier Approval Workflow
1. **MRN Generation**:
   - Unique auto-increment MRN Number (e.g. `MRN-YYYYMMDD-XXXX`).
   - Default **3 rows** on creation, with capability to dynamically add more item rows.
   - Fields: Item No., Description, Material Request QTY, Unit, Remarks.
2. **Supervisor Approval**:
   - Requester's department supervisor signs off.
   - Instantly notifies & displays in pending queue for Management and Stores.
3. **Management Approval**:
   - **Mr. Niranjan** plant sign-off.
   - **Mr. Vinod** final approval.
   - **Override Logic**: Mr. Vinod has full authority to approve even if Mr. Niranjan has not approved yet. When this happens, a prominent notice badge is displayed:
     `⚠️ Notice: Approved by Mr. Vinod (Without Mr. Niranjan's approval)`.
4. **Stores Issuance & Strict Locking**:
   - Stores officer enters `Material Issue QTY` per item and stores remarks.
   - Stores **CANNOT** modify requested quantities or item descriptions.
   - Once Stores marks items as issued, **it is permanently locked**. Neither Stores nor any department can revert to "not issued" or delete the MRN.
   - Only the **System Admin** can override or delete locked records.

### 3. Plant-Wide Real-Time MRN Search & Tracking
- Any department or employee can enter any MRN number in the header search bar and view its live journey:
  - Who requested it
  - Which supervisor signed off
  - Status of Mr. Niranjan's approval
  - Status of Mr. Vinod's approval
  - Material issued quantities and store remarks

### 4. Stores & Executive Analytics Dashboard
- Department-wise breakdown table:
  - Total requests, requested quantities, issued quantities, fulfillment rates.
- **Interactive Visual Charts** (Recharts):
  - Department requested vs issued quantities bar chart.
  - MRN pipeline distribution donut/pie chart.
- **Excel (.xlsx) Export**:
  - One-click export of complete plant MRN records into a formatted spreadsheet.

### 5. Admin Console
- Add / edit departments.
- Assign 1, 2, or 3+ supervisors per department.
- Global MRN audit and management.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Database**: MongoDB Atlas (with Mongoose ODM)
- **Styling**: Tailwind CSS & Lucide React icons
- **Charts**: Recharts
- **Spreadsheets**: SheetJS (XLSX)
- **Deployment**: Vercel ready

---

## 💻 Local Development Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/dilankasltl/mrn-system.git
   cd mrn-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://savindudilanka9793_db_user:t9mDUBAhQqR33P9v@cluster0.tuz1edm.mongodb.net/sundaram_mrn_db?retryWrites=true&w=majority
   NEXT_PUBLIC_APP_NAME="Sundaram Lanka Tyres LTD"
   NEXT_PUBLIC_COMPANY_NAME="Sundaram Lanka Tyres LTD"
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Complete Sundaram Lanka Tyres MRN system"
   git push origin main
   ```

2. In [Vercel Dashboard](https://vercel.com):
   - Click **Add New Project** -> Import your GitHub repository (`dilankasltl/mrn-system`).
   - In **Environment Variables**, add:
     - `MONGODB_URI`: `mongodb+srv://savindudilanka9793_db_user:t9mDUBAhQqR33P9v@cluster0.tuz1edm.mongodb.net/sundaram_mrn_db?retryWrites=true&w=majority`
   - Click **Deploy**!
