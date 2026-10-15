# Adicionar calculadora de porcentagem

## Descrição

Adicionar ao Data Spark uma calculadora de porcentagem para tarefas do dia a dia,
como calcular descontos, aumentos e a diferença percentual entre dois valores.
A ferramenta deve apresentar o resultado e o cálculo realizado de forma clara,
seguindo o design e os temas existentes na aplicação.

## Objetivo

Permitir que o usuário resolva cálculos percentuais rapidamente, sem precisar
montar fórmulas ou utilizar serviços externos.

## Funcionalidades

### Porcentagem de um valor

- Informar um valor base e uma porcentagem.
- Exibir quanto essa porcentagem representa sobre o valor informado.
- Fórmula: `resultado = valor × porcentagem / 100`.
- Exemplo: `15% de 200 = 30`.

### Aplicar desconto

- Informar o valor original e a porcentagem de desconto.
- Exibir o valor do desconto e o valor final.
- Fórmulas:
  - `desconto = valor original × porcentagem / 100`.
  - `valor final = valor original − desconto`.
- Exemplo: `200 com 15% de desconto = 170`, com desconto de `30`.

### Aplicar aumento

- Informar o valor original e a porcentagem de aumento.
- Exibir o valor do aumento e o valor final.
- Fórmulas:
  - `aumento = valor original × porcentagem / 100`.
  - `valor final = valor original + aumento`.
- Exemplo: `200 com 15% de aumento = 230`, com aumento de `30`.

### Variação percentual entre dois valores

- Informar um valor inicial e um valor final.
- Exibir a diferença absoluta e a variação percentual.
- Fórmulas:
  - `diferença = valor final − valor inicial`.
  - `variação = (valor final − valor inicial) / valor inicial × 100`.
- Exemplos:
  - De `200` para `250`: diferença de `50` e aumento de `25%`.
  - De `200` para `150`: diferença de `−50` e redução de `25%`.
  - De `200` para `200`: sem alteração, com variação de `0%`.
- Quando o valor inicial for zero, informar que não é possível calcular a
  variação percentual, sem exibir resultados inválidos.

## Experiência de uso

- Disponibilizar a ferramenta na categoria **Utilidades**, no catálogo e no menu.
- Usar o título **Calculadora de porcentagem**.
- Usar a descrição curta: **Calcule porcentagens, descontos, aumentos e variações entre valores.**
- Oferecer um seletor de operação, exibindo apenas os campos necessários.
- Usar rótulos claros, exemplos nos campos e um botão **Calcular**.
- Separar visualmente o resultado do formulário e mostrar a fórmula com os
  valores informados.
- Disponibilizar ações para copiar o resultado e limpar os campos.
- Preservar os valores preenchidos ao alternar o tema.
- Exibir uma orientação inicial quando ainda não houver cálculo.
- Ao editar os campos após calcular, atualizar ou limpar o resultado anterior
  para evitar a apresentação de um resultado que não corresponda às entradas.

## Validação e apresentação

- Aceitar números inteiros e decimais, com vírgula ou ponto como separador decimal.
- Não interpretar campos vazios como zero.
- Validar campos obrigatórios e rejeitar valores que não sejam números finitos.
- Apresentar mensagens de validação junto ao formulário.
- Formatar resultados em português brasileiro, com até duas casas decimais.
- Manter a precisão durante o cálculo e arredondar somente na apresentação.
- Exibir valores numéricos sem símbolo monetário obrigatório, permitindo usos
  além de preços.

## Diretrizes técnicas

- Manter React e Vite e utilizar os componentes existentes do React Bootstrap.
- Reutilizar os padrões de cabeçalho, formulário, mensagens e resultados.
- Respeitar os temas claro e escuro, os tokens CSS e o movimento reduzido.
- Realizar os cálculos localmente, sem chamadas de API ou novas dependências.
- Manter os dados do formulário apenas na sessão da ferramenta.
- Sugestão de rota: `/porcentagem`.
- Sugestão de página: `src/pages/PercentageCalculator/PercentageCalculator.jsx`.
- Cadastrar a ferramenta em `src/routes/config.js` e adicionar a rota em `src/App.jsx`.

## Critérios de aceite

- [ ] A ferramenta aparece na busca, no catálogo e no menu de Utilidades.
- [ ] As quatro operações estão disponíveis e utilizam as fórmulas descritas.
- [ ] Os exemplos deste documento produzem os resultados esperados.
- [ ] Entradas decimais com vírgula e ponto funcionam corretamente.
- [ ] Campos vazios e números inválidos geram mensagens compreensíveis.
- [ ] A variação com valor inicial zero é tratada sem divisão por zero.
- [ ] O resultado inclui o cálculo realizado e pode ser copiado.
- [ ] A ação de limpar restaura o estado inicial da ferramenta.
- [ ] A interface funciona em desktop e mobile sem overflow horizontal.
- [ ] Os temas claro e escuro mantêm boa legibilidade e os valores preenchidos.
- [ ] Campos e ações podem ser utilizados pelo teclado e possuem rótulos acessíveis.
- [ ] Build e lint passam após a implementação.

## Validação sugerida

Verificar as quatro operações com os exemplos acima, porcentagem zero, valores
decimais, campos vazios e variação com valor inicial zero. Revisar também a cópia,
a limpeza, a edição após o cálculo, a troca de tema e a navegação por teclado.

Este documento descreve a proposta da funcionalidade; sua implementação é uma
etapa posterior.
