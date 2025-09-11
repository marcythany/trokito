# Trokito Playwright Testing Suite

Uma suíte completa de testes automatizados para análise UI/UX do aplicativo Trokito, otimizada para testes de calculadoras financeiras em ambientes locais.

## 🚀 Visão Geral

Esta suíte de testes utiliza Playwright para automatizar interações do usuário, capturar screenshots, analisar performance e validar padrões de UI/UX específicos para aplicações financeiras brasileiras.

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Navegadores suportados (instalados automaticamente)

## 🛠️ Instalação

1. **Instalar navegadores do Playwright:**

```bash
npm run test:install-browsers
```

2. **Verificar instalação:**

```bash
npx playwright --version
```

## 📊 Scripts Disponíveis

### Testes Básicos

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes com interface visual
npm run test:e2e:ui

# Executar testes no modo debug
npm run test:e2e:debug

# Executar testes com navegador visível
npm run test:e2e:headed
```

### Análise UI/UX Específica

```bash
# Análise completa de UI/UX com screenshots e performance
npm run test:ui-analysis

# Análise no modo debug (navegador visível)
npm run test:ui-analysis:debug

# Visualizar relatório de testes
npm run test:report
```

## 🏗️ Estrutura do Projeto

```
tests/playwright/
├── fixtures/           # Configurações de teste compartilhadas
│   └── trokito-fixture.ts
├── helpers/            # Utilitários para interações específicas
│   ├── form-helpers.ts     # Preenchimento de formulários
│   └── navigation-helpers.ts # Navegação inteligente
├── specs/              # Casos de teste
│   └── ui-ux-analysis.spec.ts
├── utils/              # Utilitários avançados
│   ├── performance-monitor.ts # Monitoramento de performance
│   ├── snapshot-utils.ts      # Captura de screenshots
│   ├── trokito-page.ts        # Page Object Model
│   └── wait-utils.ts          # Estratégias de espera
├── test-runner.ts      # Executor personalizado de testes
└── README.md          # Esta documentação
```

## 🎯 Funcionalidades Principais

### 1. **Navegação Eficiente**

- Retry automático para conexões instáveis
- Espera inteligente por elementos
- Validação de estados de carregamento

### 2. **Preenchimento de Formulários**

- Formatação automática de moeda brasileira (R$)
- Validação de entrada em tempo real
- Suporte a diferentes tipos de input

### 3. **Captura de Screenshots**

- Screenshots automatizados em pontos críticos
- Análise responsiva (mobile, tablet, desktop)
- Captura de estados de erro

### 4. **Estratégias de Espera Dinâmica**

- Espera por estabilidade visual
- Detecção de animações completas
- Validação de cálculos assíncronos

### 5. **Monitoramento de Performance**

- Métricas Core Web Vitals (CLS, FID, LCP)
- Análise de tempo de carregamento
- Detecção de memory leaks

### 6. **Análise de Acessibilidade**

- Verificação de contraste de cores
- Validação de navegação por teclado
- Testes com screen readers

## 📱 Casos de Teste Incluídos

### Jornada Completa do Usuário

1. **Login e Autenticação**

   - Teste de PIN
   - Validação de WebAuthn
   - Tratamento de erros

2. **Calculadora de Troco**

   - Preenchimento de valores
   - Cálculos automáticos
   - Validação de resultados
   - Tratamento de erros

3. **Fechamento de Caixa**

   - Contagem de denominações
   - Cálculos de totais
   - Exportação de dados

4. **Análise Responsiva**
   - Layouts mobile (375px)
   - Tablets (768px)
   - Desktop (1920px)

## 🔧 Configuração Avançada

### Arquivo de Configuração (`playwright.config.ts`)

```typescript
export default defineConfig({
	// Base URL para testes locais
	baseURL: 'http://localhost:3000',

	// Estratégias de espera otimizadas
	use: {
		actionTimeout: 10000,
		navigationTimeout: 30000,
		slowMo: 50, // Reduz flakiness
	},

	// Projetos para diferentes navegadores
	projects: [
		{ name: 'chromium', use: devices['Desktop Chrome'] },
		{ name: 'firefox', use: devices['Desktop Firefox'] },
		{ name: 'webkit', use: devices['Desktop Safari'] },
		{ name: 'Mobile', use: devices['Pixel 5'] },
	],

	// Servidor de desenvolvimento automático
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:3000',
		reuseExistingServer: true,
	},
});
```

### Page Object Model (`TrokitoPage`)

Classe centralizada para interações com a aplicação:

```typescript
const trokitoPage = new TrokitoPage(page);

// Navegação inteligente
await trokitoPage.navigateTo('troco');

// Preenchimento otimizado
await trokitoPage.fillCalculatorForm({
	pdvChange: 'R$ 150,00',
	customerContribution: 'R$ 50,00',
});

// Captura de resultados
const result = await trokitoPage.getCalculationResult();
```

## 📈 Relatórios e Análises

### Relatório HTML Automático

- Métricas de performance
- Screenshots organizados
- Recomendações de melhoria
- Análise de acessibilidade

### Estrutura de Resultados

```
test-results/
├── ui-ux-report.html    # Relatório principal
├── ui-ux-report.json    # Dados estruturados
├── screenshots/         # Capturas organizadas
│   ├── login-flow-*.png
│   ├── calculator-*.png
│   └── responsive-*.png
└── traces/             # Rastreamentos de execução
```

## 🎨 Análise UI/UX Específica

### Para Aplicativos Financeiros

- **Contraste de Cores**: Validação WCAG AA
- **Hierarquia Visual**: Análise de tamanhos e pesos
- **Espaçamento**: Consistência em todo o app
- **Tipografia**: Legibilidade para disléxicos

### Para Discalculia

- **Números Grandes**: Fontes maiores para valores
- **Cores Distintas**: Diferenciação visual clara
- **Layout Simples**: Redução de complexidade cognitiva
- **Feedback Visual**: Confirmações claras de ações

### Para Mobile/Tablet

- **Touch Targets**: Mínimo 44px
- **Gestos**: Suporte a swipe e pinch
- **Orientação**: Adaptação automática
- **Performance**: Otimização para dispositivos móveis

## 🚦 Boas Práticas Implementadas

### Estabilidade

- Retry automático em falhas de rede
- Espera inteligente por elementos
- Validação de estados antes de ações

### Performance

- Paralelização de testes
- Reutilização de servidor de desenvolvimento
- Captura seletiva de screenshots

### Manutenibilidade

- Page Object Model
- Helpers reutilizáveis
- Configuração centralizada

### Debugging

- Modo debug interativo
- Screenshots em falhas
- Logs detalhados

## 🔍 Troubleshooting

### Problemas Comuns

1. **Navegadores não instalados:**

```bash
npm run test:install-browsers
```

2. **Servidor não iniciado:**

```bash
npm run dev
# Em outro terminal
npm run test:e2e
```

3. **Timeouts frequentes:**

```bash
# Aumentar timeouts no playwright.config.ts
actionTimeout: 15000,
navigationTimeout: 45000,
```

4. **Screenshots não salvos:**

```bash
# Verificar permissões da pasta
mkdir -p tests/playwright/screenshots
```

## 📚 Exemplos de Uso

### Teste Básico

```typescript
test('calculadora funciona corretamente', async ({ trokitoPage }) => {
	await trokitoPage.navigateTo('troco');
	await trokitoPage.fillCalculatorForm({
		pdvChange: 'R$ 200,00',
		customerContribution: 'R$ 50,00',
	});

	const result = await trokitoPage.getCalculationResult();
	expect(result).toContain('R$ 150,00');
});
```

### Análise de Performance

```typescript
test('performance de cálculo', async ({ page }) => {
	const monitor = new PerformanceMonitor(page);

	const metrics = await monitor.monitorInteraction(async () => {
		// Executar cálculo
		await page.fill('#pdvChange', 'R$ 100,00');
		await page.click('button[type="submit"]');
	});

	expect(metrics.duration).toBeLessThan(1000);
});
```

## 🤝 Contribuição

1. Adicione novos casos de teste em `specs/`
2. Crie helpers reutilizáveis em `helpers/`
3. Atualize a documentação conforme necessário
4. Execute todos os testes antes de commit

## 📄 Licença

Este projeto segue a mesma licença do Trokito.

---

**💡 Dica**: Para desenvolvimento, use `npm run test:ui-analysis:debug` para ver os testes em ação com o navegador visível.
