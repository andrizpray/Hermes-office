import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Office Simulator',
  description: 'Real-time multi-agent office simulation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
