import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple icon generation script for PWA
async function generateIcons(): Promise<void> {
	const sizes: number[] = [192, 512];
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const publicDir = path.join(__dirname, '..', 'public');

	// Create a simple colored square as fallback icon
	for (const size of sizes) {
		const canvas = createCanvas(size, size);
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Create gradient background
		const gradient = ctx.createLinearGradient(0, 0, size, size);
		gradient.addColorStop(0, '#0B4D36');
		gradient.addColorStop(1, '#1a7a5c');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);

		// Add simple text
		ctx.fillStyle = 'white';
		ctx.font = `bold ${size * 0.3}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('T', size / 2, size / 2);

		// Save as PNG
		const buffer = canvas.toBuffer('image/png');
		const filename = `icon-${size}x${size}.png`;
		fs.writeFileSync(path.join(publicDir, filename), buffer);
		console.log(`Generated ${filename}`);
	}

	console.log('Icon generation complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	generateIcons().catch(console.error);
}

export { generateIcons };
