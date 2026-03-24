import { Comfortaa, Nunito, Caveat, UnifrakturMaguntia } from "next/font/google";

export const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: 'swap',
});

export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: 'swap',
});

export const handwriting = Caveat({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-handwriting",
  display: 'swap',
});

export const blackletter = UnifrakturMaguntia({ 
  subsets: ["latin"], 
  weight: ["400"],
  variable: "--font-blackletter",
  display: 'swap',
});
