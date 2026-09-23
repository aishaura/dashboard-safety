import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Safety Intelligence Dashboard ID — Data Monitoring Kebencanaan, Kecelakaan & Risiko',
  description:
    'Platform intelijen keselamatan terintegrasi untuk pemantauan bencana BMKG/BNPB, titik api satelit NASA FIRMS, titik rawan kecelakaan Korlantas/KNKT, dan profil keselamatan wilayah.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
