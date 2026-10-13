# Limpeza: itens na dúvida (decisão do dono)

- **Ramos `mg42`/`ston` dentro do `case 'ak'` do `gunModel`:** nunca rodam, porque o `case 'lmg'` trata essas armas antes, com `break`. Ficaram porque mexem no modelo compartilhado das armas, e o ganho é pequeno (algumas linhas).
- **Campos de tabela sem leitor:**
  - `maxK` em `CAMP_CURVA`: nenhum código lê, mas está documentado no `campanha.md` §10.
  - `reload` das escopetas: só os bots usam; o tempo real vem do `shellTime`.
  - Apagar esses campos muda os dados da campanha e dos bots.
