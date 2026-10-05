-- ═══════════════════════════════════════════════════════════════════
-- Migração: remoção do Auth0
-- Data: 2026-04-10
--
-- O Auth0 foi REMOVIDO do código (backend e frontend). As colunas abaixo
-- ficaram no banco e, como o model não as preenche mais, quebram o
-- INSERT de novos usuários: `auth0_email_verified` é NOT NULL sem
-- default, então o INSERT estoura NOT NULL e a API responde 409.
--
-- >> OBRIGATÓRIO em TODO banco que já tem a tabela `usuario` criada
--    (MySQL de produção e o SQLite local). Bancos novos, criados a
--    partir do banco.sql já atualizado, não precisam deste script.
--
-- Rode UMA VEZ. O comando é seguro mesmo se as colunas não existirem
-- (use o IF EXISTS do MySQL 8 ou ignore o erro).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE usuario
  DROP COLUMN auth0_sub,
  DROP COLUMN auth0_email_verified;

-- Se o seu MySQL for antigo (< 8.0) e não aceitar múltiplos DROP COLUMN,
-- rode as duas linhas abaixo separadamente:
--
--   ALTER TABLE usuario DROP COLUMN auth0_sub;
--   ALTER TABLE usuario DROP COLUMN auth0_email_verified;

-- ─── Equivalente em SQLite ───────────────────────────────────────────
-- SQLite antigo (sem DROP COLUMN) precisa recriar a tabela:
--
--   CREATE TABLE usuario_novo (
--     id_usuario    CHAR(36)    NOT NULL PRIMARY KEY,
--     nome          VARCHAR(100) NOT NULL,
--     email         VARCHAR(255) NOT NULL,
--     senha_hash    BLOB        NOT NULL,
--     data_cadastro DATETIME     NOT NULL,
--     status_conta  VARCHAR(20)  NOT NULL
--   );
--   INSERT INTO usuario_novo
--     SELECT id_usuario, nome, email, senha_hash, data_cadastro, status_conta
--     FROM usuario;
--   DROP TABLE usuario;
--   ALTER TABLE usuario_novo RENAME TO usuario;
--   CREATE UNIQUE INDEX ix_usuario_email ON usuario (email);