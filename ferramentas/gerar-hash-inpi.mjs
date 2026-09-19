/**
 * Monta o arquivo de código-fonte que fica guardado para o registro de
 * programa de computador no INPI e calcula o resumo digital hash dele.
 *
 *   node ferramentas/gerar-hash-inpi.mjs
 *
 * O INPI não recebe o código: recebe apenas o resumo hash, que vai
 * impresso no certificado. Quem guarda o arquivo é o titular do direito.
 * Se um dia houver disputa, um perito recalcula o hash do arquivo
 * guardado e compara com o do certificado. Por isso o arquivo gerado
 * aqui não pode ser alterado nem regerado depois do depósito: um único
 * byte diferente muda o hash inteiro e a prova deixa de valer.
 *
 * O conteúdo sai do índice do git, não de uma varredura de diretório.
 * Isso importa por dois motivos: o .gitignore é respeitado, então .env,
 * .env.local e qualquer segredo ficam de fora por construção; e o
 * resultado é sempre o mesmo para o mesmo estado da árvore.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'registro-inpi');
const ZIP = path.join(SAIDA, 'ecoverse-codigo-fonte.zip');
const RELATORIO = path.join(SAIDA, 'resumo-hash.txt');
const ALGORITMO = 'sha512'; // o manual do INPI recomenda SHA-512

const git = (...args) =>
  execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

function arvoreDaCopiaDeTrabalho() {
  // Escreve um índice temporário para não mexer no índice real de quem
  // está trabalhando. O resultado é um objeto tree com exatamente os
  // arquivos que o git versionaria agora, inclusive os ainda não commitados.
  const indice = path.join(SAIDA, '.indice-temporario');
  try {
    execFileSync('git', ['add', '-A'], { cwd: RAIZ, env: { ...process.env, GIT_INDEX_FILE: indice } });
    return execFileSync('git', ['write-tree'], {
      cwd: RAIZ, encoding: 'utf8', env: { ...process.env, GIT_INDEX_FILE: indice },
    }).trim();
  } finally {
    fs.rmSync(indice, { force: true });
  }
}

function humano(bytes) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(0) + ' KB'
    : (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// Arte pesa muito mais que código: sprites e texturas respondem por quase
// todo o tamanho do pacote. Por padrão vai tudo, porque o objeto do
// registro é a obra inteira; --somente-codigo deixa de fora as mídias,
// para quando o pedido for a listagem do código e nada mais.
const MIDIA = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp3', 'wav', 'ogg',
  'mp4', 'webm', 'woff', 'woff2', 'ttf', 'otf', 'docx', 'pdf'];
const somenteCodigo = process.argv.includes('--somente-codigo');
const excluir = somenteCodigo ? MIDIA.map((e) => `:(exclude)*.${e}`) : [];

fs.mkdirSync(SAIDA, { recursive: true });

const commit = git('rev-parse', 'HEAD');
const dataCommit = git('show', '-s', '--format=%cI', 'HEAD');
const limpa = git('status', '--porcelain') === '';
const arvore = arvoreDaCopiaDeTrabalho();

// git archive gera o zip a partir do objeto tree, com carimbo de tempo
// fixo: o mesmo estado da árvore produz sempre os mesmos bytes.
fs.writeFileSync(ZIP, execFileSync(
  'git', ['archive', '--format=zip', '-9', arvore, ...(excluir.length ? ['--', ...excluir] : [])],
  { cwd: RAIZ, maxBuffer: 512 * 1024 * 1024 },
));

const bytes = fs.readFileSync(ZIP);
const resumo = crypto.createHash(ALGORITMO).update(bytes).digest('hex');

// O ls-tree não entende pathspec de exclusão, ao contrário do archive,
// então a lista vem inteira e o filtro é feito aqui, pela extensão.
const ehMidia = (f) => MIDIA.includes((f.split('.').pop() || '').toLowerCase());
const arquivos = git('ls-tree', '-r', '--name-only', arvore)
  .split('\n').filter(Boolean)
  .filter((f) => !somenteCodigo || !ehMidia(f));

// Confere que nenhum segredo entrou no pacote. O .env.example é modelo
// sem valores e vive no repositório público, então não conta.
const suspeitos = arquivos.filter((f) =>
  /(^|\/)\.env($|\.)|\.pem$|\.key$|id_rsa/.test(f) && !/\.example$/.test(f));

// Quanto do pacote é código e quanto é arte, para a escolha do escopo
// ser feita com número na mão e não no escuro.
const porTipo = new Map();
for (const f of arquivos) {
  const grupo = ehMidia(f) ? 'mídia e documentos' : 'código e texto';
  const tamanho = fs.existsSync(path.join(RAIZ, f)) ? fs.statSync(path.join(RAIZ, f)).size : 0;
  const atual = porTipo.get(grupo) || { arquivos: 0, bytes: 0 };
  porTipo.set(grupo, { arquivos: atual.arquivos + 1, bytes: atual.bytes + tamanho });
}

const relatorio = [
  'Registro de programa de computador - Ecoverse',
  '',
  'Algoritmo hash:     ' + ALGORITMO.toUpperCase(),
  'Resumo digital:     ' + resumo,
  '',
  'Arquivo guardado:   ' + path.basename(ZIP),
  'Tamanho:            ' + humano(bytes.length),
  'Escopo:             ' + (somenteCodigo
    ? 'somente código e texto, mídias excluídas'
    : 'árvore completa do repositório'),
  'Arquivos incluídos: ' + arquivos.length,
  ...[...porTipo.entries()].map(([grupo, v]) =>
    ('  ' + grupo + ':').padEnd(22) + v.arquivos + ' arquivos, ' + humano(v.bytes)),
  'Gerado em:          ' + new Date().toISOString(),
  '',
  'Commit de origem:   ' + commit,
  'Data do commit:     ' + dataCommit,
  'Árvore de origem:   ' + arvore,
  'Cópia de trabalho:  ' + (limpa
    ? 'limpa, o pacote corresponde exatamente ao commit acima'
    : 'COM ALTERAÇÕES NÃO COMMITADAS, o pacote inclui mudanças que não estão no commit'),
  '',
  'Segredos no pacote: ' + (suspeitos.length ? 'ATENÇÃO - ' + suspeitos.join(', ') : 'nenhum'),
  '',
  'O resumo acima é o que vai no formulário e-RPC do INPI e sai impresso',
  'no certificado. Ele não é sigiloso: é uma função de mão única, não',
  'revela nada sobre o conteúdo e não permite reconstruir o código.',
  '',
  'O que é sigiloso é o arquivo ' + path.basename(ZIP) + ', que deve ser',
  'guardado sem alteração enquanto o registro valer. Recalcular o hash',
  'dele deve devolver sempre o mesmo resumo:',
  '',
  '  certutil -hashfile ' + path.basename(ZIP) + ' SHA512',
  '',
].join('\n');

fs.writeFileSync(RELATORIO, relatorio, 'utf8');
console.log(relatorio);
console.log('gravado em ' + path.relative(RAIZ, SAIDA).replace(/\\/g, '/') + '/');
