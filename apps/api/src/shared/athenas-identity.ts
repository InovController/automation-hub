const ATHENAS_SUFFIX_TO_DEPARTMENTS: Record<string, string[]> = {
  DEFIS: ['fiscal'],
  DECON: ['contabil'],
  DEPES: ['pessoal'],
  DEAUD: ['auditoria'],
  DERH: ['rh'],
  RH: ['rh'],
  INOV: ['inovacao'],
  DELEG: ['legalizacao'],
  DETEC: ['tecnologia'],
  SUPORTE: ['tecnologia'],
};

export function departmentsForAthenasLogin(login: string) {
  const normalized = login.trim().toUpperCase();
  const suffix = normalized.split('.').pop() ?? '';
  return ATHENAS_SUFFIX_TO_DEPARTMENTS[suffix] ?? [];
}

export function formatAthenasPersonName(name: string) {
  const lowercaseParticles = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
  return name
    .trim()
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && lowercaseParticles.has(word)
        ? word
        : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1),
    )
    .join(' ');
}
