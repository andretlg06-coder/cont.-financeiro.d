# Correção de deploy Vercel

- [x] Inspecionar `package.json`, lockfile, `vite.config.ts` e `vercel.json`. Causa confirmada: `pnpm-lock.yaml` referenciava `patches/wouter@3.7.1.patch`, ausente no clone da Vercel.
- [x] Tornar o build compatível com a instalação limpa da Vercel, sem patch local obrigatório.
- [x] Definir explicitamente a saída estática `dist/public` e o fallback SPA de rotas.
- [x] Validar com `npm ci`, typecheck e build de produção; instalação sem vulnerabilidades reportadas.
- [ ] Gerar ZIP corrigido e documentar os passos para GitHub/Vercel.
