import { useEffect, useState } from 'react';

export interface Settings {
	// UI Preferences
	theme: 'light' | 'dark' | 'system';
	fontSize: 'small' | 'medium' | 'large';
	reducedMotion: boolean;
	highContrast: boolean;

	// PDV Settings
	autoSave: boolean;
	defaultCalculationMode: 'exact' | 'suggested';
	availableDenominations: {
		bills: number[];
		coins: number[];
	};

	// History Settings
	maxHistoryItems: number;
	autoExportHistory: boolean;
}

const SETTINGS_KEY = 'trokito-settings';

const defaultSettings: Settings = {
	// UI Preferences
	theme: 'system',
	fontSize: 'medium',
	reducedMotion: false,
	highContrast: false,

	// PDV Settings
	autoSave: true,
	defaultCalculationMode: 'suggested',
	availableDenominations: {
		bills: [10000, 5000, 2000, 1000, 500, 200, 100], // R$ 100, 50, 20, 10, 5, 2, 1
		coins: [50, 25, 10, 5], // R$ 0.50, 0.25, 0.10, 0.05
	},

	// History Settings
	maxHistoryItems: 100,
	autoExportHistory: false,
};

export function useSettings() {
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = () => {
		try {
			const saved = localStorage.getItem(SETTINGS_KEY);
			if (saved) {
				const parsedSettings = JSON.parse(saved);
				const mergedSettings = { ...defaultSettings, ...parsedSettings };
				setSettings(mergedSettings);
				applySettings(mergedSettings);
			}
			setIsLoaded(true);
		} catch (error) {
			console.error('Erro ao carregar configurações:', error);
			setIsLoaded(true);
		}
	};

	const saveSettings = (newSettings: Partial<Settings>) => {
		try {
			const updatedSettings = { ...settings, ...newSettings };
			setSettings(updatedSettings);
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
			applySettings(updatedSettings);
		} catch (error) {
			console.error('Erro ao salvar configurações:', error);
		}
	};

	const applySettings = (settings: Settings) => {
		// Apply theme
		const root = document.documentElement;
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches;

		if (
			settings.theme === 'dark' ||
			(settings.theme === 'system' && prefersDark)
		) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		// Apply font size with CSS custom properties for better scaling
		root.classList.remove('text-small', 'text-medium', 'text-large');
		root.classList.add(`text-${settings.fontSize}`);

		// Apply font size scaling using CSS custom properties
		const fontScale = {
			small: '0.875',
			medium: '1',
			large: '1.125',
		};
		root.style.setProperty('--font-scale', fontScale[settings.fontSize]);
		root.style.setProperty(
			'font-size',
			`calc(1rem * ${fontScale[settings.fontSize]})`
		);

		// Apply reduced motion - disable all animations and transitions
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		if (settings.reducedMotion || prefersReducedMotion) {
			root.style.setProperty('--motion-duration', '0s');
			root.style.setProperty('--animation-duration', '0s');
			root.style.setProperty('animation-duration', '0s !important');
			root.style.setProperty('transition-duration', '0s !important');
			root.classList.add('motion-reduce');

			// Disable all CSS animations and transitions globally
			const style = document.createElement('style');
			style.id = 'reduced-motion-styles';
			style.textContent = `
				*, *::before, *::after {
					animation-duration: 0s !important;
					transition-duration: 0s !important;
					animation-delay: 0s !important;
					transition-delay: 0s !important;
				}
			`;
			document.head.appendChild(style);
		} else {
			root.style.removeProperty('--motion-duration');
			root.style.removeProperty('--animation-duration');
			root.style.removeProperty('animation-duration');
			root.style.removeProperty('transition-duration');
			root.classList.remove('motion-reduce');

			// Remove reduced motion styles
			const existingStyle = document.getElementById('reduced-motion-styles');
			if (existingStyle) {
				existingStyle.remove();
			}
		}

		// Apply high contrast with comprehensive color overrides
		if (settings.highContrast) {
			root.classList.add('high-contrast');

			// Apply high contrast CSS custom properties
			root.style.setProperty('--bg-primary', '#000000');
			root.style.setProperty('--bg-secondary', '#ffffff');
			root.style.setProperty('--text-primary', '#ffffff');
			root.style.setProperty('--text-secondary', '#000000');
			root.style.setProperty('--border-color', '#ffffff');
			root.style.setProperty('--accent-color', '#ffff00');
			root.style.setProperty('--muted-color', '#cccccc');

			// Create comprehensive high contrast styles
			const highContrastStyle = document.createElement('style');
			highContrastStyle.id = 'high-contrast-styles';
			highContrastStyle.textContent = `
				body {
					background-color: var(--bg-primary) !important;
					color: var(--text-primary) !important;
				}
				.bg-background {
					background-color: var(--bg-primary) !important;
				}
				.text-foreground {
					color: var(--text-primary) !important;
				}
				.text-muted-foreground {
					color: var(--muted-color) !important;
				}
				.border {
					border-color: var(--border-color) !important;
				}
				.bg-card {
					background-color: var(--bg-secondary) !important;
				}
				button, input, select, textarea {
					background-color: var(--bg-secondary) !important;
					color: var(--text-secondary) !important;
					border-color: var(--border-color) !important;
				}
				.text-primary {
					color: var(--accent-color) !important;
				}
			`;
			document.head.appendChild(highContrastStyle);
		} else {
			root.classList.remove('high-contrast');

			// Reset high contrast CSS custom properties
			root.style.removeProperty('--bg-primary');
			root.style.removeProperty('--bg-secondary');
			root.style.removeProperty('--text-primary');
			root.style.removeProperty('--text-secondary');
			root.style.removeProperty('--border-color');
			root.style.removeProperty('--accent-color');
			root.style.removeProperty('--muted-color');

			// Remove high contrast styles
			const existingStyle = document.getElementById('high-contrast-styles');
			if (existingStyle) {
				existingStyle.remove();
			}
		}
	};

	const resetSettings = () => {
		setSettings(defaultSettings);
		localStorage.removeItem(SETTINGS_KEY);
		applySettings(defaultSettings);
	};

	return {
		settings,
		isLoaded,
		saveSettings,
		resetSettings,
	};
}
