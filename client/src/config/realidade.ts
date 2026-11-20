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
      chromaKey: null as string | null,
      /**
       * Largura do vídeo em relação à largura da imagem compilada (1 = mesma largura).
       * O alvo é o banner horizontal (2098 x 749, altura = 0.357 da largura); com o
       * vídeo 9:16, 0.2 deixa o vídeo com a altura do banner.
       */
      scale: 0.2,
      /** Deslocamento do centro do vídeo, em larguras da imagem (x: direita, y: para cima). Fica sobre a foto do casal. */
      offset: { x: -0.29, y: 0 },
    },
  ],
};

export type RealidadeVideo = (typeof REALIDADE.videos)[number];
