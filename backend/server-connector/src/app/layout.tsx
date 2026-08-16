export const metadata = {
  title: 'Scen Server Connector',
  description: 'Server-side API surface for Scen. No product UI is served from here.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
