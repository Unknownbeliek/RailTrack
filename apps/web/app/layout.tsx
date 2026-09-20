import './globals.css';
import React from 'react';

export const metadata = {
  title: 'TrackPulse India — Real-Time Spatial Train Intelligence',
  description: 'Track overtakes, loop-line holds, speed graphs, and live train context across Indian Railways.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-bgPrimary">
      <body className="h-full w-full overflow-hidden text-textPrimary bg-bgPrimary antialiased">
        {children}
      </body>
    </html>
  );
}
