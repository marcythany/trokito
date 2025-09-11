'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { motion } from 'motion/react';
import { useState } from 'react';

interface SearchResult {
	title: string;
	url: string;
	description: string;
}

export default function SearchTestingPage() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [testing, setTesting] = useState(false);
	const [darkMode, setDarkMode] = useState(false);

	const handleSearch = async () => {
		if (!query.trim()) return;
		setLoading(true);
		try {
			// Brave Search API integration
			const response = await fetch(
				`/api/brave-search?q=${encodeURIComponent(query)}`
			);
			const data = await response.json();
			setResults(data.results || []);
		} catch (error) {
			console.error('Search failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleTest = async () => {
		setTesting(true);
		try {
			// Trigger Playwright test
			await fetch('/api/playwright-test', { method: 'POST' });
		} catch (error) {
			console.error('Test failed:', error);
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className={`min-h-screen p-4 ${darkMode ? 'dark' : ''}`}>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-4xl mx-auto space-y-6'
			>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center justify-between'>
							Search & Testing Integration
							<div className='flex items-center space-x-2'>
								<Label htmlFor='dark-mode'>Dark Mode</Label>
								<Switch
									id='dark-mode'
									checked={darkMode}
									onCheckedChange={setDarkMode}
								/>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex space-x-2'>
							<Input
								placeholder='Search with Brave...'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
								className='flex-1'
							/>
							<Button onClick={handleSearch} disabled={loading}>
								{loading ? 'Searching...' : 'Search'}
							</Button>
						</div>
						<Separator />
						<div className='flex space-x-2'>
							<Button onClick={handleTest} disabled={testing} variant='outline'>
								{testing ? 'Testing...' : 'Run Playwright Test'}
							</Button>
							<Badge variant='secondary'>Privacy-Focused</Badge>
						</div>
					</CardContent>
				</Card>

				{results.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}
					>
						<Card>
							<CardHeader>
								<CardTitle>Search Results</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									{results.map((result, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
											className='p-4 border rounded-lg hover:bg-accent/10'
										>
											<h3 className='font-semibold text-lg'>{result.title}</h3>
											<p className='text-sm text-muted-foreground mb-2'>
												{result.url}
											</p>
											<p>{result.description}</p>
										</motion.div>
									))}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}
