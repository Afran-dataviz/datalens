import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap'
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: "DataLens — Transform Spreadsheet Data Into Luxury Insights",
  description: "Upload CSV, Excel, or JSON files, clean messy data automatically, generate custom Recharts visuals, and chat with your datasets using state-of-the-art Groq AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && !crypto.randomUUID) {
                crypto.randomUUID = function() {
                  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
                    .replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0;
                      var v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                };
              }
            `
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
