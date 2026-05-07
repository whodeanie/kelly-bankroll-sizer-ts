import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kelly Bankroll Sizer",
  description:
    "Fractional Kelly bankroll sizer with a 200 path Monte Carlo growth simulation. Educational analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
