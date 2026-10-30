import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sundaram Lanka Tyres LTD - MRN System',
  description: 'Material Request Note (MRN) Workflow and Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
