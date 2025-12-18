import type { Metadata } from "next";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "ApplyFlow",
  description: "Job application management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>

          {children}
        </SessionWrapper>

      </body>
    </html>
  );
}