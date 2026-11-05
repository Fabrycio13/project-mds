# Revisão de arquitetura — 5 de novembro de 2026

**Base revalidada:** `08db06bc4752ce84d7780cbea104f7300d4d19b9` (`main`).
**Status:** diagnóstico e preparação para implementação; nenhuma refatoração aplicada.

[Relatório visual com diagramas antes/depois](architecture-review-2026-11-05.html). Abra o HTML em um navegador; os diagramas Mermaid e o Tailwind dependem de conexão às CDNs. O texto e os desenhos em CSS continuam disponíveis sem elas.

## Leitura arquitetural

O projeto usa HTML e JavaScript com Vite. A separação entre o laudo original (`index.html`) e a demo (`demo.html`) é intencional em `vite.config.js:4–10` e deve ser preservada. O tamanho dos arquivos não justifica, sozinho, dividi-los ou trocar o framework.

O ganho de **depth** está em esconder a coordenação de regras atrás da **interface** de um **module**, aumentando **locality** e **leverage**. Mover funções para outros arquivos sem reduzir o conhecimento exigido dos chamadores mantém o module **shallow**. A **seam** só deve ganhar um novo **adapter** quando houver variação concreta que o justifique.

Não foram encontrados `GLOSSARY.md` nem ADRs em `docs/adr/` nesta base. Há uma decisão aceita em `memory/decisions/DEC-4ad674df-ab2e-4d21-84f4-031a59dfc624.md`: usar `node:test` sem pacotes adicionais. Esta revisão preserva essa decisão.

## 1. Renda e condições aprovadas — Strong

**Referências:** `index.html:2308–2436` e `index.html:2469–2485`.

### Evidências

- `bindRenda` soma a renda dos dois proponentes; o evento de `hasP2` só altera a apresentação. Com rendas fictícias de R$ 3.000,00 e R$ 2.000,00, desativar o segundo proponente deixa o total em R$ 5.000,00. Confirmar se esse comportamento é desejado antes de mudar a regra.
- Com financiamento de R$ 80.000,00 e avaliação de R$ 100.000,00, limpar a avaliação muda `v-cota` para `-`, mas `v-cota2` permanece em `80%`.

### Direção, sem desenhar a interface futura

Concentrar participação na renda, totais e cotas em um module do laudo original. A interface deve esconder a ordem hoje exigida entre eventos e atualizações derivadas. O adapter de DOM continua concreto; não há necessidade demonstrada de um motor financeiro genérico.

**Deletion test:** extrair somente `parse` e `fmt` remove duplicação, mas deixa a coordenação espalhada. Um module deep ganha leverage quando sua remoção obrigaria os chamadores a reassumir essa coordenação.

**Dependências para implementar:**

1. Decidir se desativar P2 exclui sua renda do total e o que acontece ao reativá-lo; preservar os dados digitados ou limpá-los é uma decisão separada.
2. Definir a apresentação esperada para avaliação ausente, incluindo todas as repetições da cota.
3. Criar testes de caracterização para ativar → preencher → desativar → reativar P2, avaliação positiva → vazia, alteração da renda e alteração da parcela SIRIC.
4. Exercitar a mesma interface usada pelo formulário, em vez de manter uma cópia das regras apenas para testes.

## 2. Geração do PDF — Strong

**Referências:** `index.html:2590–2670`.

### Evidências

`gerarPDF()` termina após agendar `script.onload`. A captura e a gravação acontecem depois, em um callback assíncrono não aguardado pelo `try/catch` externo. O script também não tem `onerror` de carregamento.

Ao provocar uma rejeição controlada em `html2canvas`, o callback rejeitou, o tratamento externo não exibiu alerta e o botão permaneceu desabilitado. Foi uma reprodução isolada, sem gerar ou baixar um PDF real.

### Direção, sem desenhar a interface futura

O module de exportação deve assumir carregamento, captura, gravação e recuperação da apresentação como um ciclo único. A locality vem de concentrar todos os caminhos de conclusão; a leverage aparece nos botões que já acionam a mesma interface.

**Deletion test:** mover `gerarPDF` não acrescenta depth. O ganho existe quando remover o module devolveria o protocolo assíncrono inteiro ao chamador.

**Dependências para implementar:**

1. Preservar a exportação atual com jsPDF e html2canvas; as bibliotecas são carregadas por CDN no original.
2. Tratar falha de carregamento, rejeição da captura e falha de gravação, sempre restaurando os botões e permitindo nova tentativa.
3. Testar esses caminhos com dependências controladas; depois validar um PDF A4 real, incluindo conteúdo longo e visualização móvel.
4. Manter a impressão nativa da demo separada; não há demanda confirmada por uma seam comum de exportação com múltiplos adapters.

## 3. Projeção da demo — Worth exploring

**Referências:** `demo.html:277–293`, `demo.html:340–360` e `demo.html:370–453`.

### Evidências

No navegador, mudar a primeira prestação para R$ 2.500,00 deixou R$ 1.850,00 na prévia. Mudar a parcela SIRIC para R$ 2.000,00 manteve a cota SIRIC em `0%`.

A demo é fictícia e sem validade operacional. Isso reduz sua prioridade frente ao laudo original, salvo se o objetivo atual for somente o portfólio.

### Direção, sem desenhar a interface futura

Completar o module existente de projeção, ligando os campos acordados aos seus destinos e valores derivados. A locality deve ficar na demo; não compartilhar automaticamente regras, interface ou adapter com o original.

**Deletion test:** um helper que apenas copia texto seria shallow. O ganho de depth está em esconder todos os destinos que uma edição precisa atualizar.

**Dependências para implementar:**

1. Decidir quais controles precisam ser funcionais e quais informações são deliberadamente ilustrativas.
2. Testar campo → prévia, resultado → parecer, participação de P2 e restauração dos dados fictícios.
3. Conferir a prévia impressa após editar valores; preservar a identificação de demonstração sem validade operacional.

## Sequência recomendada

1. Confirmar as decisões de renda e de ausência de avaliação da oportunidade 1.
2. Caracterizar os fluxos e aprofundar esse module em uma mudança pequena.
3. Corrigir o ciclo do PDF em uma mudança independente; ele não depende da conclusão da refatoração de renda.
4. Completar a demo se isso fizer parte do objetivo do portfólio.

`public/public/laudo-mds.html` contém outra versão do laudo e é copiado pelo build para `dist/public/laudo-mds.html`. Confirmar se é material histórico ou uma entrada ainda usada antes de excluir, unificar ou redirecionar. Sua finalidade não bloqueia documentar esta revisão.

Nenhuma nova dependência npm foi identificada como necessária para começar os testes de caracterização ou o ajuste do ciclo do PDF. Reavaliar ferramentas somente quando houver uma necessidade concreta de automação no navegador.

## Verificações realizadas

Após atualizar a base local de `69db47e` para `08db06b`:

- `npm test`: **4 passaram, 0 falharam, 0 ignorados**.
- `npm run build`: passou com Vite 5.4.21.
- Quatro reproduções isoladas executando trechos reais do código em Node/VM confirmaram: renda de P2 oculto ainda somada, repetição da cota desatualizada, cota SIRIC parada na demo e rejeição de captura PDF sem recuperação.
- A divergência da prestação e a cota SIRIC parada na demo também foram observadas em um navegador real durante a revisão inicial.
- O relatório visual foi conferido em tela ampla e estreita, com os dois diagramas Mermaid renderizados e sem transbordamento horizontal.

Os testes existentes de formatação e cota usam implementações locais em `tests/unit/formatters.test.mjs`, não importam as regras reais do formulário. Seu resultado verde não comprova os fluxos acima. O teste de atributos `alt` lê o HTML real.

As reproduções exploratórias ficaram fora do repositório e não constituem uma suíte de regressão entregue por este PR. Os cenários e resultados estão registrados aqui para criar os testes durante a implementação.

Não foram auditados autenticação, regras oficiais de crédito, conteúdo da planilha ou um PDF final. Não foram alterados código da aplicação, bibliotecas ou regras financeiras.
