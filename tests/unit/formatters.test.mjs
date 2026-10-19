import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper logic extracted from index.html for testing
export function formatCPF(rawValue) {
  let v = String(rawValue || '').replace(/\D/g, '').substring(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  if (v.length > 3) return v.replace(/(\d{3})(\d+)/, '$1.$2');
  return v;
}

export function formatCurrencyFromDigits(digits) {
  const clean = String(digits || '').replace(/\D/g, '');
  if (clean.length === 0) return 'R$ 0,00';
  const val = (parseInt(clean, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return `R$ ${val}`;
}

export function calcCotaPercent(financiamento, avaliacao) {
  if (!avaliacao || avaliacao <= 0) return 0;
  return Number(((financiamento / avaliacao) * 100).toFixed(2));
}

test('CPF formatting transforms digits into valid mask', () => {
  assert.equal(formatCPF('12345678901'), '123.456.789-01');
  assert.equal(formatCPF('123456789'), '123.456.789');
  assert.equal(formatCPF('123456'), '123.456');
  assert.equal(formatCPF('123'), '123');
  assert.equal(formatCPF(''), '');
});

test('Currency formatting converts numeric digit strings to BRL format', () => {
  assert.equal(formatCurrencyFromDigits('100000'), 'R$ 1.000,00');
  assert.equal(formatCurrencyFromDigits('373562'), 'R$ 3.735,62');
  assert.equal(formatCurrencyFromDigits('0'), 'R$ 0,00');
  assert.equal(formatCurrencyFromDigits(''), 'R$ 0,00');
});

test('Cota calculation computes expected loan-to-value percentage', () => {
  assert.equal(calcCotaPercent(160000, 200000), 80);
  assert.equal(calcCotaPercent(240000, 300000), 80);
  assert.equal(calcCotaPercent(0, 200000), 0);
  assert.equal(calcCotaPercent(100000, 0), 0);
});

test('HTML Accessibility check: all img tags in index.html must include alt attribute', () => {
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const imgMatches = html.match(/<img[^>]+>/gi) || [];
  assert.ok(imgMatches.length > 0, 'index.html should have img elements');

  for (const img of imgMatches) {
    assert.match(img, /alt=["'][^"']*["']/i, `Found img without alt attribute: ${img}`);
  }
});
