// D8: cada licença e fonte presente nos GLB publicados deve ser reconhecida e nomeada na página de
// proveniência oficial. Falha fechada: licença/fonte desconhecida é uma lacuna, nunca é ignorada.
// Isto prova só cobertura de atribuição (metadados ↔ página). NÃO verifica a validade jurídica da licença.

export interface ChaveAtribuicao { chave: string; aliases: readonly string[] }

// Cada entrada reconhece uma família de strings `panacea_license` / `panacea_source`.
export const LICENCAS_CONHECIDAS: readonly ChaveAtribuicao[] = [
  { chave: 'CC BY-SA 4.0', aliases: ['CC BY-SA 4.0'] },
  { chave: 'CC BY 4.0', aliases: ['CC BY 4.0'] },
  { chave: 'CC0 1.0', aliases: ['CC0 1.0'] },
  // Estas duas aparecem nos GLB junto a outra classe na mesma string ("CC BY-SA 2.1 JP (OBJ header); CC BY 4.0",
  // "Apache-2.0; combined atlas layer CC BY-SA 4.0"); sem entrada própria a página poderia omiti-las sem que nada falhasse.
  { chave: 'CC BY-SA 2.1', aliases: ['CC BY-SA 2.1'] },
  { chave: 'Apache-2.0', aliases: ['Apache-2.0'] },
  { chave: 'ICRP Publication 156', aliases: ['ICRP Publication 156'] },
  { chave: 'ICRP Publication 145', aliases: ['ICRP Publication 145'] },
]

export const FONTES_CONHECIDAS: readonly ChaveAtribuicao[] = [
  { chave: 'Z-Anatomy', aliases: ['Z-Anatomy', 'zanatomy'] },
  { chave: 'ICRP Publication 156', aliases: ['ICRP Publication 156'] },
  { chave: 'ICRP Publication 145', aliases: ['ICRP Publication 145'] },
  // HRA (Human Reference Atlas) é o atlas do HuBMAP; a página oficial o nomeia como HuBMAP.
  { chave: 'HuBMAP / Human Reference Atlas', aliases: ['Human Reference Atlas', 'HuBMAP'] },
  { chave: 'BodyParts3D', aliases: ['BodyParts3D'] },
  { chave: 'SVRTK fetal MRI atlas', aliases: ['SVRTK', 'King\'s College London'] },
  { chave: 'University of Denver', aliases: ['Denver'] },
  { chave: 'TotalSegmentator', aliases: ['TotalSegmentator'] },
  { chave: 'Allen Human Brain', aliases: ['Allen Human Brain'] },
  { chave: 'Clinical Neuroanatomy Atlas', aliases: ['Clinical Neuroanatomy'] },
  { chave: 'Andreassen', aliases: ['Andreassen'] },
]

export interface LacunaAtribuicao { tipo: 'licenca' | 'fonte'; valor: string; motivo: 'desconhecida' | 'ausente-na-pagina' }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')

function reconhece(valor: string, tabela: readonly ChaveAtribuicao[]): ChaveAtribuicao[] {
  const v = norm(valor)
  return tabela.filter((c) => c.aliases.some((a) => v.includes(norm(a))))
}

/** `licencas`/`fontes`: valores distintos lidos dos GLB. `pagina`: texto da página oficial de proveniência. */
export function lacunasDeAtribuicao(licencas: readonly string[], fontes: readonly string[], pagina: string): LacunaAtribuicao[] {
  const texto = norm(typeof pagina === 'string' ? pagina : '')
  const lacunas: LacunaAtribuicao[] = []
  const confere = (tipo: LacunaAtribuicao['tipo'], valores: readonly string[], tabela: readonly ChaveAtribuicao[]) => {
    for (const valor of valores) {
      const achadas = reconhece(valor, tabela)
      if (achadas.length === 0) { lacunas.push({ tipo, valor, motivo: 'desconhecida' }); continue }
      for (const c of achadas) {
        if (!c.aliases.some((a) => texto.includes(norm(a)))) lacunas.push({ tipo, valor: c.chave, motivo: 'ausente-na-pagina' })
      }
    }
  }
  confere('licenca', licencas, LICENCAS_CONHECIDAS)
  confere('fonte', fontes, FONTES_CONHECIDAS)
  // sem duplicatas
  return lacunas.filter((l, i) => lacunas.findIndex((x) => x.tipo === l.tipo && x.valor === l.valor && x.motivo === l.motivo) === i)
}
