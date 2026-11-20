/**
 * /realidade — desenho impresso que ganha vida pela câmera do celular.
 *
 * Os arquivos ficam em client/public/ar/ (veja o LEIA-ME.txt daquela pasta).
 */
export const REALIDADE = {
  /**
   * Arquivo gerado pelo compilador do MindAR a partir do(s) desenho(s).
   * Pode conter vários desenhos: cada um toca o vídeo de mesma posição em `videos`.
   */
  target: '/ar/alvo.mind',

  videos: [
    {
      src: '/ar/video.mp4',
      /**
       * Cor do fundo a remover (ex.: '#00ff00' para fundo verde) — os noivos aparecem
       * "recortados" sobre o desenho. `null` mostra o vídeo inteiro, como um quadro.
       */
      chromaKey: '#71c822' as string | null, // verde medido no fundo do vídeo
      /**
       * Largura do vídeo em relação à largura da imagem compilada (1 = mesma largura).
       * O alvo é o banner horizontal (2098 x 749, altura = 0.357 da largura); com o
       * vídeo 9:16, 0.7 deixa o vídeo ~3,5x a altura do banner. O motor reduz o vídeo
       * automaticamente se ele passar da tela do celular.
       */
      scale: 0.7,
      /** Deslocamento do centro do vídeo, em larguras da imagem (x: direita, y: para cima). Centro do banner. */
      offset: { x: 0, y: 0 },
    },
  ],
};

export type RealidadeVideo = (typeof REALIDADE.videos)[number];
