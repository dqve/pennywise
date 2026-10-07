import type { Metadata } from 'next'; import './globals.css';
export const metadata:Metadata={title:'Pennywise — Financial wellness',description:'Understand, score, predict, plan and improve your money.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
