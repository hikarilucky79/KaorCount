import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback, Platform } from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { CORES } from '../constants/Cores';

export default function DropdownGenerico({ 
  valorSelecionado, 
  onChange, 
  opcoes = [], 
  placeholder = 'Selecione...' 
}) {
  const [visivel, setVisivel] = useState(false);

  const opcaoAtual = opcoes.find(opt => opt.id === valorSelecionado);

  const selecionar = (id) => {
    onChange(id);
    setVisivel(false);
  };

  return (
    <View style={styles.container}>
      {/* Caixa do Dropdown */}
      <TouchableOpacity 
        style={styles.caixaSelecao} 
        onPress={() => setVisivel(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.textoSelecao, !opcaoAtual && styles.placeholder]}>
          {opcaoAtual ? opcaoAtual.label : placeholder}
        </Text>
        {visivel ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
      </TouchableOpacity>

      {/* Modal com as opções */}
      <Modal visible={visivel} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisivel(false)}>
          <View style={styles.mascaraModal}>
            <View style={styles.menuOpcoes}>
              <FlatList
                data={opcoes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const ativo = item.id === valorSelecionado;
                  return (
                    <TouchableOpacity 
                      style={[styles.opcaoItem, ativo && styles.opcaoAtiva]}
                      onPress={() => selecionar(item.id)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.textoOpcao, ativo && styles.textoOpcaoAtiva]}>
                          {item.label}
                        </Text>
                        {ativo && <Check size={16} color={CORES.primaria} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  caixaSelecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  textoSelecao: {
    fontSize: 15,
    color: '#334155',
  },
  placeholder: {
    color: '#94a3b8',
  },
  mascaraModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  menuOpcoes: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
      },
    }),
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
