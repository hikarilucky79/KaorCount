import { useCallback, useEffect, useRef, useState } from 'react';
// [F438] Executa uma tarefa assíncrona e disponibiliza estado de carregamento e erro.
// Uma operação por card; respostas de telas desmontadas não atualizam a interface.
export default function useTarefa() {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const trava = useRef(false);
  const montado = useRef(false);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const executar = useCallback(async acao => {
    if (trava.current || !montado.current) return;
    trava.current = true;
    setOcupado(true);
    setErro('');
    try { await acao(() => montado.current); }
    catch (e) { if (montado.current) {
      const status = e.response?.status;
      const segundos = Number(e.response?.headers?.['retry-after']);
      setErro(status === 429 ? (segundos > 0 ? `Muitas tentativas. Aguarde cerca de ${Math.ceil(segundos / 60)} minuto(s) antes de tentar novamente.` : 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.') : status === 404 ? 'Não há dados disponíveis para esta ação.' : e.response ? 'Não foi possível concluir. Confira os dados e tente novamente.' : e.message || 'Não foi possível concluir. Tente novamente.');
    } }
    finally { trava.current = false; if (montado.current) setOcupado(false); }
  }, []);
  return { ocupado, erro, executar };
}
