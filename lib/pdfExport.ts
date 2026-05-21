import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Peak } from './types';
import type { AscentRow } from './queries/useAscents';

export type PdfEntry = {
  peak: Peak;
  ascent: AscentRow;
  serialNumber: string;
};

export type PdfExportInput = {
  userLabel: string;
  totalTarget: number;
  entries: PdfEntry[];
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function buildHtml(input: PdfExportInput): string {
  const today = new Date();
  const year = today.getFullYear();
  const totalCollected = input.entries.length;

  const coverPage = `
    <section class="page cover">
      <div class="cover-frame">
        <p class="meta">VOL. I · ${year}</p>
        <h1 class="brand">Trove Peaks</h1>
        <p class="brand-sub">트로브 봉우리</p>
        <div class="cover-divider"></div>
        <p class="owner">${escapeHtml(input.userLabel)}님의 도감</p>
        <p class="stats">${totalCollected} / ${input.totalTarget} 봉우리</p>
      </div>
      <div class="cover-footer">
        <p>A page from your trove · 한 페이지씩, 천천히.</p>
      </div>
    </section>`;

  const tocItems = input.entries
    .map(
      (e) => `
        <li>
          <span class="toc-num">№ ${e.serialNumber}</span>
          <span class="toc-name">${escapeHtml(e.peak.name_ko)}</span>
          <span class="toc-dots"></span>
          <span class="toc-elev">${e.peak.elevation_m.toLocaleString()}m</span>
        </li>`
    )
    .join('');

  const tocPage = `
    <section class="page toc">
      <header class="page-header">
        <span>TROVE PEAKS</span>
        <span>목차 · TABLE OF CONTENTS</span>
      </header>
      <h2 class="section-title">정복한 봉우리</h2>
      <ol class="toc-list">${tocItems}</ol>
    </section>`;

  const peakPages = input.entries
    .map((e) => {
      const photo = e.ascent.photo_url
        ? `<img class="photo" src="${escapeHtml(e.ascent.photo_url)}" />`
        : `<div class="photo placeholder"><em>No photo on record.</em></div>`;
      const notes = e.ascent.notes
        ? `<blockquote>"${escapeHtml(e.ascent.notes)}"</blockquote>`
        : '';
      const lists =
        [
          e.peak.list_korea_100 ? '100대 명산' : null,
          e.peak.list_baekdudaegan ? '백두대간' : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—';

      return `
        <section class="page entry">
          <header class="page-header">
            <span>№ ${e.serialNumber} · ${escapeHtml(e.peak.region_short ?? e.peak.region)}</span>
            <span>${escapeHtml(lists)}</span>
          </header>
          <h1 class="entry-name">${escapeHtml(e.peak.name_ko)}</h1>
          <p class="entry-en">${escapeHtml(e.peak.name_en ?? '')}</p>
          <div class="photo-frame">${photo}</div>
          <div class="entry-meta">
            <div><span class="label">ELEVATION</span><span class="value">${e.peak.elevation_m.toLocaleString()}m</span></div>
            <div><span class="label">ASCENDED</span><span class="value">${formatKoreanDate(new Date(e.ascent.ascended_at))}</span></div>
            <div><span class="label">REGION</span><span class="value">${escapeHtml(e.peak.region)}</span></div>
          </div>
          ${notes}
          <footer class="entry-footer">TROVE PEAKS · VOL. I</footer>
        </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>Trove Peaks · ${escapeHtml(input.userLabel)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { background: #FAF6EE; color: #0F2E4C; margin: 0; padding: 0;
    font-family: 'Noto Serif KR', 'Apple SD Gothic Neo', 'Times New Roman', serif;
    -webkit-font-smoothing: antialiased; }
  .page { padding: 0; page-break-after: always; }
  .page-header { display: flex; justify-content: space-between;
    font-family: 'Courier New', monospace;
    font-size: 9pt; letter-spacing: 1.6pt; color: #6B7280;
    text-transform: uppercase; padding-bottom: 10mm;
    border-bottom: 0.5pt solid #D8D2C5; margin-bottom: 12mm; }

  .cover { display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 250mm; }
  .cover-frame { border: 0.5pt solid #0F2E4C; padding: 28mm 22mm; text-align: center;
    max-width: 140mm; }
  .cover .meta { font-family: 'Courier New', monospace; font-size: 10pt;
    letter-spacing: 3pt; color: #C9A961; margin: 0; text-transform: uppercase; }
  .brand { font-family: 'Times New Roman', serif;
    font-size: 56pt; font-style: italic; font-weight: 400;
    margin: 18pt 0 4pt 0; letter-spacing: -1pt; }
  .brand-sub { font-family: 'Apple SD Gothic Neo', serif; font-size: 14pt;
    color: #4B5660; margin: 0 0 18pt 0; }
  .cover-divider { width: 36pt; height: 0.6pt; background: #C9A961;
    margin: 14pt auto; }
  .owner { font-family: 'Apple SD Gothic Neo', serif; font-size: 18pt;
    font-weight: 700; margin: 18pt 0 4pt 0; }
  .stats { font-family: 'Courier New', monospace; font-size: 12pt;
    color: #4B5660; margin: 0; letter-spacing: 1pt; }
  .cover-footer { margin-top: 22mm; font-family: 'Times New Roman', serif;
    font-style: italic; color: #6B7280; font-size: 12pt; text-align: center; }

  .section-title { font-family: 'Apple SD Gothic Neo', serif; font-size: 22pt;
    font-weight: 700; margin: 0 0 12mm 0; }
  .toc-list { list-style: none; padding: 0; margin: 0; }
  .toc-list li { display: flex; align-items: baseline; padding: 5pt 0;
    border-bottom: 0.3pt dotted #D8D2C5; font-size: 11pt; }
  .toc-num { font-family: 'Courier New', monospace; font-size: 9pt;
    color: #C9A961; letter-spacing: 1pt; width: 64pt; }
  .toc-name { font-family: 'Apple SD Gothic Neo', serif; font-weight: 700;
    color: #0F2E4C; }
  .toc-dots { flex: 1; border-bottom: 0.3pt dotted #D8D2C5; margin: 0 6pt 3pt 6pt; }
  .toc-elev { font-family: 'Courier New', monospace; font-size: 10pt;
    color: #4B5660; }

  .entry-name { font-family: 'Apple SD Gothic Neo', serif; font-size: 38pt;
    font-weight: 700; margin: 4mm 0 1mm 0; letter-spacing: -1pt; }
  .entry-en { font-family: 'Times New Roman', serif; font-style: italic;
    font-size: 16pt; color: #4B5660; margin: 0 0 8mm 0; }
  .photo-frame { width: 100%; border: 0.5pt solid #0F2E4C; padding: 3mm;
    background: #FAF6EE; margin-bottom: 8mm; }
  .photo { width: 100%; max-height: 110mm; object-fit: cover; display: block; }
  .photo.placeholder { display: flex; align-items: center; justify-content: center;
    height: 90mm; color: #6B7280; font-family: 'Times New Roman', serif;
    font-style: italic; font-size: 14pt; }
  .entry-meta { display: flex; gap: 14mm; margin-bottom: 8mm; }
  .entry-meta > div { display: flex; flex-direction: column; }
  .entry-meta .label { font-family: 'Courier New', monospace; font-size: 8pt;
    color: #6B7280; letter-spacing: 1.4pt; text-transform: uppercase; }
  .entry-meta .value { font-family: 'Courier New', monospace; font-size: 14pt;
    color: #0F2E4C; margin-top: 2pt; }
  blockquote { font-family: 'Apple SD Gothic Neo', serif; font-style: italic;
    border-left: 1pt solid #C9A961; padding: 2mm 0 2mm 6mm; margin: 0 0 8mm 0;
    color: #0F2E4C; font-size: 13pt; line-height: 1.6; }
  .entry-footer { position: relative; margin-top: 8mm;
    font-family: 'Courier New', monospace; font-size: 8pt;
    color: #6B7280; letter-spacing: 1.6pt; text-align: center;
    border-top: 0.3pt solid #D8D2C5; padding-top: 4mm; }
</style>
</head>
<body>
  ${coverPage}
  ${tocPage}
  ${peakPages}
</body>
</html>`;
}

export async function exportCollectionToPdf(input: PdfExportInput): Promise<void> {
  if (input.entries.length === 0) {
    throw new Error('도감이 비어 있습니다. 첫 봉우리를 먼저 기록해 주세요.');
  }
  if (Platform.OS === 'web') {
    throw new Error('PDF 내보내기는 모바일에서 사용해 주세요.');
  }

  const html = buildHtml(input);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Trove Peaks · 내 도감',
      UTI: 'com.adobe.pdf',
    });
  }
}
