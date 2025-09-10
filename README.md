# Trokito - Calculadora de Troco

Trokito é uma aplicação web progressiva (PWA) projetada para ajudar operadores de caixa brasileiros a calcular trocos de forma rápida e eficiente, com recursos especiais para usuários com discalculia.

## 🌟 Recursos

- **Calculadora de Troco Inteligente**: Calcula o troco otimizado usando o algoritmo guloso
- **Arredondamento para 5 Centavos**: Arredonda valores para a menor moeda em circulação no Brasil
- **Fechamento de Caixa**: Ferramenta para contagem e registro de notas e moedas
- **Funciona Offline**: Totalmente funcional sem conexão com a internet
- **Autenticação Segura**: Suporte a biometria e PIN para acesso protegido
- **Armazenamento Local**: Todos os dados são armazenados no dispositivo do usuário
- **Acessível**: Design pensado para usuários com discalculia

## 🚀 Tecnologias

- **Next.js 15** com App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** para componentes de UI
- **WebAuthn/Passkeys** para autenticação
- **IndexedDB** para armazenamento offline
- **Service Worker** para PWA
- **Vitest** para testes

## 📦 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/trokito.git
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🧪 Testes

Para executar os testes unitários:

```bash
npm run test
```

Para executar os testes em modo watch:

```bash
npm run test:run
```

## 🛠️ Estrutura do Projeto

```
trokito/
├── app/                 # Páginas da aplicação Next.js
├── components/          # Componentes reutilizáveis
├── lib/                 # Funções utilitárias e lógica de negócios
├── public/              # Arquivos estáticos e PWA assets
├── tests/               # Testes unitários
├── package.json         # Dependências e scripts
└── ...
```

## 📱 PWA

Esta aplicação é um PWA completo que pode ser instalado em dispositivos móveis e desktop. Para instalar:

1. Abra o site em um navegador compatível
2. Clique no ícone de instalação na barra de endereços ou no menu do navegador
3. Siga as instruções para instalar

## 🔐 Autenticação

O Trokito oferece dois métodos de autenticação:

1. **WebAuthn/Passkeys**: Use biometria ou PIN do sistema
2. **PIN Local**: Configure um PIN que é armazenado criptografado no dispositivo

## 🧮 Algoritmo de Cálculo de Troco

O Trokito utiliza um algoritmo guloso otimizado para calcular o troco:

1. Calcula o valor exato do troco
2. Arredonda para o valor mais próximo terminado em 0 ou 5 centavos
3. Usa o algoritmo guloso para determinar a combinação ótima de notas e moedas
4. Mostra tanto o troco exato quanto o troco arredondado

## 📊 Fechamento de Caixa

A ferramenta de fechamento permite:

- Contagem de notas e moedas
- Cálculo automático do total
- Registro de operador e observações
- Exportação para CSV
- Cópia para área de transferência

## 🧑‍💼 Acessibilidade

Recursos especiais para usuários com discalculia:

- Fontes grandes e contrastantes
- Botões com tamanho mínimo de 44px
- Feedback visual claro
- Navegação por teclado otimizada
- Leitores de tela compatíveis

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 📧 Contato

Seu Nome - seu.email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/trokito](https://github.com/seu-usuario/trokito)
