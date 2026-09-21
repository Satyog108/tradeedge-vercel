import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeEdge — OI Dashboard",
  description: "Live NIFTY Open Interest analysis and hedge planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}