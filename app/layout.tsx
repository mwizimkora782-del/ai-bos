import './globals.css';

export const metadata = {
  title: 'AI-BOS Workspace',
  description: 'Autonomous Enterprise Control Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased m-0 p-0 selection:bg-neutral-800">{children}</body>
    </html>
  );
}
