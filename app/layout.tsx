import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalaryMaxxing — Salary-to-Work Ratio Calculator",
  description: "Compare your salary with a target and calculate the equivalent workday.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
