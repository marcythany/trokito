import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import type React from 'react';
import './globals.css';

const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
	weight: ['400', '600', '700'],
});

const roboto = Roboto({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-roboto',
	weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
	title: 'Trokito - Calculadora de Troco',
	description:
		'Ferramenta offline para operadores de caixa no Brasil com discalculia',
	generator: 'Trokito PWA',
	manifest: '/manifest.json',
	keywords: ['troco', 'caixa', 'calculadora', 'brasil', 'discalculia', 'pwa'],
	authors: [{ name: 'Trokito' }],
	creator: 'Trokito',
	publisher: 'Trokito',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Trokito',
	},
};

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR' className={`${inter.variable} ${roboto.variable}`}>
			<head>
				<meta name='theme-color' content='#0B4D36' />
				<meta name='background-color' content='#0B4D36' />
				<link rel='icon' href='/favicon.ico' />
				<link rel='apple-touch-icon' href='/icon-192x192.png' />
				<style>{`
          html {
            font-family: ${roboto.style.fontFamily};
            --font-sans: ${roboto.variable};
            --font-serif: ${inter.variable};
          }
        `}</style>
			</head>
			<body className='font-sans antialiased'>{children}</body>
		</html>
	);
}
