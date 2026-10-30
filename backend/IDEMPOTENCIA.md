# Idempotência da API

As escritas (`POST`, `PUT`, `PATCH`, `DELETE`) aceitam `Idempotency-Key` com 8 a
128 caracteres ASCII: letras, números, `.`, `-`, `_` ou `:`. O login é excluído.
Uma ação nova deve receber uma chave nova (UUID); reenvios conservam a chave.
Não deduplique ações apenas pelo corpo: duas ingestões iguais de água podem ser legítimas.

O recibo é isolado por usuário, método, caminho e chave. Corpo JSON e query string
são conferidos por HMAC; reutilizar a chave com outros dados retorna `409`.
Autenticação, validação e rate limit continuam sendo aplicados antes do replay.
Somente respostas `2xx` são armazenadas. `Idempotency-Replayed: true` identifica
uma resposta recuperada; status HTTP, corpo e Content-Type são preservados.
Tokens e senhas de entrada não são armazenados no recibo.

A chave primária da tabela `operacao_idempotente` arbitra chamadas simultâneas
entre processos/instâncias. Recibo e alterações compartilham o mesmo commit.
Falhas ou respostas inválidas desfazem a operação inteira, permitindo reenviar
a mesma chave. Um timeout/deadlock no banco pode retornar `503`; nesse caso,
reenvie com a mesma chave. Não há cache em memória nem expiração automática dos
recibos: removê-los encerra a proteção para reenvios antigos dessas chaves.

Clientes antigos sem chave continuam aceitos, com transação atômica, mas não
ganham proteção contra criações repetidas. O aplicativo atualizado gera chaves
para escritas e faz um único reenvio automático em falhas de rede/`5xx` transitórios.
Quiz e inclusão de água/itens mantêm a chave durante a tentativa manual na mesma
tela. Essas referências são em memória: encerrar o aplicativo ou iniciar uma
nova ação exige uma nova chave, sem promessa de recuperar uma ação abandonada.

## Quiz

- `POST /api/v1/auth/registrar-com-quiz`: recebe `{ cadastro, quiz }` e salva
  conta, perfil, pesquisa, medidas e metas juntos; retorna o usuário para login.
- `PUT /api/v1/quiz/{id_usuario}`: confirma as respostas de uma conta autenticada.
- Ambos exigem `Idempotency-Key`; erros não deixam conta ou medidas parciais.

Os campos de `quiz` estão definidos em `app/schemas/quiz.py`. Os endpoints antigos
continuam disponíveis para compatibilidade.

## Banco existente e deploy

No diretório `backend`, com as variáveis de conexão do ambiente de destino:

```bash
python -m app.migrations.idempotencia
```

A migração cria a tabela de recibos e a restrição única de metas por
`(id_usuario, data_inicio)`. Pode ser executada novamente. Se já houver metas
duplicadas, ela interrompe a criação da restrição para revisão manual, sem apagar
dados. Não foi executada no TiDB de produção durante o desenvolvimento.
O comando recusa conexões SQLite, incluindo o fallback de desenvolvimento,
para impedir uma confirmação de migração no banco errado.

Publique o backend e aplique a migração antes de distribuir o app atualizado.
Novos bancos criados pelos modelos já recebem a restrição.

## Validação

```bash
python -m unittest discover -s tests -v
```

Os testes usam apenas bancos SQLite temporários. Cobrem replay, concorrência,
isolamento por usuário, rollback após escrita, quiz atômico, unicidade e migração.
O comportamento específico de locks do TiDB deve ser conferido no ambiente de
homologação antes da publicação.
