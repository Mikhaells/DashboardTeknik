import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Dashboard Teknik TVRI",
    template: "%s - Dashboard Teknik TVRI",
  },
  description: "Sistem Manajemen Teknik TVRI - Dashboard untuk monitoring dan manajemen operasional teknik",
  keywords: ["TVRI", "Teknik", "Dashboard", "Manajemen", "Monitoring"],
  authors: [{ name: "TVRI Direktorat Teknik" }],
  creator: "TVRI Direktorat Teknik",
  publisher: "TVRI - Televisi Republik Indonesia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://0.0.0.0:3000"),
  openGraph: {
    title: "Dashboard Teknik TVRI",
    description: "Sistem Manajemen Teknik TVRI",
    type: "website",
    locale: "id_ID",
    siteName: "Dashboard Teknik TVRI",
    images: [
      {
        url: "/TVRILogo2019.svg.webp",
        width: 1200,
        height: 630,
        alt: "TVRI Logo - Dashboard Teknik",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard Teknik TVRI",
    description: "Sistem Manajemen Teknik TVRI",
    images: ["/TVRILogo2019.svg.webp"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/TVRILogo2019.svg.webp" />
        <link rel="icon" type="image/png" sizes="32x32" href="/TVRILogo2019.svg.webp" />
        <link rel="icon" type="image/png" sizes="16x16" href="/TVRILogo2019.svg.webp" />
        <link rel="apple-touch-icon" sizes="180x180" href="/TVRILogo2019.svg.webp" />
        <link rel="shortcut icon" href="/TVRILogo2019.svg.webp" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
