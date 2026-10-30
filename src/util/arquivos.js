import { Platform } from 'react-native';

export async function salvarArquivo(conteudo, nome, mimeType) {
  if (Platform.OS === 'web') {
    const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return;
  }
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) throw new Error('O compartilhamento de arquivos não está disponível neste aparelho.');
  const file = new File(Paths.cache, nome);
  try {
    file.create({ overwrite: true });
    file.write(typeof conteudo === 'string' ? conteudo : new Uint8Array(conteudo));
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Salvar relatório KaorCount', UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.json' });
  } finally {
    if (file.exists) file.delete();
  }
}
