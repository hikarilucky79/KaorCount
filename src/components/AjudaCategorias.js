import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import useTheme from '../hooks/useTheme';
import { Card, Texto } from './RotinaUI';
export const CATEGORIAS_AJUDA = [
  { id:'diario', titulo:'Diário e alimentos', perguntas:[
    ['Como registro uma refeição?', 'Na aba Diário, toque no botão de adicionar da refeição, busque um alimento, informe a quantidade e confirme.'],
    ['Posso cadastrar um alimento?', 'Sim. Ao adicionar um alimento, escolha Criar alimento e informe a porção e os valores nutricionais.'],
    ['Como copio uma refeição?', 'No Diário, escolha uma data e toque em Copiar de ontem no cartão da refeição vazia. Revise o resultado antes de adicionar outros itens.'],
  ]},
  { id:'agua', titulo:'Água e lembretes', perguntas:[
    ['Como registro água?', 'Na aba Diário, use os botões de quantidade no cartão Hidratação.'],
    ['Como altero a meta de água?', 'Em Configurações, abra Lembretes, informe a meta diária e toque em Salvar água.'],
    ['Os lembretes enviam notificações?', 'As preferências são salvas na conta. O aplicativo ainda não agenda notificações automaticamente.'],
  ]},
  { id:'metas', titulo:'Metas e progresso', perguntas:[
    ['Como altero meu objetivo?', 'Em Configurações, abra Meus objetivos e escolha seu objetivo e nível de atividade.'],
    ['Onde vejo meu peso?', 'Na aba Perfil, consulte Evolução de peso. Ao editar o perfil e salvar uma nova medida, ela aparece no histórico.'],
    ['O que é a Ofensiva?', 'É a sequência de dias em que você registrou refeições. O símbolo muda conforme você alcança novos marcos.'],
    ['Qual período aparece no histórico de calorias?', 'O histórico da tela inicial mostra os últimos 7 dias.'],
  ]},
  { id:'sugestoes', titulo:'Sugestões de refeições', perguntas:[
    ['Como recebo sugestões?', 'Na tela inicial, toque em Gerar sugestões para minha meta. É necessário ter uma meta nutricional cadastrada.'],
    ['O que acontece ao aceitar?', 'Os alimentos disponíveis da sugestão são registrados no Diário. Confira as quantidades após aceitar.'],
    ['Por que preciso aguardar para gerar novamente?', 'Para manter o serviço disponível, há um limite temporário de solicitações. Aguarde um pouco antes de tentar novamente.'],
  ]},
  { id:'conta', titulo:'Conta e privacidade', perguntas:[
    ['Como exporto meu relatório?', 'Em Configurações, abra Relatório nutricional, escolha o período e toque em Baixar PDF.'],
    ['Quais dados o JSON contém?', 'Em Conta, a exportação reúne os dados nutricionais do relatório desde 01/01/2025. Ela não inclui todos os dados da conta.'],
    ['Como desativo minha conta?', 'Em Configurações, abra Conta e escolha Desativar minha conta. A desativação encerra seu acesso e não exclui os dados.'],
  ]},
];
// [F387] Monta a interface de ajuda organizada por categorias.
export default function AjudaCategorias({ navigation, categoria }) {
  const { cores } = useTheme();
  const atual = CATEGORIAS_AJUDA.find(c => c.id === categoria);
  if (categoria && !atual) return <Texto>Categoria não encontrada.</Texto>;
  if (atual) return <View>{atual.perguntas.map(([pergunta,resposta]) => <Card key={pergunta} titulo={pergunta}><Texto style={{color:cores.textoSuave}}>{resposta}</Texto></Card>)}</View>;
  return <View><Texto style={{ marginBottom: 16 }}>Escolha uma categoria para encontrar respostas.</Texto><View style={{ backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>{CATEGORIAS_AJUDA.map((c, i) => <TouchableOpacity key={c.id} accessibilityRole="button" accessibilityHint="Abre esta categoria" onPress={() => navigation.push('ConfiguracaoAjudaCategoria', { secao:'ajuda_categoria', categoria:c.id })} style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i < CATEGORIAS_AJUDA.length - 1 ? 1 : 0, borderBottomColor: cores.borda }}><Texto style={{ marginBottom: 0, flex: 1 }}>{c.titulo}</Texto><ChevronRight size={19} color={cores.textoSuave} /></TouchableOpacity>)}</View></View>;
}
