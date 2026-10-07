import { spawn } from 'node:child_process';
import { normalizeTransactions, type Transaction } from './domain.ts';

function runPdftotext(input: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('pdftotext', ['-layout', '-', '-']);
    let stdout = ''; let stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `pdftotext exited with ${code}`)));
    child.stdin.end(input);
  });
}

function amountFromText(raw: string) {
  const normalized = raw.replace(/₦|NGN|,/gi, '').trim();
  const negative = /^\(.*\)$/.test(normalized) || normalized.startsWith('-') || /\bDR\b/i.test(normalized);
  const numeric = Number(normalized.replace(/[()]/g, '').replace(/\b(?:CR|DR)\b/ig, '').trim());
  if (!Number.isFinite(numeric)) throw new Error('Invalid amount in extracted statement');
  return negative ? -Math.abs(numeric) : Math.abs(numeric);
}

export async function extractPdfTransactions(input: Buffer): Promise<Transaction[]> {
  const text = await runPdftotext(input);
  const rows: Transaction[] = [];
  const date = '(?:\\d{4}-\\d{2}-\\d{2}|\\d{2}[/-]\\d{2}[/-]\\d{4})';
  const amount = '(?:₦|NGN)?\\(?-?[0-9][0-9,]*(?:\\.[0-9]{1,2})?\\)?(?:\\s+(?:CR|DR))?';
  const re = new RegExp(`^\\s*(${date})\\s+(.+?)\\s+(${amount})\\s*$`, 'i');
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const match = line.match(re); if (!match) continue;
    const [, rawDate, description, rawAmount] = match;
    const isoDate = /^\d{4}-/.test(rawDate) ? rawDate : rawDate.replace(/-/g, '/').split('/').reverse().join('-');
    const parsedDate = isoDate.replace(/\//g, '-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) continue;
    rows.push({ id: `pdf-${index + 1}`, date: parsedDate, description: description.trim(), amount: amountFromText(rawAmount) });
  }
  if (!rows.length) throw new Error('No transaction rows could be extracted from this PDF. Use a text-based statement with date, description and amount columns.');
  return normalizeTransactions(rows);
}
