import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { CORES } from '../src/constants/Cores'; // ← Verifique se o caminho da importação está correto

export default function DropdownGenerico({ 
  valorSelecionado, 
  onChange, 
  opcoes = [], // ← Recebe as opções dinamicamente
  placeholder = 'Selecione...' // ← Texto padrão personalizável
}) {
  const [visivel, setVisivel] = useState(false);

  // ↓ Agora ele busca o texto dentro da lista que você passar como propriedade
  const opcaoAtual = opcoes.find(opt => opt.id === valorSelecionado);

  const selecionar = (id) => {
    onChange(id);
    setVisivel(false);
  };

  return (
    <View style={styles.container}>
      {/* Caixa do Dropdown */}
      <TouchableOpacity 
        style={styles.dropdownBotao} 
        onPress={() => setVisivel(!visivel)}
        activeOpacity={0.7}
      >
        <Text style={opcaoAtual ? styles.textoSelecionado : styles.textoPlaceholder}>
          {opcaoAtual ? opcaoAtual.label : placeholder}
        </Text>
        <Text style={styles.seta}>{visivel ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Lista Suspensa Modal */}
      <Modal visible={visivel} transparent animationType="fade" onRequestClose={() => setVisivel(false)}>
        <TouchableWithoutFeedback onPress={() => setVisivel(false)}>
          <View style={styles.fundoModal}>
            <View style={styles.menuOpcoes}>
              <FlatList
                data={opcoes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.opcaoItem, valorSelecionado === item.id && styles.opcaoAtiva]} 
                    onPress={() => selecionar(item.id)}
                  >
                    <Text style={[styles.textoOpcao, valorSelecionado === item.id && styles.textoOpcaoAtiva]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ... manter o bloco StyleSheet idêntico ao seu original
const styles = StyleSheet.create({
  container: {
    flex: 1, // ← Faz o contêiner se expandir igual ao TextInput original.
    justifyContent: 'center',
  },
  dropdownBotao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10, // ← Apenas espaçamento lateral
    height: '100%', // ← Faz o botão preencher exatamente a altura da caixa pai.
    // ↓ Removemos os backgrounds, bordas, margins e height fixo que causavam o corte!
  },
  textoSelecionado: { color: CORES.textoEscuro, fontSize: 15 },
  textoPlaceholder: { color: '#9C8E81', fontSize: 15 },
  seta: { color: '#64748b', fontSize: 12 },
  
  // ↓ O estilo do Modal permanece o mesmo:
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuOpcoes: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  opcaoItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  opcaoAtiva: {
    backgroundColor: '#f1f5f9',
  },
  textoOpcao: {
    fontSize: 15,
    color: '#334155',
  },
  textoOpcaoAtiva: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
});