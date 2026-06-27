import type { Metadata, Viewport } from "next";
import "./globals.css";
import ChromeShell from "./ChromeShell";

export const metadata: Metadata = {
  title: "PSLE Oral Hero",
  description: "Practice for PSLE English Oral examinations with AI-powered feedback",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChromeShell />
        {children}
      </body>
    </html>
  );
}
