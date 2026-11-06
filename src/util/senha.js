// Regras de senha do cadastro. Espelham backend/app/core/senha.py: o backend é
// quem decide, e estas regras só evitam uma ida à API por uma senha já fraca.
export const REQUISITOS_SENHA = [
  { id: 'tamanho', rotulo: 'Pelo menos 8 caracteres', atende: (s) => s.length >= 8 },
  { id: 'maiuscula', rotulo: 'Uma letra maiúscula', atende: (s) => /[A-Z]/.test(s) },
  { id: 'minuscula', rotulo: 'Uma letra minúscula', atende: (s) => /[a-z]/.test(s) },
  { id: 'numero', rotulo: 'Um número', atende: (s) => /\d/.test(s) },
  { id: 'simbolo', rotulo: 'Um símbolo (ex.: ! @ # $)', atende: (s) => /[^A-Za-z0-9]/.test(s) },
];

export const MENSAGEM_SENHA_FRACA =
  'A senha deve ter pelo menos 8 caracteres, com letra maiúscula, letra minúscula, número e símbolo.';

const SENHAS_COMUNS = new Set([
  '12345678', '123456789', '1234567890', '12341234', '11111111', '00000000',
  'senha123', 'senha1234', 'senha12345', 'password1', 'password12', 'password123',
  'qwerty123', 'qwertyui', 'qwertyuiop', 'abc12345', 'abcd1234', 'admin123',
  'admin1234', 'mudar123', 'brasil123', 'brasil2024', 'welcome1', 'welcome123',
  'letmein123', 'iloveyou1', 'kaorcount', 'kaorcount1', 'kaorcount123',
]);

const normalizar = (valor) => String(valor || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ↓ Devolve a mensagem do problema, ou null quando a senha é aceitável.
export function validarSenha(senha, { email = '', nome = '' } = {}) {
  if (!REQUISITOS_SENHA.every(({ atende }) => atende(senha))) return MENSAGEM_SENHA_FRACA;

  const simples = normalizar(senha);
  if (SENHAS_COMUNS.has(simples)) return 'Essa senha é muito comum. Escolha outra.';

  const parteLocal = normalizar(email.split('@')[0]);
  if (parteLocal.length >= 4 && simples.includes(parteLocal)) return 'A senha não pode conter o seu e-mail.';

  const usaNome = nome.trim().split(/\s+/).some((palavra) => {
    const parte = normalizar(palavra);
    return parte.length >= 4 && simples.includes(parte);
  });
  if (usaNome) return 'A senha não pode conter o seu nome.';
  return null;
}

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
