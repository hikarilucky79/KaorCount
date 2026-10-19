import { randomUUID } from 'expo-crypto';

export const novaChaveIdempotente = () => randomUUID();

export const configIdempotente = (chave) => ({
  headers: { 'Idempotency-Key': chave },
});

// Uma nova ação ganha outra chave; tentar novamente a mesma ação reutiliza a anterior.
export const chaveDaOperacao = (referencia, dados) => {
  const assinatura = JSON.stringify(dados);
  if (referencia.current?.assinatura !== assinatura) {
    referencia.current = { assinatura, chave: novaChaveIdempotente() };
  }
  return referencia.current.chave;
};
