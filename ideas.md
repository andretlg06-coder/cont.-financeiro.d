# Direção de produto e design — Controle Financeiro

## Abordagens consideradas

### Abordagem 1 — Caderno de Caixa Editorial
**Very Brief Intro:** Uma experiência clara, tátil e editorial, inspirada em cadernos contábeis contemporâneos, com tipografia expressiva e uma paleta de papel, tinta e verde mineral.
**Probability:** 0.03

### Abordagem 2 — Estúdio Operacional Azul-Índigo
**Very Brief Intro:** Um painel de gestão preciso e silencioso, com estrutura de estação de trabalho, superfícies claras, azul profundo e acentos âmbar para decisões rápidas.
**Probability:** 0.07

### Abordagem 3 — Ledger Solar
**Very Brief Intro:** Um sistema caloroso e energético, que combina fundo grafite, laranja solar e sinais de progresso para transformar finanças em um hábito visualmente motivador.
**Probability:** 0.02

## Abordagem escolhida — Estúdio Operacional Azul-Índigo

### Design Movement
Swiss International Typographic Style reinterpretado para software financeiro: hierarquia rigorosa, ritmo modular, contraste tipográfico e informação organizada sem aparência burocrática.

### Core Principles
1. Clareza antes de ornamentação: cada número possui contexto, unidade e estado.
2. Assimetria funcional: navegação lateral, blocos de resumo e áreas de trabalho com pesos diferentes.
3. Confiança visual: azul índigo para estabilidade, âmbar para decisões e verde/vermelho apenas para semântica financeira.
4. Densidade confortável: dados compactos, mas sempre com respiro e leitura escaneável.

### Color Philosophy
O índigo profundo comunica controle e confiabilidade sem recorrer ao azul corporativo genérico. Fundos de marfim frio reduzem fadiga em uso diário; âmbar funciona como marcador de atenção e ação. Verde folha e vermelho terracota aparecem somente quando o significado financeiro exige, evitando transformar toda a interface em alerta.

### Layout Paradigm
Uma estação de trabalho com trilho lateral persistente, cabeçalho curto e canvas em duas colunas: visão geral e atividade recente. Formulários aparecem em painéis contextuais; tabelas e gráficos ocupam áreas de leitura contínua. No mobile, o trilho vira navegação inferior/compacta e as colunas colapsam em sequência.

### Signature Elements
- Faixas numeradas e pequenos rótulos monoespaçados para períodos e categorias.
- Cartões com linha de destaque lateral e micrográficos de tendência.
- Ícone de marca formado por duas barras ascendentes que se encaixam como um sinal de equilíbrio.

### Interaction Philosophy
Interações devem confirmar o estado do sistema: adicionar lançamento atualiza os totais imediatamente, filtros preservam o contexto e exclusões exigem confirmação. A interface sempre mostra o efeito antes de esconder o detalhe.

### Animation
Entradas de cartões usam fade + deslocamento vertical curto, com atraso de 40ms entre grupos. Botões respondem com compressão sutil. Modais e drawers entram em até 220ms com easing de saída pronunciado. Não animar números de forma que dificulte a leitura; respeitar `prefers-reduced-motion`.

### Typography System
Display: **DM Sans**, em pesos 600–700, para títulos e totais. Body: **Source Sans 3**, em 400–600, para leitura e formulários. Dados auxiliares: **IBM Plex Mono**, em 500, para datas, códigos e percentuais. Hierarquia: título de tela 32px, seções 18px, valor principal 30–40px, corpo 14–16px, micro-rótulos 11–12px com tracking ampliado.

### Brand Essence
**Controle financeiro diário para pessoas que querem enxergar decisões, não apenas registrar despesas — com precisão, contexto e calma.** Personalidade: **preciso, sereno, progressivo**.

### Brand Voice
Headlines são diretas e orientadas a estado. CTAs usam verbos concretos. Microcopy explica consequências sem julgamento.

Exemplos:
- “Seu mês está sob controle.”
- “Registrar lançamento”

### Wordmark & Logo
O símbolo é composto por duas hastes verticais de alturas distintas, unidas por uma base curta deslocada: representa entradas e saídas encontrando equilíbrio. O wordmark usa “saldo.” em DM Sans Semibold com o ponto em âmbar, nunca como texto genérico do navegador.

### Signature Brand Color
**Índigo Controle — #243B6B**, usado em navegação, títulos de confiança e estados selecionados.

## Incrementos funcionais

1. **Incremento 1 — Fundação:** estrutura do dashboard, navegação, tema, moeda BRL e armazenamento versionado.
2. **Incremento 2 — Lançamentos:** criação, edição, exclusão e filtragem de receitas e despesas.
3. **Incremento 3 — Visão financeira:** saldo, receitas, despesas, taxa de economia e evolução mensal.
4. **Incremento 4 — Categorias e metas:** classificação, limites mensais e acompanhamento de progresso.
5. **Incremento 5 — Qualidade e entrega:** validação de invariantes, exportação/importação JSON e instruções para Vercel.

## Critérios de correção financeira

Todos os valores monetários serão armazenados em **centavos inteiros**, evitando erros de ponto flutuante. A entrada em reais será convertida por parser explícito para centavos; totais serão somados como inteiros; a formatação para BRL ocorrerá apenas na apresentação. O saldo será calculado como receitas menos despesas, e os indicadores serão derivados da mesma fonte de lançamentos persistida no localStorage.

## Style Decisions

A estação desktop deve manter trilho lateral índigo persistente, canvas modular e assimetria funcional. O símbolo de duas barras ascendentes reaparece no topo mobile, em marcadores de seção e em estados de navegação. Texturas ficam contidas em gráficos e callouts; cartões, tabelas e filtros priorizam linhas, coordenadas monoespaçadas e superfícies limpas. Barras laterais coloridas identificam módulos-chave sem substituir a hierarquia de dados.
