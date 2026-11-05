import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import useTheme from '../hooks/useTheme';
import { IconeOfensiva } from './OfensivaBadge';

export default function OfensivaCelebracao({ progresso, aoFechar }) {
  const { cores, isDark } = useTheme();
  const [dias, setDias] = useState(progresso?.anterior || 0);
  const escala = useRef(new Animated.Value(1)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;
  useEffect(() => {
    if (!progresso) return;
    let ativo = true;
    let troca;
    let fechamento;
    let animacao;
    setDias(progresso.anterior);
    escala.setValue(1);
    brilho.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduzir => {
      if (!ativo) return;
      if (reduzir) {
        setDias(progresso.atual);
      } else {
        troca = setTimeout(() => setDias(progresso.atual), 550);
        animacao = Animated.parallel([
          Animated.sequence([
            Animated.timing(escala, { toValue: 0.94, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(escala, { toValue: 1.08, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(escala, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(160),
            Animated.timing(brilho, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(brilho, { toValue: 0, duration: 480, useNativeDriver: true }),
          ]),
        ]);
        animacao.start();
      }
      fechamento = setTimeout(() => fecharRef.current(), reduzir ? 2200 : 3200);
    });
    return () => { ativo = false; clearTimeout(troca); clearTimeout(fechamento); animacao?.stop(); };
  }, [progresso, escala, brilho]);

  return <Modal visible={!!progresso} transparent animationType="none" onRequestClose={aoFechar} statusBarTranslucent>
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={aoFechar} accessibilityLabel="Fechar animação de ofensiva" />
      <View style={[styles.card, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
        <Text style={[styles.eyebrow, { color: cores.primaria }]}>OFENSIVA</Text>
        <Text style={[styles.titulo, { color: cores.textoEscuro }]}>Mais um dia para a sequência!</Text>
        <View style={styles.iconeArea}>
          <Animated.View pointerEvents="none" style={[styles.aura, { backgroundColor: isDark ? '#8B551F' : '#F7D9A7', opacity: brilho, transform: [{ scale: brilho.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }] }]} />
          <Animated.View style={{ transform: [{ scale: escala }] }}><IconeOfensiva dias={dias} tamanho={128} cor={cores.primaria} /></Animated.View>
        </View>
        <Text accessibilityLiveRegion="polite" style={[styles.numero, { color: cores.primaria }]}>{dias}</Text>
        <Text style={[styles.subtitulo, { color: cores.textoSuave }]}>{dias === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
        <Text style={[styles.mensagem, { color: cores.textoEscuro }]}>Seu primeiro alimento de hoje foi registrado.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Continuar" onPress={aoFechar} style={[styles.botao, { backgroundColor: cores.primaria }]}><Text style={styles.botaoTexto}>Continuar</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(28, 18, 10, 0.55)', padding:24 },
  card: { width:'100%', maxWidth:380, borderRadius:28, borderWidth:1, alignItems:'center', paddingHorizontal:24, paddingVertical:24 },
  eyebrow: { fontFamily:'PlusJakartaSansSemiBold', fontSize:12, letterSpacing:2, marginBottom:8 },
  titulo: { fontFamily:'PoppinsBlack', fontSize:20, lineHeight:27, textAlign:'center' },
  iconeArea: { width:160, height:160, alignItems:'center', justifyContent:'center', marginTop:10 },
  aura: { position:'absolute', width:110, height:110, borderRadius:55 },
  numero: { fontFamily:'PoppinsBlack', fontSize:46, lineHeight:56 },
  subtitulo: { fontFamily:'PlusJakartaSansSemiBold', fontSize:16 },
  mensagem: { fontFamily:'PlusJakartaSansSemiBold', fontSize:13, lineHeight:20, textAlign:'center', marginTop:14 },
  botao: { width:'100%', minHeight:46, borderRadius:14, alignItems:'center', justifyContent:'center', marginTop:20 },
  botaoTexto: { color:'#FFFFFF', fontFamily:'PlusJakartaSansSemiBold', fontSize:14 },
});
