import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
// [F413] Renderiza texto com os estilos e cores do tema atual.
export function Texto({ children, titulo = false, erro = false, ...props }) {
  const { cores } = useTheme();
  const { rf } = useResponsive();
  return <Text {...props} style={[{ color: erro ? cores.erro : cores.textoEscuro, fontFamily: titulo ? 'PoppinsBlack' : 'PlusJakartaSansSemiBold', fontSize: rf(titulo ? 14 : 13, 11, 17), marginBottom: 8 }, props.style]}>{children}</Text>;
}
// [F414] Renderiza um contêiner visual padronizado para agrupar conteúdo.
export function Card({ titulo, children }) {
  const { cores } = useTheme();
  return <View style={{ backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1, borderRadius: 24, padding: 16, marginBottom: 16 }}>{titulo ? <Texto titulo>{titulo}</Texto> : null}{children}</View>;
}
// [F415] Renderiza um botão padronizado com estados de interação.
export function Botao({ children, onPress, ocupado = false, disabled = false, selecionado = false, configuracao = false, style, textoStyle }) {
  const { cores } = useTheme();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: disabled || ocupado, busy: ocupado, selected: selecionado }} onPress={onPress} disabled={disabled || ocupado} style={[{ padding: 12, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: selecionado ? cores.primaria : cores.borda, backgroundColor: configuracao && !selecionado ? cores.fundoInput : cores.mutado, marginBottom: 8, opacity: disabled || ocupado ? 0.6 : 1 }, style]}>{ocupado ? <ActivityIndicator color={cores.primaria} /> : <Texto style={[{ marginBottom: 0, color: configuracao && !selecionado ? cores.textoEscuro : cores.primaria }, textoStyle]}>{children}</Texto>}</TouchableOpacity>;
}
// [F416] Renderiza um campo de formulário com estilo consistente.
export function Campo({ label, ...props }) {
  const { cores } = useTheme();
  return <View style={{ marginBottom: 12 }}><Texto>{label}</Texto><TextInput {...props} accessibilityLabel={label} placeholderTextColor={cores.textoSuave} style={{ color: cores.textoEscuro, fontFamily: 'PlusJakartaSansSemiBold', backgroundColor: cores.fundoInput, borderColor: cores.borda, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 44 }} /></View>;
}
