// ───────────────────────────────────────────────────────────────
// src/components/LoadingIndicator.js
// Componente reutilizável de carregamento com o tema do app.
// ───────────────────────────────────────────────────────────────
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { CORES } from '../constants/Cores';

export default function LoadingIndicator({ mensagem = 'Carregando...', tamanho = 'large' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={tamanho} color={CORES.primaria} />
      {mensagem && <Text style={styles.texto}>{mensagem}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CORES.fundo,
    padding: 20,
  },
  texto: {
    marginTop: 12,
    fontSize: 14,
    color: CORES.textoSuave,
    fontWeight: '500',
  },
});
