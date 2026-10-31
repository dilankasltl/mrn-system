import './globals.css';

export const metadata = {
  title: 'Sundaram Lanka Tyres LTD - MRN System',
  description: 'Material Request Note (MRN) Workflow and Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
