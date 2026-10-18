import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LogOut } from 'lucide-react-native';

const COR_ACAO_DESTRUTIVA = '#A42320';

export default function ConfirmacaoAcaoModal({
  visivel,
  cores,
  ocupado = false,
  titulo = 'Sair da conta?',
  mensagem = 'Você poderá entrar novamente quando quiser.',
  rotuloConfirmar = 'Sair',
  rotuloCancelar = 'Cancelar',
  labelAcessibilidadeConfirmar = 'Sair da conta',
  labelAcessibilidadeCancelar = 'Cancelar saída da conta',
  IconeAcao = LogOut,
  aoConfirmar,
  aoCancelar,
}) {
  const cancelar = () => {
    if (!ocupado) aoCancelar();
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={cancelar}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cancelar}
          disabled={ocupado}
          accessible={false}
          focusable={false}
        />
        <View
          style={[
            styles.dialogo,
            Platform.select({
              web: { boxShadow: '0px 12px 32px rgba(0,0,0,0.22)' },
              default: {
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 16,
              },
            }),
            { backgroundColor: cores.branco, borderColor: cores.borda },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.iconeFundo, { backgroundColor: cores.erro }]}>
            <IconeAcao size={23} color={cores.branco} strokeWidth={2.2} />
          </View>
          <Text style={[styles.titulo, { color: cores.textoEscuro }]}>{titulo}</Text>
          <Text style={[styles.mensagem, { color: cores.textoSuave }]}>{mensagem}</Text>

          <View style={styles.acoes}>
            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelar, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}
              onPress={cancelar}
              disabled={ocupado}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={labelAcessibilidadeCancelar}
            >
              <Text style={[styles.textoBotao, { color: cores.textoEscuro }]}>{rotuloCancelar}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, styles.botaoSair, { backgroundColor: COR_ACAO_DESTRUTIVA, borderColor: COR_ACAO_DESTRUTIVA, opacity: ocupado ? 0.75 : 1 }]}
              onPress={aoConfirmar}
              disabled={ocupado}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={labelAcessibilidadeConfirmar}
              accessibilityState={{ disabled: ocupado, busy: ocupado }}
            >
              {ocupado ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconeAcao size={17} color="#FFFFFF" />
                  <Text style={[styles.textoBotao, { color: '#FFFFFF' }]}>{rotuloConfirmar}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogo: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
  },
  iconeFundo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  titulo: { fontSize: 20, lineHeight: 26, fontWeight: '800', textAlign: 'center' },
  mensagem: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 24 },
  botao: {
    minHeight: 48,
    flexGrow: 1,
    flexBasis: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  botaoCancelar: {},
  botaoSair: {},
  textoBotao: { fontSize: 14, fontWeight: '700' },
});
