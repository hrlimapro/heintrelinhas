// Converte um texto livre em slug amigável para URL.
// Como funciona: normaliza em NFD para separar letras dos acentos, remove os
// diacríticos (faixa Unicode ̀-ͯ), passa para minúsculas, remove
// caracteres não alfanuméricos e converte espaços em hífens (sem hífens duplicados).
// Ex.: "Ciência & Tecnologia" -> "ciencia-tecnologia"
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
