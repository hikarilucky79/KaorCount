import { randomUUID } from 'expo-crypto';

// [F335] Gera uma chave única para identificar uma operação idempotente.
export const novaChaveIdempotente = () => randomUUID();

// [F336] Monta os cabeçalhos HTTP com a chave de idempotência.
export const configIdempotente = (chave) => ({
  headers: { 'Idempotency-Key': chave },
});

// [F337] Obtém ou cria a chave que identifica uma operação específica.
// Uma nova ação ganha outra chave; tentar novamente a mesma ação reutiliza a anterior.
export const chaveDaOperacao = (referencia, dados) => {
  const assinatura = JSON.stringify(dados);
  if (referencia.current?.assinatura !== assinatura) {
    referencia.current = { assinatura, chave: novaChaveIdempotente() };
  }
  return referencia.current.chave;
};
