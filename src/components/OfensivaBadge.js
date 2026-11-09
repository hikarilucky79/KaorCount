import React from 'react';
import { View } from 'react-native';
import { Flame } from 'lucide-react-native';
import useTheme from '../hooks/useTheme';
import { marcoOfensiva } from '../util/rotina';
import { Texto } from './RotinaUI';
import Fogo3 from '../../assets/fogo_3dias.svg';
import Fogo5 from '../../assets/fogo_5dias.svg';
import Fogo10 from '../../assets/fogo_10dias.svg';
import Fogo20 from '../../assets/fogo_20dias.svg';
import Fogo30 from '../../assets/fogo_30dias.svg';
import Fogo50 from '../../assets/fogo_50dias.svg';
import Fogo70 from '../../assets/fogo_70dias.svg';
import Fogo100 from '../../assets/fogo_100dias.svg';
import Fogo200 from '../../assets/fogo_200dias.svg';
const artes = { 3: Fogo3, 5: Fogo5, 10: Fogo10, 20: Fogo20, 30: Fogo30, 50: Fogo50, 70: Fogo70, 100: Fogo100, 200: Fogo200 };
// [F403] Renderiza o ícone correspondente à sequência de dias do usuário.
export function IconeOfensiva({ dias = 0, tamanho = 46, cor }) {
  const Arte = artes[marcoOfensiva(dias)];
  return Arte ? <Arte width={tamanho * 0.78} height={tamanho} accessible={false} /> : <Flame size={tamanho * 0.6} color={cor} />;
}
// [F404] Exibe o emblema e o marco atual da sequência de dias do usuário.
export default function OfensivaBadge({ dias = 0 }) {
  const { cores, isDark } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', backgroundColor: isDark ? cores.mutado : cores.branco, borderWidth: 1, borderColor: cores.borda, marginTop: 8, marginBottom: 12 }}>
    <IconeOfensiva dias={dias} cor={cores.primaria} />
    <Texto style={{ marginBottom: 0 }}>{dias > 0 ? `${dias} ${dias === 1 ? 'dia seguido' : 'dias seguidos'}` : 'Registre uma refeição e comece sua sequência'}</Texto>
  </View>;
}
