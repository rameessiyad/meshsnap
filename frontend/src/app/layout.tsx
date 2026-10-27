import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MeshSnap — Turn Images Into 3D",
    template: "%s | MeshSnap",
  },
  description:
    "Transform your ideas into 3D models. Upload an image, generate a model with AI, and preview your creation in an interactive 3D workspace.",
  applicationName: "MeshSnap",
  keywords: [
    "AI 3D generator",
    "image to 3D",
    "3D model generator",
    "GLB",
    "GLTF",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b09",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
