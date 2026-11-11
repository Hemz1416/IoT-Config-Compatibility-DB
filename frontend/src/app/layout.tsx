import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IoT Device Configuration & Compatibility Portal | PostgreSQL 16 + pgvector",
  description:
    "DBMS Level 3 Mini-Project (Team 9: PES2UG24CS196, PES2UG24CS192) — PostgreSQL 16.15 + pgvector v0.6.0 Web Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0B1120",
          color: "#F1F5F9",
          fontFamily:
            "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}

