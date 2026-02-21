import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDKKU - Alzheimer Diagnosis System",
  description: "ระบบสารสนเทศทางการแพทย์ โรงพยาบาลศรีนครินทร์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}