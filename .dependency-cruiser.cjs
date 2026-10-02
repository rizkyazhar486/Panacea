// Aturan layer Clean Architecture (lihat CLAUDE.md §2). Pelanggaran lama ada di baseline; CI hanya menolak yang BARU.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'lib-tidak-impor-ui', severity: 'error', comment: 'Logika domain (lib/domains) tidak boleh bergantung pada UI.',
      from: { path: '^src/(lib|domains)/' }, to: { path: '^src/(components|pages)/' } },
    { name: 'komponen-tidak-impor-pages', severity: 'error', comment: 'Komponen tidak boleh mengimpor pages.',
      from: { path: '^src/components/' }, to: { path: '^src/pages/' } },
    { name: 'data-tidak-impor-ui-logika', severity: 'error', comment: 'src/data hanya konstanta/korpus.',
      from: { path: '^src/data/' }, to: { path: '^src/(components|pages)/' } },
    { name: 'server-tidak-impor-frontend', severity: 'error', comment: 'Server tidak boleh mengimpor src/.',
      from: { path: '^server/src/' }, to: { path: '^src/' } },
    { name: 'domain-lewat-index', severity: 'error', comment: 'Antar-domain hanya lewat index.ts.',
      from: { path: '^src/domains/([^/]+)/' },
      to: { path: '^src/domains/([^/]+)/(?!index\\.ts)', pathNot: '^src/domains/$1/' } },
    { name: 'tanpa-sirkular', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: { tsConfig: { fileName: 'tsconfig.json' }, doNotFollow: { path: 'node_modules' }, exclude: { path: '\\.(test|uji)\\.' } },
};
