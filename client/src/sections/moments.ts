import { INVITE } from '../config/invite';

/** Os três capítulos do dia — usados no sumário e como âncoras das cenas. */
export const MOMENTS = [
  { id: 'o-sim', index: 'I', title: 'O sim', when: INVITE.civil.time },
  { id: 'memorias', index: 'II', title: 'Memórias para sempre', when: INVITE.photos.time ?? 'Em seguida' },
  { id: 'celebracao', index: 'III', title: 'Uma noite para celebrar', when: INVITE.dinner.time ?? 'À noite' },
] as const;
