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
       * O alvo é o cartão inteiro (1480 x 2100); 0.392 deixa o vídeo vertical com a
       * altura da moldura dourada do desenho (1060 px).
       */
      scale: 0.392,
      /** Deslocamento do centro do vídeo, em larguras da imagem (x: direita, y: para cima). */
      offset: { x: 0, y: 0.0155 },
    },
  ],
};

export type RealidadeVideo = (typeof REALIDADE.videos)[number];
