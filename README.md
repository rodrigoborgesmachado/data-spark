# Data Spark

Data Spark e uma aplicacao web com ferramentas de consulta, geracao de dados e utilidades simples para apoiar testes, desenvolvimento e tarefas rapidas do dia a dia.

O projeto centraliza em uma interface unica recursos que normalmente exigiriam acessar varias APIs ou ferramentas separadas: dados ficticios para testes, consultas publicas brasileiras, contadores de texto, renderizacao de Markdown, geracao de QR Code e calculadoras para ciclistas.

## Funcionalidades

### Consultas

- **Verificar empresa**: consulta dados publicos de uma empresa por CNPJ, incluindo razao social, nome fantasia, situacao cadastral, abertura, atividades, capital social, endereco, telefone, email e JSON completo.
- **FIPE**: permite selecionar marca, modelo e ano/combustivel de carros para consultar valor, codigo FIPE, referencia, marca, modelo e combustivel.
- **IBGE - Nomes**: mostra o top 20 nacional de nomes mais usados e permite pesquisar a distribuicao historica de um nome por periodo.
- **Feriados**: lista feriados nacionais brasileiros de um ano informado.
- **Bancos**: exibe bancos brasileiros e permite consultar detalhes por codigo, como COMPE, ISPB, nome e razao social.
- **CEP**: consulta endereco por CEP, retornando logradouro, bairro, cidade, UF, estado, regiao, DDD, codigo IBGE e SIAFI.
- **Consulta CNJ**: busca comunicacoes processuais por numero de OAB e intervalo de datas, exibindo tribunal, orgao, tipo, processo, destinatarios, advogados, documento e texto da comunicacao quando disponivel.

### Geradores de dados

As paginas de geracao usam a API publica da Sunsale para criar dados aleatorios que podem ser usados em testes, prototipos e validacoes:

- **Pessoa fisica**
- **Empresa / pessoa juridica**
- **Cartao de credito**
- **Veiculo**
- **Escola**

Cada gerador permite criar novos dados, copiar campos individualmente e copiar o JSON completo do retorno.

### Utilidades

- **Ferramentas de texto**: calcula em tempo real letras, vogais, consoantes, caracteres com espacos, caracteres sem espacos, palavras e linhas.
- **Renderizador de Markdown**: carrega arquivos `.md` ou `.markdown`, mostra o conteudo original, renderiza uma pre-visualizacao em HTML e permite imprimir ou salvar em PDF.
- **Gerador de QR Code**: gera QR Code para URLs, adicionando `https://` automaticamente quando necessario, com preview e download em PNG.
- **Calculos para ciclistas**: calcula resumo geral do pedal, VAM, metros de subida por km, velocidade media e tempo estimado. Tambem classifica VAM e dificuldade da rota por faixas.

## Publico-alvo

O Data Spark foi pensado para desenvolvedores, analistas, QAs e usuarios que precisam obter rapidamente dados de apoio sem montar scripts ou navegar por varias fontes. Ele tambem serve como uma caixa de ferramentas para testes manuais, validacao de formularios, consultas cadastrais e pequenas analises.

## Principais fontes de dados

- API Sunsale para geradores de dados e alguns proxies de consulta.
- ReceitaWS para consulta de CNPJ via backend Sunsale.
- ViaCEP para consulta de CEP via backend Sunsale.
- BrasilAPI para feriados e bancos.
- API de nomes do IBGE.
- API FIPE publica.
- API publica de comunicacoes do CNJ/PJe.

## Tecnologias

- React
- Vite
- React Router
- Markdown It
- QRCode
- React Bootstrap e Bootstrap 5.3
- Bootstrap Icons e Inter (fontes locais)
- Recharts e ExcelJS para análise do Mobills
- ESLint

## Como executar

Instale as dependencias:

```bash
npm install
```

Execute em modo desenvolvimento:

```bash
npm run dev
```

Gere a build de producao:

```bash
npm run build
```

Valide o codigo com ESLint:

```bash
npm run lint
```


## Interface e temas

O catálogo reúne as 18 ferramentas em consultas públicas, geradores, utilidades,
ciclismo e finanças, com busca por nome, descrição ou categoria. As rotas e os
serviços existentes permanecem compatíveis.

- `src/components/AppLayout.jsx`, `AppHeader.jsx` e `Sidebar.jsx`: layout compartilhado, menu recolhível e navegação mobile com Offcanvas.
- `src/pages/Home/Home.jsx` e `src/components/ToolCard.jsx`: catálogo pesquisável.
- `src/components/PageHeader.jsx` e `Feedback.jsx`: cabeçalhos e estados de erro, carregamento e vazio.
- `src/theme/`: gerenciamento centralizado do tema claro/escuro.
- `src/assets/css/index.css`: tokens de cores, superfícies, tipografia, espaçamento e gráficos; inclui responsividade, impressão e movimento reduzido.
- `src/routes/config.js`: dados das ferramentas e categorias usados no catálogo e na navegação.

O tema usa `data-bs-theme` no elemento HTML, conforme os [modos de cor do Bootstrap](https://getbootstrap.com/docs/5.3/customize/color-modes/).
A preferência é salva em `dataSpark.theme` no localStorage. Sem preferência salva,
o sistema operacional define o tema; alterações do sistema são acompanhadas.
O script em `index.html` aplica o tema antes da inicialização do React e funciona
mesmo quando o armazenamento está indisponível. Fontes e ícones são servidos pelo
próprio aplicativo.

O analisador Mobills é carregado sob demanda para manter ExcelJS e Recharts fora
do pacote inicial. Importação, filtros, indicadores, exportação CSV e cálculos
continuam usando os módulos existentes em `src/utils`. QR Codes mantêm fundo branco
para leitura e download; a interface e a prévia Markdown acompanham o tema.

## Validação da interface

Além de `npm run lint` e `npm run build`, a revisão foi feita no Chromium em 1440 px
e 390 px, nos dois temas, cobrindo as 22 rotas sem overflow horizontal. As consultas
externas foram simuladas para verificar a interface sem depender da disponibilidade
dos provedores. Foram verificados busca e filtros do catálogo, persistência de tema,
menu mobile, consulta CEP, contadores de texto, senhas, QR Code, Markdown, ciclismo
e importação CSV/XLSX do Mobills. Também foram verificados filtros financeiros,
exportação CSV, confirmação de substituição de arquivo nos dois temas, layout
em tablet (768 px), acompanhamento do tema do sistema e tema com localStorage
bloqueado. O projeto não possui suíte de testes automatizados
configurada em `package.json`.
