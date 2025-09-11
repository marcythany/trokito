import { useEffect, useState } from 'react';

export interface Settings {
	// UI Preferences
	theme: 'light' | 'dark' | 'system';
	fontSize: 'small' | 'medium' | 'large';
	reducedMotion: boolean;
	highContrast: boolean;
	language: 'pt-BR' | 'en-US';

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
	language: 'pt-BR',

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

		// Apply font size
		root.classList.remove('text-small', 'text-medium', 'text-large');
		root.classList.add(`text-${settings.fontSize}`);

		// Apply reduced motion
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		if (settings.reducedMotion || prefersReducedMotion) {
			root.style.setProperty('--motion-duration', '0s');
			root.classList.add('motion-reduce');
		} else {
			root.style.removeProperty('--motion-duration');
			root.classList.remove('motion-reduce');
		}

		// Apply high contrast
		if (settings.highContrast) {
			root.classList.add('high-contrast');
		} else {
			root.classList.remove('high-contrast');
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
