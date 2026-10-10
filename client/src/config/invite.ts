/**
 * Dados do convite — fonte única para textos factuais.
 *
 * Informações ainda não definidas ficam como `null`: o site mostra
 * automaticamente "será informado em breve". Quando forem definidas,
 * basta preencher aqui e publicar de novo.
 */
export const INVITE = {
  groom: { first: 'Ademilson', last: 'Oliveira' },
  bride: { first: 'Regiane', last: 'Anjos' },
  date: {
    weekday: 'Sábado',
    day: '28',
    month: 'Novembro',
    year: '2026',
    long: '28 de novembro de 2026',
  },

  /** I — O casamento civil (o momento principal). */
  civil: {
    /** Horário de Brasília (UTC−3). Usado também pela contagem regressiva. */
    iso: '2026-11-28T15:00:00-03:00',
    time: '15h',
    venue: 'Cartório do 2º Ofício de Castanhal',
    /** Quebra editorial do nome do local. */
    venueLines: ['Cartório do 2º Ofício', 'de Castanhal'],
    mapsUrl: 'https://maps.app.goo.gl/QGuHDsKwDNSM1q9Q7',
  },

  /** II — Sessão de fotos. */
  photos: {
    venue: 'Jardins Sollaris Condomínio',
    mapsUrl: 'https://maps.app.goo.gl/APvL5EhSRhX9P4mq6',
    /** Ex.: '17h'. Enquanto null, mostra `timeFallback`. */
    time: null as string | null,
    timeFallback: 'Na sequência do casamento civil',
  },

  /** III — Encontro noturno no restaurante. */
  dinner: {
    /** Ex.: 'Restaurante Exemplo'. */
    venue: null as string | null,
    /** Ex.: 'Av. Exemplo, 123 — Castanhal'. */
    address: null as string | null,
    /** Ex.: '20h'. */
    time: null as string | null,
    /** Link do Google Maps do restaurante. */
    mapsUrl: null as string | null,
  },
};

export interface PhotoAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const STORAGE = 'https://nnkxrczzerkglnasucgi.supabase.co/storage/v1/object/public/Casamento';

export const PHOTOS = {
  main: {
    src: `${STORAGE}/casal2.jpeg`,
    width: 720,
    height: 1280,
    alt: 'Regiane e Ademilson sentados na grama, sorrindo ao entardecer',
  },
  rings: {
    src: `${STORAGE}/mao.jpeg`,
    width: 960,
    height: 1280,
    alt: 'Mãos dos noivos entrelaçadas, com o anel de noivado em destaque',
  },
  mirror: {
    src: `${STORAGE}/porta.jpeg`,
    width: 769,
    height: 1381,
    alt: 'Reflexo de Regiane e Ademilson em um espelho',
  },
  close: {
    src: `${STORAGE}/casal1.jpeg`,
    width: 960,
    height: 1280,
    alt: 'Regiane e Ademilson lado a lado, sorrindo',
  },
} satisfies Record<string, PhotoAsset>;
