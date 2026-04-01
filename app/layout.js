import './globals.css';
import ClientProviders from './ClientProviders';

export const metadata = {
    title: 'AI4S Smart HR — Enterprise HRMS Platform',
    description: 'Hire to Retire — The complete enterprise HR management system by AI4S',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
