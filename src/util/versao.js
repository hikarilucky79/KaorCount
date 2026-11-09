// Comparação de versões numéricas pontuadas ("1.2.10"). Sem dependências para
// poder rodar nos testes do Node.

// [F567] Divide a versão em componentes numéricos para comparação.
const partes = (versao) => {
  const texto = String(versao ?? '').trim().replace(/^v/i, '');
  if (!/^\d+(\.\d+)*$/.test(texto)) return null;
  return texto.split('.').map(Number);
};

// [F568] Compara duas versões semânticas do aplicativo.
// ↓ Devolve -1, 0 ou 1. Versão ilegível devolve null: quem chama decide ignorar,
//   para um valor mal configurado no servidor nunca travar o app de ninguém.
export function compararVersoes(a, b) {
  const pa = partes(a);
  const pb = partes(b);
  if (!pa || !pb) return null;
  const tamanho = Math.max(pa.length, pb.length);
  for (let i = 0; i < tamanho; i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

// [F569] Determina se a versão instalada deve ou precisa ser atualizada.
// ↓ Decide o que fazer com a versão instalada diante da resposta do servidor.
//   Retorna null quando o app está em dia (ou quando não dá para saber).
export function avaliarAtualizacao(instalada, { versao_atual, versao_minima, url_download } = {}) {
  if (compararVersoes(instalada, versao_atual) !== -1) return null;
  return {
    versaoAtual: versao_atual,
    obrigatoria: compararVersoes(instalada, versao_minima) === -1,
    url: url_download || '',
  };
}

// [F570] Resolve o endereço de download usando a URL base da API.
// ↓ A URL de download pode vir relativa ("/downloads/app.apk"): nesse caso é
//   resolvida contra a origem da API (baseURL sem o prefixo "/api/v1").
export function resolverUrl(url, baseApi) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const origem = String(baseApi || '').replace(/\/api\/v\d+\/?$/i, '').replace(/\/+$/, '');
  return origem ? `${origem}${url.startsWith('/') ? '' : '/'}${url}` : '';
}
