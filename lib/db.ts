// lib/db.ts
export interface Closing {
	id?: number;
	date: Date;
	operatorName: string;
	notes: string;
	denominations: {
		value: number;
		count: number;
	}[];
	total: number;
}

class DatabaseService {
	private db: IDBDatabase | null = null;
	private readonly DB_NAME = 'TrokitoDB';
	private readonly DB_VERSION = 1;
	private readonly CLOSINGS_STORE = 'closings';

	constructor() {
		if (typeof window !== 'undefined') {
			this.initDB();
		}
	}

	private async initDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

			request.onerror = () => {
				console.error('Erro ao abrir o banco de dados:', request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create closings store
				if (!db.objectStoreNames.contains(this.CLOSINGS_STORE)) {
					const store = db.createObjectStore(this.CLOSINGS_STORE, {
						keyPath: 'id',
						autoIncrement: true,
					});
					store.createIndex('date', 'date', { unique: false });
				}
			};
		});
	}

	private async getDB(): Promise<IDBDatabase> {
		if (!this.db) {
			await this.initDB();
		}
		return this.db!;
	}

	// Add a new closing
	async addClosing(closing: Omit<Closing, 'id'>): Promise<number> {
		const db = await this.getDB();
		const transaction = db.transaction([this.CLOSINGS_STORE], 'readwrite');
		const store = transaction.objectStore(this.CLOSINGS_STORE);

		return new Promise((resolve, reject) => {
			const request = store.add({
				...closing,
				date: closing.date || new Date(),
			});

			request.onsuccess = () => {
				resolve(request.result as number);
			};

			request.onerror = () => {
				console.error('Erro ao adicionar fechamento:', request.error);
				reject(request.error);
			};
		});
	}

	// Get all closings
	async getAllClosings(): Promise<Closing[]> {
		const db = await this.getDB();
		const transaction = db.transaction([this.CLOSINGS_STORE], 'readonly');
		const store = transaction.objectStore(this.CLOSINGS_STORE);

		return new Promise((resolve, reject) => {
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result as Closing[]);
			};

			request.onerror = () => {
				console.error('Erro ao buscar fechamentos:', request.error);
				reject(request.error);
			};
		});
	}

	// Get closing by ID
	async getClosingById(id: number): Promise<Closing | null> {
		const db = await this.getDB();
		const transaction = db.transaction([this.CLOSINGS_STORE], 'readonly');
		const store = transaction.objectStore(this.CLOSINGS_STORE);

		return new Promise((resolve, reject) => {
			const request = store.get(id);

			request.onsuccess = () => {
				resolve(request.result as Closing | null);
			};

			request.onerror = () => {
				console.error('Erro ao buscar fechamento:', request.error);
				reject(request.error);
			};
		});
	}

	// Delete closing by ID
	async deleteClosing(id: number): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.CLOSINGS_STORE], 'readwrite');
		const store = transaction.objectStore(this.CLOSINGS_STORE);

		return new Promise((resolve, reject) => {
			const request = store.delete(id);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				console.error('Erro ao deletar fechamento:', request.error);
				reject(request.error);
			};
		});
	}

	// Export closings to CSV
	async exportToCSV(): Promise<string> {
		const closings = await this.getAllClosings();

		// CSV header
		let csv = 'Data,Operador,Total,Observações\n';

		// CSV rows
		closings.forEach((closing) => {
			const date = closing.date.toLocaleDateString('pt-BR');
			const total = (closing.total / 100).toFixed(2).replace('.', ',');
			const operator = closing.operatorName || '';
			const notes = closing.notes || '';

			// Escape commas and quotes in fields
			const escapeField = (field: string) => {
				if (field.includes(',') || field.includes('"')) {
					return `"${field.replace(/"/g, '""')}"`;
				}
				return field;
			};

			csv += `${escapeField(date)},${escapeField(operator)},${escapeField(
				total
			)},${escapeField(notes)}\n`;
		});

		return csv;
	}
}

// Export singleton instance
export const db = new DatabaseService();
