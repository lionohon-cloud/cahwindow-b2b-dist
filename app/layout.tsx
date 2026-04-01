import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAH B2B 견적요청 시스템",
  description: "청암홈윈도우 B2B 배포용 견적 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
