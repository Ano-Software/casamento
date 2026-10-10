/** Dados do convite — fonte única para textos factuais. */
export const INVITE = {
  groom: { first: 'Ademilson', last: 'Oliveira' },
  bride: { first: 'Regiane', last: 'Anjos' },
  ceremony: {
    /** Horário de Brasília (UTC−3, sem horário de verão desde 2019). */
    iso: '2026-11-28T16:30:00-03:00',
    weekday: 'Sábado',
    day: '28',
    month: 'Novembro',
    year: '2026',
    dateLong: '28 de novembro de 2026',
    time: '16h30',
    venue: 'Cartório do 2º Ofício de Castanhal',
    /** Quebra editorial do nome do local. */
    venueLines: ['Cartório do 2º Ofício', 'de Castanhal'],
    mapsUrl: 'https://maps.app.goo.gl/QGuHDsKwDNSM1q9Q7',
  },
} as const;

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
