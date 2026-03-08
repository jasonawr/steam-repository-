import { useState } from "react";

// ─── KONSTANTA MODEL (sesuai Bab III laporan) ────────────────────────────
// Titik tengah kekuatan tekan literatur:
//   Kardus    = 5 MPa  → koefisien ternormalisasi = 1.0
//   Kertas    = 3 MPa  → koefisien ternormalisasi = 0.6
//   Daun Kering = 0.5 MPa → koefisien ternormalisasi = 0.1
const STRENGTH_COEFF = { cardboard: 1.0, paper: 0.6, leaves: 0.1 };
const TOTAL_MASS = 145; // gram — x + y + z = 145 g (total bahan baku)

// Ambang batas integritas (skala ternormalisasi 0–1)
const INTEGRITY_HIGH = 0.7;
const INTEGRITY_MED = 0.4;

// ─── DATA EKSPERIMEN NYATA (Bab IV laporan) ───────────────────────────────
const EXP_DATA = {
  palette: [
    {
      variasi: "Briquette Polos",
      beratAwal: 19,
      beratBriquette: 19,
      waktuBakar: 15.29,
      sisaAbu: 1.8,
    },
    {
      variasi: "Briquette Oli",
      beratAwal: 19,
      beratBriquette: 19,
      waktuBakar: 16.07,
      sisaAbu: 1.6,
    },
    {
      variasi: "Briquette Minyak",
      beratAwal: 19,
      beratBriquette: 19,
      waktuBakar: 18.39,
      sisaAbu: 1.4,
    },
    {
      variasi: "Kardus Bekas (Kontrol)",
      beratAwal: 19,
      beratBriquette: 19,
      waktuBakar: null,
      sisaAbu: null,
    },
  ],
  bata: [
    {
      variasi: "Briquette Polos",
      beratAwal: 35,
      beratBriquette: 35,
      waktuBakar: 31.03,
      sisaAbu: 3.2,
    },
    {
      variasi: "Briquette Oli",
      beratAwal: 35,
      beratBriquette: 35,
      waktuBakar: 35.58,
      sisaAbu: 2.8,
    },
    {
      variasi: "Briquette Minyak",
      beratAwal: 35,
      beratBriquette: 35,
      waktuBakar: 38.24,
      sisaAbu: 2.3,
    },
    {
      variasi: "Kardus Bekas (Kontrol)",
      beratAwal: 35,
      beratBriquette: 35,
      waktuBakar: null,
      sisaAbu: null,
    },
  ],
};

// ─── TEMA & CSS ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --char:  #f5ede0;
    --ember: #e85d2a;
    --coal:  #1a1410;
    --ash:   #2e2820;
    --smoke: #6b5e52;
    --glow:  #ffb347;
    --valid: #7ec98c;
    --mod:   #f0c040;
    --warn:  #e85d2a;
  }

  body {
    background: var(--coal);
    color: var(--char);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; }

  /* ── Header ── */
  .header { padding: 48px 0 32px; text-align: center; position: relative; }
  .header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,93,42,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .logo-flame { font-size: 40px; animation: flicker 2.4s ease-in-out infinite; display: inline-block; }
  @keyframes flicker {
    0%,100% { transform: scaleY(1) rotate(-1deg); opacity: 1; }
    33%      { transform: scaleY(1.08) rotate(1deg); opacity: .9; }
    66%      { transform: scaleY(.96) rotate(0deg); opacity: 1; }
  }
  .logo-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 10vw, 88px);
    letter-spacing: 6px;
    color: var(--ember);
    line-height: 1;
    text-shadow: 0 0 40px rgba(232,93,42,0.5), 0 2px 0 #7a2500;
    margin: 8px 0 4px;
  }
  .logo-sub { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--smoke); }

  /* ── Nav (3 tab) ── */
  .nav {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    background: var(--ash);
    border-radius: 12px;
    padding: 4px;
    margin: 32px 0;
    border: 1px solid #3a3028;
  }
  .nav-btn {
    background: none; border: none; padding: 14px 12px; border-radius: 9px;
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1.5px;
    text-transform: uppercase; cursor: pointer; color: var(--smoke); transition: all .2s;
    line-height: 1.4;
  }
  .nav-btn:hover { color: var(--char); }
  .nav-btn.active { background: var(--ember); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.4); }

  /* ── Card ── */
  .card { background: var(--ash); border: 1px solid #3a3028; border-radius: 16px; padding: 28px 32px; margin-bottom: 16px; }
  .card-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px;
    color: var(--glow); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
  }

  /* ── Formula box ── */
  .formula-box {
    background: var(--coal); border: 1px solid #3a3028; border-left: 3px solid var(--ember);
    border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;
    font-family: 'DM Mono', monospace; font-size: 13px; color: var(--smoke); line-height: 1.8;
  }
  .formula-line { color: var(--char); font-size: 15px; letter-spacing: 1px; margin-bottom: 4px; }
  .formula-note { font-size: 11px; letter-spacing: 1px; }
  .formula-highlight { color: var(--glow); }

  /* ── Slider ── */
  .slider-group { margin-bottom: 20px; }
  .slider-label { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .slider-name { font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--char); }
  .slider-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .slider-value { font-family: 'DM Mono', monospace; font-size: 18px; color: var(--glow); }
  .slider-value span { font-size: 12px; color: var(--smoke); margin-left: 2px; }
  .slider-pct { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--smoke); letter-spacing: 1px; }
  input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: #3a3028; outline: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: var(--ember); box-shadow: 0 0 8px rgba(232,93,42,.6); transition: transform .1s;
  }
  input[type=range]::-webkit-slider-thumb:active { transform: scale(1.2); }
  .remainder-bar {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: var(--coal); border-radius: 8px; border: 1px solid #3a3028;
    font-family: 'DM Mono', monospace; font-size: 13px; margin-top: 4px;
  }
  .remainder-ok { color: var(--valid); }

  /* ── Comp bar ── */
  .comp-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; margin: 16px 0 8px; background: #3a3028; }
  .comp-seg { transition: width .4s cubic-bezier(.4,0,.2,1); min-width: 0; }
  .comp-legend { display: flex; gap: 16px; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--smoke); flex-wrap: wrap; }
  .comp-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; }

  /* ── Gauge ── */
  .gauge-section { margin-top: 8px; }
  .gauge-label-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
  .gauge-heading { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-family: 'DM Mono', monospace; color: var(--smoke); }
  .gauge-score-group { display: flex; align-items: baseline; gap: 10px; }
  .gauge-raw { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--smoke); }
  .gauge-norm { font-family: 'Bebas Neue', sans-serif; font-size: 40px; letter-spacing: 2px; line-height: 1; transition: color .4s; }
  .gauge-norm-unit { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--smoke); }
  .gauge-track { height: 18px; background: #3a3028; border-radius: 9px; overflow: hidden; position: relative; margin-bottom: 6px; }
  .gauge-fill { height: 100%; border-radius: 9px; transition: width .6s cubic-bezier(.4,0,.2,1), background .4s; }
  .gauge-markers { position: relative; height: 18px; margin-bottom: 8px; }
  .gauge-marker { position: absolute; top: 0; transform: translateX(-50%); font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1px; color: #5a4e45; text-align: center; }
  .gauge-marker::before { content: '|'; display: block; color: #5a4e45; margin-bottom: 1px; }

  /* ── Integrity badge ── */
  .integrity-badge { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 12px; border: 1px solid; width: 100%; transition: all .4s; }
  .integrity-badge.high { background: rgba(126,201,140,.08); border-color: var(--valid); }
  .integrity-badge.mod  { background: rgba(240,192,64,.08);  border-color: var(--mod); }
  .integrity-badge.low  { background: rgba(232,93,42,.08);   border-color: var(--warn); }
  .integrity-icon { font-size: 24px; flex-shrink: 0; }
  .integrity-tier { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 3px; }
  .integrity-badge.high .integrity-tier { color: var(--valid); }
  .integrity-badge.mod  .integrity-tier { color: var(--mod); }
  .integrity-badge.low  .integrity-tier { color: var(--warn); }
  .integrity-desc { font-size: 12px; color: var(--smoke); margin-top: 2px; line-height: 1.5; }

  /* ── Contrib grid ── */
  .contrib-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
  @media (max-width: 560px) { .contrib-grid { grid-template-columns: 1fr; } }
  .contrib-box { background: var(--coal); border: 1px solid #3a3028; border-radius: 10px; padding: 14px; }
  .contrib-name { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; font-family: 'DM Mono', monospace; color: var(--smoke); margin-bottom: 6px; }
  .contrib-val { font-family: 'Bebas Neue', sans-serif; font-size: 28px; line-height: 1; letter-spacing: 1px; }
  .contrib-pts { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--smoke); margin-top: 3px; }
  .contrib-bar-track { height: 3px; background: #3a3028; border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .contrib-bar-fill { height: 100%; border-radius: 2px; transition: width .5s cubic-bezier(.4,0,.2,1); }

  /* ── Density section ── */
  .product-pills { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .pill {
    padding: 10px 20px; border-radius: 30px; border: 1px solid #3a3028; background: none;
    font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 1px;
    text-transform: uppercase; cursor: pointer; color: var(--smoke); transition: all .2s;
  }
  .pill:hover { border-color: var(--ember); color: var(--char); }
  .pill.active { background: var(--ember); border-color: var(--ember); color: #fff; }

  .shape-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
  .shape-btn {
    padding: 14px; border-radius: 10px; border: 1px solid #3a3028; background: none;
    cursor: pointer; color: var(--smoke); font-family: 'DM Mono', monospace;
    font-size: 11px; letter-spacing: 1px; text-transform: uppercase; text-align: center; transition: all .2s;
  }
  .shape-btn .shape-icon { display: block; font-size: 24px; margin-bottom: 6px; }
  .shape-btn:hover { border-color: var(--ember); color: var(--char); }
  .shape-btn.active { border-color: var(--glow); background: rgba(255,179,71,.08); color: var(--glow); }

  .field-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .field-group label { display: block; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-family: 'DM Mono', monospace; color: var(--smoke); margin-bottom: 6px; }
  .field-group input {
    width: 100%; background: var(--coal); border: 1px solid #3a3028; border-radius: 8px;
    padding: 10px 14px; color: var(--char); font-family: 'DM Mono', monospace; font-size: 15px; outline: none; transition: border-color .2s;
  }
  .field-group input:focus { border-color: var(--ember); }
  .field-group input::placeholder { color: #4a3e35; }

  .density-table { width: 100%; border-collapse: collapse; font-family: 'DM Mono', monospace; font-size: 13px; margin-bottom: 16px; }
  .density-table th { text-align: left; padding: 8px 12px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--smoke); border-bottom: 1px solid #3a3028; }
  .density-table td { padding: 12px; border-bottom: 1px solid #2a221a; }
  .density-table td:not(:first-child) { color: var(--glow); }
  .density-table tr:last-child td { border-bottom: none; }

  .delta-row { display: flex; align-items: center; gap: 16px; background: var(--coal); border-radius: 10px; padding: 16px 20px; border: 1px solid #3a3028; margin-top: 8px; }
  .delta-val { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; flex-shrink: 0; }
  .delta-val.neg { color: var(--valid); }
  .delta-val.pos { color: var(--warn); }
  .delta-desc { font-size: 13px; color: var(--smoke); line-height: 1.6; }
  .delta-desc strong { color: var(--char); }

  /* ── Experiment results tab ── */
  .exp-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .exp-btn {
    padding: 14px; border-radius: 10px; border: 1px solid #3a3028; background: none;
    cursor: pointer; color: var(--smoke); font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 3px; text-align: center; transition: all .2s;
  }
  .exp-btn.active { background: var(--ember); border-color: var(--ember); color: #fff; }
  .exp-btn:hover:not(.active) { border-color: var(--glow); color: var(--char); }

  .exp-table { width: 100%; border-collapse: collapse; font-family: 'DM Mono', monospace; font-size: 12px; margin-bottom: 16px; }
  .exp-table th { text-align: left; padding: 10px 12px; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--smoke); border-bottom: 2px solid #3a3028; }
  .exp-table td { padding: 12px; border-bottom: 1px solid #2a221a; vertical-align: middle; }
  .exp-table tr:last-child td { border-bottom: none; }
  .exp-table tr.kontrol td { opacity: .55; font-style: italic; }
  .exp-table td.num { color: var(--glow); font-weight: 500; }
  .exp-table td.best { color: var(--valid); font-weight: 600; }
  .variasi-tag {
    display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px;
    letter-spacing: 1px; text-transform: uppercase; font-family: 'DM Mono', monospace;
  }
  .variasi-tag.polos  { background: rgba(245,237,224,.1); color: var(--char); border: 1px solid #3a3028; }
  .variasi-tag.oli    { background: rgba(232,93,42,.15);  color: #ffb347; border: 1px solid rgba(232,93,42,.3); }
  .variasi-tag.minyak { background: rgba(126,201,140,.15);color: var(--valid); border: 1px solid rgba(126,201,140,.3); }
  .variasi-tag.kontrol{ background: rgba(107,94,82,.15);  color: var(--smoke); border: 1px solid #3a3028; }

  .bar-inline { display: flex; align-items: center; gap: 8px; }
  .bar-mini-track { flex: 1; height: 6px; background: #3a3028; border-radius: 3px; overflow: hidden; }
  .bar-mini-fill { height: 100%; border-radius: 3px; transition: width .5s; }

  .findings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  @media (max-width: 560px) { .findings-grid { grid-template-columns: 1fr; } }
  .finding-box { background: var(--coal); border: 1px solid #3a3028; border-radius: 10px; padding: 16px; }
  .finding-icon { font-size: 20px; margin-bottom: 8px; }
  .finding-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px; color: var(--glow); margin-bottom: 6px; }
  .finding-text { font-size: 12px; color: var(--smoke); line-height: 1.6; }
  .finding-text strong { color: var(--char); }

  .efficiency-row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--coal); border-radius: 10px; border: 1px solid #3a3028; margin-top: 12px; }
  .eff-label { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--smoke); min-width: 140px; }
  .eff-val { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; color: var(--glow); }
  .eff-unit { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--smoke); }

  /* ── Log ── */
  .log-section { margin-top: 32px; }
  .log-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .log-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 3px; color: var(--smoke); }
  .log-clear {
    background: none; border: 1px solid #3a3028; border-radius: 6px; padding: 6px 12px;
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
    color: var(--smoke); cursor: pointer; transition: all .2s;
  }
  .log-clear:hover { border-color: var(--warn); color: var(--warn); }
  .log-empty { text-align: center; padding: 28px; font-family: 'DM Mono', monospace; font-size: 12px; color: #3a3028; letter-spacing: 2px; }
  .log-entry {
    background: var(--coal); border: 1px solid #3a3028; border-left: 3px solid var(--smoke);
    border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;
    font-family: 'DM Mono', monospace; font-size: 12px; color: var(--smoke); line-height: 1.7;
    animation: slideIn .3s ease;
  }
  .log-entry.high    { border-left-color: var(--valid); }
  .log-entry.mod     { border-left-color: var(--mod); }
  .log-entry.low     { border-left-color: var(--warn); }
  .log-entry.density { border-left-color: var(--glow); }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .log-entry-head { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; color: #4a3e35; }

  .log-save-btn {
    width: 100%; margin-top: 8px; padding: 14px; border-radius: 10px; border: 1px dashed #3a3028;
    background: none; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--smoke); cursor: pointer; transition: all .2s;
  }
  .log-save-btn:hover { border-color: var(--ember); color: var(--ember); }

  .calc-btn {
    width: 100%; padding: 16px; border-radius: 10px; border: none; background: var(--ember);
    color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 4px;
    cursor: pointer; transition: all .2s; margin-top: 8px; box-shadow: 0 4px 20px rgba(232,93,42,.3);
  }
  .calc-btn:hover { background: #ff6b35; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(232,93,42,.4); }
  .calc-btn:active { transform: translateY(0); }

  .info-note {
    background: rgba(255,179,71,.06); border: 1px solid rgba(255,179,71,.2); border-radius: 10px;
    padding: 12px 16px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--smoke);
    line-height: 1.7; margin-bottom: 16px;
  }
  .info-note strong { color: var(--glow); }
`;

// ─── UTILS ────────────────────────────────────────────────────────────────
const fmt2 = (n) => Number(n).toFixed(2);
const fmt3 = (n) => Number(n).toFixed(3);
const fmt4 = (n) => Number(n).toFixed(4);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function calcStrength(x, y, z, totalMass) {
  const S =
    STRENGTH_COEFF.cardboard * x +
    STRENGTH_COEFF.paper * y +
    STRENGTH_COEFF.leaves * z;
  const Snorm = S / totalMass;
  const cCard = STRENGTH_COEFF.cardboard * x;
  const cPaper = STRENGTH_COEFF.paper * y;
  const cLeaf = STRENGTH_COEFF.leaves * z;
  const pCard = S > 0 ? (cCard / S) * 100 : 0;
  const pPaper = S > 0 ? (cPaper / S) * 100 : 0;
  const pLeaf = S > 0 ? (cLeaf / S) * 100 : 0;
  return { S, Snorm, cCard, cPaper, cLeaf, pCard, pPaper, pLeaf };
}

function integrityTier(Snorm) {
  if (Snorm >= INTEGRITY_HIGH) return "high";
  if (Snorm >= INTEGRITY_MED) return "mod";
  return "low";
}

const INTEGRITY_LABELS = {
  high: "Integritas Struktural Tinggi",
  mod: "Integritas Sedang",
  low: "Integritas Rendah",
};
const INTEGRITY_DESCS = {
  high: "S_norm ≥ 0.7 — komposisi sangat kuat secara struktural, cocok untuk produksi briket/bata.",
  mod: "S_norm 0.4–0.7 — cukup baik; pertimbangkan menambah proporsi kardus agar lebih kuat.",
  low: "S_norm < 0.4 — komposisi lemah; tingkatkan rasio kardus atau kertas secara signifikan.",
};
const INTEGRITY_ICONS = { high: "🟢", mod: "🟡", low: "🔴" };
const GAUGE_COLORS = {
  high: "var(--valid)",
  mod: "var(--mod)",
  low: "var(--warn)",
};

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── BAGIAN A: KALKULATOR KEKUATAN ───────────────────────────────────────
function StrengthPanel({ onLog }) {
  const [mode, setMode] = useState("palette"); // "palette" = 19g, "bata" = 35g
  const totalMass = mode === "palette" ? 19 : 35;

  const [x, setX] = useState(Math.round(totalMass * 0.55));
  const [y, setY] = useState(Math.round(totalMass * 0.28));

  const maxY = totalMass - x;
  const yC = clamp(y, 0, maxY);
  const z = clamp(totalMass - x - yC, 0, totalMass);
  const total = x + yC + z;

  const { S, Snorm, cCard, cPaper, cLeaf, pCard, pPaper, pLeaf } = calcStrength(
    x,
    yC,
    z,
    totalMass
  );
  const tier = integrityTier(Snorm);
  const color = GAUGE_COLORS[tier];

  const handleMode = (m) => {
    setMode(m);
    const tm = m === "palette" ? 19 : 35;
    setX(Math.round(tm * 0.55));
    setY(Math.round(tm * 0.28));
  };
  const handleX = (v) => {
    const nx = clamp(Number(v), 0, totalMass);
    setX(nx);
    if (y > totalMass - nx) setY(totalMass - nx);
  };
  const handleY = (v) => setY(clamp(Number(v), 0, maxY));
  const massPct = (g) => ((g / totalMass) * 100).toFixed(1);

  return (
    <div>
      <div className="card">
        <div className="card-title">⚗️ Model Kekuatan</div>

        {/* Mode toggle: Palette vs Bata */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
              color: "var(--smoke)",
              marginBottom: 8,
            }}
          >
            Pilih Jenis Briquette
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {[
              {
                key: "palette",
                icon: "🥫",
                label: "Palette",
                desc: "Total massa = 19 g",
              },
              {
                key: "bata",
                icon: "🧱",
                label: "Bata",
                desc: "Total massa = 35 g",
              },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => handleMode(m.key)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${
                    mode === m.key ? "var(--ember)" : "#3a3028"
                  }`,
                  background: mode === m.key ? "rgba(232,93,42,0.12)" : "none",
                  color: mode === m.key ? "var(--char)" : "var(--smoke)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  letterSpacing: 1,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all .2s",
                }}
              >
                <span
                  style={{ fontSize: 20, display: "block", marginBottom: 4 }}
                >
                  {m.icon}
                </span>
                <strong>{m.label}</strong>
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    color: "var(--smoke)",
                    marginTop: 2,
                  }}
                >
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="formula-box">
          <div className="formula-line">
            S &nbsp;= <span className="formula-highlight">1.0</span>·x +{" "}
            <span className="formula-highlight">0.6</span>·y +{" "}
            <span className="formula-highlight">0.1</span>·z
          </div>
          <div className="formula-line">
            S<sub>norm</sub> = S / {totalMass}
          </div>
          <div className="formula-note">
            Koefisien dinormalisasi dari titik tengah kekuatan tekan literatur:
            <br />
            Kardus = 5 MPa (koef. 1.0) · Kertas = 3 MPa (koef. 0.6) · Daun
            Kering = 0.5 MPa (koef. 0.1)
            <br />
            Kendala total massa: x + y + z = {totalMass} g &nbsp;
            <span style={{ color: "var(--ember)" }}>
              ({mode === "palette" ? "Briquette Palette" : "Briquette Bata"})
            </span>
          </div>
        </div>

        {/* Batang komposisi */}
        <div className="comp-bar">
          <div
            className="comp-seg"
            style={{
              width: `${(x / totalMass) * 100}%`,
              background: "#e85d2a",
            }}
          />
          <div
            className="comp-seg"
            style={{
              width: `${(yC / totalMass) * 100}%`,
              background: "#ffb347",
            }}
          />
          <div
            className="comp-seg"
            style={{
              width: `${(z / totalMass) * 100}%`,
              background: "#7ec98c",
            }}
          />
        </div>
        <div className="comp-legend">
          <span>
            <span className="comp-dot" style={{ background: "#e85d2a" }} />
            Kardus {x.toFixed(1)}g ({massPct(x)}%)
          </span>
          <span>
            <span className="comp-dot" style={{ background: "#ffb347" }} />
            Kertas {yC.toFixed(1)}g ({massPct(yC)}%)
          </span>
          <span>
            <span className="comp-dot" style={{ background: "#7ec98c" }} />
            Daun Kering {z.toFixed(1)}g ({massPct(z)}%)
          </span>
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="slider-group">
            <div className="slider-label">
              <span className="slider-name">🟠 Kardus (x)</span>
              <div className="slider-meta">
                <span className="slider-value">
                  {x.toFixed(1)}
                  <span>g</span>
                </span>
                <span className="slider-pct">
                  {massPct(x)}% dari campuran · koef. 1.0
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={totalMass}
              step={0.5}
              value={x}
              onChange={(e) => handleX(e.target.value)}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span className="slider-name">🟡 Kertas (y)</span>
              <div className="slider-meta">
                <span className="slider-value">
                  {yC.toFixed(1)}
                  <span>g</span>
                </span>
                <span className="slider-pct">
                  {massPct(yC)}% dari campuran · koef. 0.6
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={maxY}
              step={0.5}
              value={yC}
              onChange={(e) => handleY(e.target.value)}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span className="slider-name">🟢 Daun Kering (z) — otomatis</span>
              <div className="slider-meta">
                <span className="slider-value">
                  {z.toFixed(1)}
                  <span>g</span>
                </span>
                <span className="slider-pct">
                  {massPct(z)}% dari campuran · koef. 0.1
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={totalMass}
              step={0.5}
              value={z}
              readOnly
              style={{ opacity: 0.4, cursor: "default" }}
            />
          </div>

          <div className="remainder-bar">
            <span className="remainder-ok">
              ✓ Total = {total.toFixed(1)} g — dikunci ke {totalMass} g (
              {mode === "palette" ? "Palette" : "Bata"})
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📊 Analisis Kekuatan</div>
        <div className="gauge-section">
          <div className="gauge-label-row">
            <span className="gauge-heading">
              Kekuatan Ternormalisasi (S / {totalMass})
            </span>
            <div className="gauge-score-group">
              <span className="gauge-raw">S = {fmt2(S)}</span>
              <span className="gauge-norm" style={{ color }}>
                {fmt3(Snorm)}
              </span>
              <span className="gauge-norm-unit">/ 1.000</span>
            </div>
          </div>
          <div className="gauge-track">
            <div
              className="gauge-fill"
              style={{
                width: `${Math.min(100, Snorm * 100)}%`,
                background: color,
              }}
            />
          </div>
          <div className="gauge-markers">
            <div
              className="gauge-marker"
              style={{ left: `${INTEGRITY_MED * 100}%` }}
            >
              0.4
            </div>
            <div
              className="gauge-marker"
              style={{ left: `${INTEGRITY_HIGH * 100}%` }}
            >
              0.7
            </div>
          </div>
          <div className={`integrity-badge ${tier}`}>
            <span className="integrity-icon">{INTEGRITY_ICONS[tier]}</span>
            <div>
              <div className="integrity-tier">{INTEGRITY_LABELS[tier]}</div>
              <div className="integrity-desc">{INTEGRITY_DESCS[tier]}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
              color: "var(--smoke)",
              marginBottom: 4,
            }}
          >
            Kontribusi Kekuatan Setiap Material
          </div>
          <div className="contrib-grid">
            {[
              { name: "Kardus (x)", pct: pCard, pts: cCard, color: "#e85d2a" },
              {
                name: "Kertas (y)",
                pct: pPaper,
                pts: cPaper,
                color: "#ffb347",
              },
              {
                name: "Daun Kering (z)",
                pct: pLeaf,
                pts: cLeaf,
                color: "#7ec98c",
              },
            ].map((m) => (
              <div className="contrib-box" key={m.name}>
                <div className="contrib-name">{m.name}</div>
                <div className="contrib-val" style={{ color: m.color }}>
                  {m.pct.toFixed(1)}
                  <span style={{ fontSize: 14 }}>%</span>
                </div>
                <div className="contrib-pts">{fmt2(m.pts)} pts</div>
                <div className="contrib-bar-track">
                  <div
                    className="contrib-bar-fill"
                    style={{ width: `${m.pct}%`, background: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="log-save-btn"
          style={{ marginTop: 20 }}
          onClick={() =>
            onLog({
              type: "strength",
              label: tier,
              time: now(),
              data: { x, y: yC, z, S, Snorm, tier, mode, totalMass },
            })
          }
        >
          + Simpan ke Log Hasil
        </button>
      </div>
    </div>
  );
}

// ─── BAGIAN B: KALKULATOR DENSITAS ───────────────────────────────────────
function DensityPanel({ onLog }) {
  const [product, setProduct] = useState("Palette");
  const [shape, setShape] = useState("cylinder");
  const [massBefore, setMassBefore] = useState("");
  const [massAfter, setMassAfter] = useState("");
  const [r, setR] = useState("");
  const [h, setH] = useState("");
  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const [bh, setBh] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const mb = parseFloat(massBefore),
      ma = parseFloat(massAfter);
    if (!mb || !ma || ma > mb) {
      alert("Masukkan massa yang valid (sesudah ≤ sebelum).");
      return;
    }
    let volume;
    if (shape === "cylinder") {
      const rv = parseFloat(r),
        hv = parseFloat(h);
      if (!rv || !hv) {
        alert("Masukkan jari-jari dan tinggi.");
        return;
      }
      volume = Math.PI * rv * rv * hv;
    } else {
      const lv = parseFloat(l),
        wv = parseFloat(w),
        hv = parseFloat(bh);
      if (!lv || !wv || !hv) {
        alert("Masukkan semua dimensi balok.");
        return;
      }
      volume = lv * wv * hv;
    }
    const rhoBefore = mb / volume;
    const rhoAfter = ma / volume;
    const deltaRho = rhoAfter - rhoBefore;
    const deltaPct = (deltaRho / rhoBefore) * 100;
    setResult({
      mb,
      ma,
      volume,
      rhoBefore,
      rhoAfter,
      deltaRho,
      deltaPct,
      product,
    });
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">⚗️ Model Densitas</div>
        <div className="formula-box">
          <div className="formula-line">
            ρ &nbsp;= m / V &nbsp;&nbsp;&nbsp;
            <span style={{ color: "var(--smoke)", fontSize: 12 }}>
              (densitas = massa ÷ volume)
            </span>
          </div>
          <div className="formula-line" style={{ marginTop: 6 }}>
            V<sub>silinder</sub> = π · r² · h &nbsp;&nbsp;&nbsp;
            <span style={{ color: "var(--smoke)", fontSize: 12 }}>
              (silinder — digunakan untuk Palette)
            </span>
          </div>
          <div className="formula-line">
            V<sub>balok</sub> = p · l · t &nbsp;&nbsp;&nbsp;
            <span style={{ color: "var(--smoke)", fontSize: 12 }}>
              (balok — digunakan untuk Bata)
            </span>
          </div>
          <div className="formula-line" style={{ marginTop: 6 }}>
            Δρ &nbsp;= ρ<sub>sesudah</sub> − ρ<sub>sebelum</sub>
          </div>
          <div className="formula-line">
            Δρ% = (Δρ / ρ<sub>sebelum</sub>) × 100
          </div>
          <div className="formula-note" style={{ marginTop: 8 }}>
            Satuan: massa dalam gram (g) · dimensi dalam sentimeter (cm) ·
            densitas dalam g/cm³
            <br />
            <span className="formula-highlight">Δρ% negatif</span> → pengeringan
            mengurangi massa, volume tetap → densitas menurun.
            <br />
            <span className="formula-highlight">Δρ% positif</span> → produk
            menyusut saat pengeringan → densitas meningkat.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📦 Jenis Produk</div>
        <div className="info-note">
          Sesuai BAB IV laporan: <strong>Briquette Palette</strong> (berat jadi
          19 g, bentuk silinder pipa PVC) dan
          <strong> Briquette Bata</strong> (berat jadi 35 g, ¼ sampel bata,
          bentuk balok).
        </div>
        <div className="product-pills">
          {[
            { key: "Palette", icon: "🥫", desc: "19 g · Silinder" },
            { key: "Bata", icon: "🧱", desc: "35 g · Balok" },
          ].map((p) => (
            <button
              key={p.key}
              className={`pill ${product === p.key ? "active" : ""}`}
              onClick={() => {
                setProduct(p.key);
                setShape(p.key === "Bata" ? "block" : "cylinder");
                setResult(null);
              }}
            >
              {p.icon} {p.key}{" "}
              <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📐 Bentuk & Dimensi</div>
        <div className="shape-toggle">
          <button
            className={`shape-btn ${shape === "cylinder" ? "active" : ""}`}
            onClick={() => setShape("cylinder")}
          >
            <span className="shape-icon">🥫</span>Silinder
            <br />
            <span style={{ fontSize: 9, opacity: 0.6 }}>(Palette)</span>
          </button>
          <button
            className={`shape-btn ${shape === "block" ? "active" : ""}`}
            onClick={() => setShape("block")}
          >
            <span className="shape-icon">🧱</span>Balok
            <br />
            <span style={{ fontSize: 9, opacity: 0.6 }}>(Bata)</span>
          </button>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label>Massa Sebelum (g)</label>
            <input
              type="number"
              min={0}
              placeholder={product === "Palette" ? "mis. 19" : "mis. 35"}
              value={massBefore}
              onChange={(e) => {
                setMassBefore(e.target.value);
                setResult(null);
              }}
            />
          </div>
          <div className="field-group">
            <label>Massa Sesudah (g)</label>
            <input
              type="number"
              min={0}
              placeholder="mis. sesudah kering"
              value={massAfter}
              onChange={(e) => {
                setMassAfter(e.target.value);
                setResult(null);
              }}
            />
          </div>
        </div>

        {shape === "cylinder" ? (
          <div className="field-row">
            <div className="field-group">
              <label>Jari-jari (cm)</label>
              <input
                type="number"
                min={0}
                placeholder="mis. 0.635 (½ inch)"
                value={r}
                onChange={(e) => {
                  setR(e.target.value);
                  setResult(null);
                }}
              />
            </div>
            <div className="field-group">
              <label>Tinggi (cm)</label>
              <input
                type="number"
                min={0}
                placeholder="mis. 8.0"
                value={h}
                onChange={(e) => {
                  setH(e.target.value);
                  setResult(null);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="field-row">
            <div className="field-group">
              <label>Panjang (cm)</label>
              <input
                type="number"
                min={0}
                placeholder="mis. 10"
                value={l}
                onChange={(e) => {
                  setL(e.target.value);
                  setResult(null);
                }}
              />
            </div>
            <div className="field-group">
              <label>Lebar (cm)</label>
              <input
                type="number"
                min={0}
                placeholder="mis. 5"
                value={w}
                onChange={(e) => {
                  setW(e.target.value);
                  setResult(null);
                }}
              />
            </div>
            <div className="field-group">
              <label>Tinggi (cm)</label>
              <input
                type="number"
                min={0}
                placeholder="mis. 4"
                value={bh}
                onChange={(e) => {
                  setBh(e.target.value);
                  setResult(null);
                }}
              />
            </div>
          </div>
        )}

        <button className="calc-btn" onClick={calculate}>
          Hitung Densitas
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="card-title">📊 Hasil Densitas · {result.product}</div>
          <table className="density-table">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Sebelum Pengeringan</th>
                <th>Sesudah Pengeringan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Massa (g)</td>
                <td>{fmt2(result.mb)}</td>
                <td>{fmt2(result.ma)}</td>
              </tr>
              <tr>
                <td>Volume (cm³)</td>
                <td colSpan={2} style={{ color: "var(--glow)" }}>
                  {fmt4(result.volume)}
                </td>
              </tr>
              <tr>
                <td>Densitas (g/cm³)</td>
                <td>{fmt4(result.rhoBefore)}</td>
                <td>{fmt4(result.rhoAfter)}</td>
              </tr>
            </tbody>
          </table>
          <div className="delta-row">
            <div className={`delta-val ${result.deltaRho < 0 ? "neg" : "pos"}`}>
              {result.deltaPct >= 0 ? "+" : ""}
              {fmt2(result.deltaPct)}%
            </div>
            <div className="delta-desc">
              <strong>
                Densitas {result.deltaRho < 0 ? "menurun" : "meningkat"} sebesar{" "}
                {Math.abs(result.deltaPct).toFixed(2)}%
              </strong>
              <br />
              {result.deltaRho < 0
                ? "Kehilangan air mengurangi massa; volume tetap → densitas lebih rendah, kemungkinan porositas lebih tinggi."
                : "Densitas meningkat, kemungkinan akibat penyusutan signifikan saat pengeringan."}
            </div>
          </div>
          <button
            className="log-save-btn"
            onClick={() =>
              onLog({
                type: "density",
                label: "density",
                time: now(),
                data: result,
              })
            }
          >
            + Simpan ke Log Hasil
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BAGIAN C: HASIL EKSPERIMEN ───────────────────────────────────────────
function ExperimentPanel() {
  const [jenis, setJenis] = useState("palette");
  const data = EXP_DATA[jenis];

  const maxWaktu = Math.max(
    ...data.filter((d) => d.waktuBakar).map((d) => d.waktuBakar)
  );
  const maxAbu = Math.max(
    ...data.filter((d) => d.sisaAbu).map((d) => d.sisaAbu)
  );

  // Efisiensi relatif terhadap briquette polos
  const wPolos = data[0].waktuBakar;

  const tagClass = (v) => {
    if (v.includes("Polos")) return "polos";
    if (v.includes("Oli")) return "oli";
    if (v.includes("Minyak")) return "minyak";
    return "kontrol";
  };

  return (
    <div>
      {/* Pilih jenis briquette */}
      <div className="card">
        <div className="card-title">🔬 Data Eksperimen Nyata (Bab IV)</div>
        <div className="info-note">
          Data di bawah adalah hasil pengukuran aktual dari eksperimen
          BACKBURNER sesuai laporan akhir. Kardus Bekas digunakan sebagai{" "}
          <strong>kontrol pembanding</strong> — tidak menghasilkan nyala api
          stabil.
        </div>
        <div className="exp-toggle">
          <button
            className={`exp-btn ${jenis === "palette" ? "active" : ""}`}
            onClick={() => setJenis("palette")}
          >
            Palette
            <br />
            <span style={{ fontSize: 12, letterSpacing: 1 }}>
              19 gram · Silinder
            </span>
          </button>
          <button
            className={`exp-btn ${jenis === "bata" ? "active" : ""}`}
            onClick={() => setJenis("bata")}
          >
            Bata
            <br />
            <span style={{ fontSize: 12, letterSpacing: 1 }}>
              35 gram · Balok
            </span>
          </button>
        </div>

        <table className="exp-table">
          <thead>
            <tr>
              <th>Variasi</th>
              <th>Berat Awal</th>
              <th>Berat Briquette</th>
              <th>Waktu Bakar</th>
              <th>Sisa Abu</th>
              <th>Efisiensi Relatif</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const isKontrol = d.waktuBakar === null;
              const isBest = d.waktuBakar === maxWaktu;
              const eff = d.waktuBakar
                ? ((d.waktuBakar / wPolos) * 100).toFixed(1)
                : "—";
              return (
                <tr key={i} className={isKontrol ? "kontrol" : ""}>
                  <td>
                    <span className={`variasi-tag ${tagClass(d.variasi)}`}>
                      {d.variasi}
                    </span>
                  </td>
                  <td className="num">{d.beratAwal} g</td>
                  <td className="num">{d.beratBriquette} g</td>
                  <td>
                    {d.waktuBakar ? (
                      <div className="bar-inline">
                        <span className={isBest ? "best" : "num"}>
                          {d.waktuBakar} mnt
                        </span>
                        <div className="bar-mini-track">
                          <div
                            className="bar-mini-fill"
                            style={{
                              width: `${(d.waktuBakar / maxWaktu) * 100}%`,
                              background: isBest
                                ? "var(--valid)"
                                : "var(--glow)",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--smoke)" }}>
                        Tidak menyala stabil
                      </span>
                    )}
                  </td>
                  <td>
                    {d.sisaAbu ? (
                      <div className="bar-inline">
                        <span className="num">{d.sisaAbu} g</span>
                        <div className="bar-mini-track">
                          <div
                            className="bar-mini-fill"
                            style={{
                              width: `${(d.sisaAbu / maxAbu) * 100}%`,
                              background: "var(--ember)",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--smoke)" }}>—</span>
                    )}
                  </td>
                  <td className={isBest ? "best" : "num"}>
                    {eff}
                    {d.waktuBakar ? "%" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Efisiensi relatif ringkasan */}
      <div className="card">
        <div className="card-title">📈 Perbandingan Performa</div>
        <div className="info-note">
          Efisiensi relatif dihitung dengan rumus laporan:{" "}
          <strong>
            Efisiensi = (Waktu Bakar Briquette ÷ Waktu Bakar Polos) × 100%
          </strong>
        </div>

        {data
          .filter((d) => d.waktuBakar)
          .map((d, i) => {
            const eff = (d.waktuBakar / wPolos) * 100;
            return (
              <div className="efficiency-row" key={i}>
                <span className="eff-label">
                  <span className={`variasi-tag ${tagClass(d.variasi)}`}>
                    {d.variasi}
                  </span>
                </span>
                <span className="eff-val">{eff.toFixed(1)}</span>
                <span className="eff-unit">% · {d.waktuBakar} menit</span>
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div className="bar-mini-track" style={{ height: 8 }}>
                    <div
                      className="bar-mini-fill"
                      style={{
                        width: `${Math.min(100, eff)}%`,
                        background:
                          eff >= 110
                            ? "var(--valid)"
                            : eff >= 100
                            ? "var(--glow)"
                            : "var(--ember)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Temuan kunci */}
      <div className="card">
        <div className="card-title">💡 Temuan Kunci Pembahasan</div>
        <div className="findings-grid">
          <div className="finding-box">
            <div className="finding-icon">⚖️</div>
            <div className="finding-title">Massa & Waktu Bakar</div>
            <div className="finding-text">
              Bata (35g) terbukti terbakar <strong>lebih lama</strong> dari
              Palette (19g). Jumlah bahan bakar lebih banyak → energi panas
              lebih besar.
            </div>
          </div>
          <div className="finding-box">
            <div className="finding-icon">🛢️</div>
            <div className="finding-title">Pengaruh Minyak</div>
            <div className="finding-text">
              Briquette Minyak memiliki waktu bakar <strong>paling lama</strong>
              . Minyak sayur (trigliserida) terbakar lebih stabil dibanding oli
              bekas.
            </div>
          </div>
          <div className="finding-box">
            <div className="finding-icon">🔥</div>
            <div className="finding-title">Warna Api</div>
            <div className="finding-text">
              Briquette Minyak: <strong>biru → merah-jingga</strong>. Briquette
              Polos & Oli: <strong>merah-jingga</strong> dari awal hingga akhir.
            </div>
          </div>
          <div className="finding-box">
            <div className="finding-icon">🌫️</div>
            <div className="finding-title">Sisa Abu Rendah</div>
            <div className="finding-text">
              Abu hanya 1.4–3.2 g dari 19–35 g bahan. Artinya{" "}
              <strong>sebagian besar material terbakar sempurna</strong> →
              efisiensi pembakaran baik.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOG HASIL ────────────────────────────────────────────────────────────
function LogPanel({ entries, onClear }) {
  return (
    <div className="log-section">
      <div className="log-header">
        <div className="log-title">Log Hasil</div>
        {entries.length > 0 && (
          <button className="log-clear" onClick={onClear}>
            Hapus Semua
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="log-empty">— Belum ada hasil yang disimpan —</div>
      ) : (
        [...entries].reverse().map((e, i) => (
          <div key={i} className={`log-entry ${e.label}`}>
            <div className="log-entry-head">
              {e.time} ·{" "}
              {e.type === "strength"
                ? "Bagian A · Kekuatan"
                : "Bagian B · Densitas"}
            </div>
            {e.type === "strength"
              ? `[${
                  e.data.mode === "palette" ? "Palette 19g" : "Bata 35g"
                }] x=${e.data.x.toFixed(1)}g  y=${e.data.y.toFixed(
                  1
                )}g  z=${e.data.z.toFixed(1)}g  |  S = ${fmt2(
                  e.data.S
                )}  S_norm = ${fmt3(e.data.Snorm)}  |  ${
                  INTEGRITY_LABELS[e.data.tier]
                }`
              : `${e.data.product} · Vol: ${fmt4(
                  e.data.volume
                )} cm³  |  ρ sebelum: ${fmt4(
                  e.data.rhoBefore
                )} g/cm³  ρ sesudah: ${fmt4(e.data.rhoAfter)} g/cm³  |  Δ: ${
                  e.data.deltaPct >= 0 ? "+" : ""
                }${fmt2(e.data.deltaPct)}%`}
          </div>
        ))
      )}
    </div>
  );
}

// ─── DATA SAMPAH INDONESIA (Sumber: SIPSN KLHK 2025, sesuai BAB II laporan) ──
// Jawa Timur = provinsi terbesar (peringkat 1 nasional, sesuai laporan BAB II)
const TIMBULAN_PROVINSI = [
  { provinsi: "Jawa Timur", ton: 6829.4 },
  { provinsi: "Jawa Barat", ton: 5456.2 },
  { provinsi: "Jawa Tengah", ton: 4213.5 },
  { provinsi: "DKI Jakarta", ton: 3862.1 },
  { provinsi: "Sumatera Utara", ton: 2104.4 },
  { provinsi: "Banten", ton: 1876.3 },
  { provinsi: "Sulawesi Selatan", ton: 1203.7 },
  { provinsi: "DI Yogyakarta", ton: 812.4 },
  { provinsi: "Bali", ton: 754.6 },
  { provinsi: "Kalimantan Timur", ton: 643.2 },
];

// Komposisi sesuai diagram lingkaran BAB II laporan (total = 100%)
const KOMPOSISI_SAMPAH = [
  { jenis: "Sisa Makanan", pct: 40.75, color: "#e85d2a" },
  { jenis: "Plastik", pct: 20.57, color: "#ffb347" },
  { jenis: "Kayu/Ranting", pct: 13.21, color: "#a0c4ff" },
  { jenis: "Kertas/Karton", pct: 11.27, color: "#7ec98c" },
  { jenis: "Logam", pct: 3.05, color: "#c9b1ff" },
  { jenis: "Kain", pct: 2.46, color: "#caffbf" },
  { jenis: "Kaca", pct: 2.37, color: "#ffd6a5" },
  { jenis: "Karet/Kulit", pct: 2.06, color: "#f4a261" },
  { jenis: "Lainnya", pct: 6.71, color: "#6b5e52" },
];

// Tren timbulan nasional (ribu ton/hari) — 2025 = 68.599,88 ton/hari sesuai laporan
const TIMBULAN_TAHUNAN = [
  { tahun: 2019, total: 67.8 },
  { tahun: 2020, total: 61.2 },
  { tahun: 2021, total: 64.3 },
  { tahun: 2022, total: 67.1 },
  { tahun: 2023, total: 68.5 },
  { tahun: 2024, total: 68.6 },
  { tahun: 2025, total: 68.6 },
];

// Per kapita — dihitung dari laporan: 68.599.880 kg ÷ 278.000.000 jiwa = 0,25 kg/orang/hari
const RATA_PERKAPITA = [
  { kategori: "Rata-rata nasional (KLHK 2025)", kg: 0.25 },
  {
    kategori: "Rata-rata teoritis per provinsi",
    kg: 0.74,
    note: "≈ 736.440 ton/prov/tahun ÷ 365",
  },
];

// Angka kunci dari laporan BAB II (SIPSN KLHK 2025 & BPS 2023)
const ANGKA_KUNCI = {
  tonPerHari: 68599.88,
  tonPerTahun: 25038955.77,
  tonPerTahunPptJuta: 25.14,
  jumlahProvinsi: 34,
  rataProvinsiTon: 736439.88,
  perkapitaKg: 0.25,
  pctKertasKarton: 11.27,
  pctTerkelola: 34.27,
  pctTidakTerkelola: 65.73,
  penduduk: 278000000,
};

// statistik deskriptif sederhana
function stats(arr) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const sorted = [...arr].sort((a, b) => a - b);
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  return { mean, median, sd, min, max, range, n };
}

// ─── KOMPONEN DATA SAMPAH ─────────────────────────────────────────────────
function WasteDataPanel() {
  const [activeChart, setActiveChart] = useState("komposisi");

  const tonValues = TIMBULAN_PROVINSI.map((d) => d.ton);
  const st = stats(tonValues);
  const maxTon = st.max;
  const tahunVals = TIMBULAN_TAHUNAN.map((d) => d.total);
  const stTahunan = stats(tahunVals);
  const maxTahunan = stTahunan.max;

  return (
    <div>
      {/* ── Konteks & relevansi ── */}
      <div className="card">
        <div className="card-title">
          🗑️ Konteks: Mengapa Data Sampah Penting untuk BACKBURNER?
        </div>
        <div className="formula-box">
          <div className="formula-line">
            Pertanyaan Pemandu Matematika (Statistika Wajib)
          </div>
          <div className="formula-note" style={{ marginTop: 6 }}>
            <strong style={{ color: "var(--char)" }}>1.</strong> Berapa ukuran
            pemusatan &amp; penyebaran timbulan sampah harian per orang dan per
            wilayah?
            <br />
            <strong style={{ color: "var(--char)" }}>2.</strong> Jenis sampah
            mana yang paling berkontribusi? (terutama kertas/kardus — bahan baku
            BACKBURNER)
            <br />
            <strong style={{ color: "var(--char)" }}>3.</strong> Bagaimana
            analisis ini memengaruhi desain solusi STEAM seperti BACKBURNER?
            <br />
            <strong style={{ color: "var(--char)" }}>4.</strong> Apakah program
            pengelolaan sampah berdampak nyata secara statistik?
            <br />
            <br />
            <span style={{ color: "var(--ember)" }}>Sumber data:</span> SIPSN
            KLHK 2025, BPS Statistik Lingkungan Hidup 2023, Jakstranas 2025.
            Data yang ditampilkan adalah data resmi yang dipublikasikan — bukan
            estimasi.
          </div>
        </div>

        {/* Highlight kertas/kardus — angka sesuai BAB II */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))",
            gap: 10,
            marginTop: 16,
          }}
        >
          {[
            {
              icon: "🏭",
              val: "68.599,88 ton/hari",
              label: "Total timbulan nasional 2025 (SIPSN KLHK)",
            },
            {
              icon: "📅",
              val: "25,04–25,14 juta ton",
              label:
                "Total timbulan per tahun 2025 (laporan rinci vs ringkasan PPT)",
            },
            {
              icon: "📄",
              val: "11,27%",
              label: "Komposisi kertas & karton (BAB II)",
            },
            {
              icon: "✅",
              val: "34,27%",
              label: "Sampah terkelola (SIPSN 2025, data PPT)",
            },
            {
              icon: "⚠️",
              val: "65,73%",
              label: "Sampah belum terkelola (SIPSN 2025, data PPT)",
            },
            {
              icon: "👤",
              val: "0,25 kg/hari",
              label: "Timbulan per kapita (68.599.880 kg ÷ 278 juta jiwa)",
            },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                background: "var(--coal)",
                border: "1px solid #3a3028",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 20,
                  color: "var(--ember)",
                  letterSpacing: 1,
                  lineHeight: 1.2,
                }}
              >
                {k.val}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: "var(--smoke)",
                  marginTop: 4,
                  letterSpacing: 1,
                }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Statistik Deskriptif ── */}
      <div className="card">
        <div className="card-title">📐 Ukuran Pemusatan &amp; Penyebaran</div>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--smoke)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Timbulan per Provinsi (ton/hari) — 10 Provinsi Terbesar
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))",
              gap: 8,
            }}
          >
            {[
              {
                label: "Rata-rata (Mean)",
                val: st.mean.toFixed(1) + " ton",
                note: "x̄",
                color: "var(--glow)",
              },
              {
                label: "Median",
                val: st.median.toFixed(1) + " ton",
                note: "Me",
                color: "var(--valid)",
              },
              {
                label: "Std. Deviasi",
                val: st.sd.toFixed(1) + " ton",
                note: "σ",
                color: "var(--mod)",
              },
              {
                label: "Rentang",
                val: st.range.toFixed(1) + " ton",
                note: "R",
                color: "var(--smoke)",
              },
              {
                label: "Minimum",
                val: st.min.toFixed(1) + " ton",
                note: "Min",
                color: "var(--smoke)",
              },
              {
                label: "Maksimum",
                val: st.max.toFixed(1) + " ton",
                note: "Max",
                color: "var(--warn)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--coal)",
                  border: "1px solid #3a3028",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 11,
                    color: s.color,
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  {s.note}
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: 22,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 9,
                    color: "var(--smoke)",
                    marginTop: 4,
                    letterSpacing: 1,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="formula-box" style={{ marginTop: 12 }}>
            <div className="formula-note">
              <strong style={{ color: "var(--char)" }}>Interpretasi:</strong>{" "}
              Mean (x̄ = {st.mean.toFixed(1)} ton) &gt; Median (
              {st.median.toFixed(1)} ton) → data <em>right-skewed</em> (miring
              kanan). Artinya sebagian kecil provinsi (Jawa Barat, Jawa Timur,
              DKI Jakarta) mendominasi timbulan nasional. Std. deviasi σ ={" "}
              {st.sd.toFixed(1)} ton menunjukkan{" "}
              <strong>ketimpangan yang sangat besar</strong> antar provinsi.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--smoke)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Perhitungan Per Kapita (sesuai BAB II laporan)
          </div>
          {/* Perhitungan langkah per langkah sesuai laporan */}
          <div className="formula-box" style={{ marginBottom: 12 }}>
            <div className="formula-line">
              68.599.880 kg ÷ 278.000.000 jiwa ≈{" "}
              <span className="formula-highlight">0,25 kg/orang/hari</span>
            </div>
            <div className="formula-line" style={{ marginTop: 6 }}>
              25.038.955,77 ton ÷ 34 provinsi ≈{" "}
              <span className="formula-highlight">
                736.439,88 ton/provinsi/tahun
              </span>
            </div>
            <div className="formula-note" style={{ marginTop: 6 }}>
              Perhitungan rata-rata per provinsi bersifat teoritis — tidak
              mencerminkan kondisi riil masing-masing daerah karena perbedaan
              jumlah penduduk, urbanisasi, dan aktivitas ekonomi (sesuai
              keterangan BAB II).
            </div>
          </div>
          {RATA_PERKAPITA.map((r) => (
            <div key={r.kategori} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 12,
                    color: "var(--ember)",
                  }}
                >
                  {r.kategori}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 13,
                    color: "var(--glow)",
                    fontWeight: "bold",
                  }}
                >
                  {r.kg} kg/orang/hari
                </span>
              </div>
              {r.note && (
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "var(--smoke)",
                    marginBottom: 4,
                  }}
                >
                  {r.note}
                </div>
              )}
              <div
                style={{
                  height: 8,
                  background: "#3a3028",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(r.kg / 0.74) * 100}%`,
                    background: "var(--ember)",
                    borderRadius: 4,
                    transition: "width .6s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grafik Interaktif ── */}
      <div className="card">
        <div className="card-title">📊 Visualisasi Data</div>

        {/* Tab pilih grafik */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {[
            { key: "komposisi", label: "🗑️ Komposisi Jenis" },
            { key: "provinsi", label: "🗺️ Per Provinsi" },
            { key: "tren", label: "📈 Tren Tahunan" },
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveChart(c.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${
                  activeChart === c.key ? "var(--ember)" : "#3a3028"
                }`,
                background:
                  activeChart === c.key ? "rgba(232,93,42,.15)" : "none",
                color: activeChart === c.key ? "var(--char)" : "var(--smoke)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* CHART 1: Komposisi Jenis Sampah */}
        {activeChart === "komposisi" && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "var(--smoke)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Komposisi Jenis Sampah Indonesia 2023 (%)
            </div>
            {KOMPOSISI_SAMPAH.map((k) => (
              <div key={k.jenis} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: k.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 12,
                        color: k.jenis.includes("Kertas")
                          ? "var(--valid)"
                          : "var(--char)",
                        fontWeight: k.jenis.includes("Kertas")
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {k.jenis}{" "}
                      {k.jenis.includes("Kertas") && "← bahan baku BACKBURNER"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 18,
                      color: k.color,
                      letterSpacing: 1,
                    }}
                  >
                    {k.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: "#3a3028",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(k.pct / 40.75) * 100}%`,
                      background: k.color,
                      borderRadius: 5,
                      transition: "width .6s",
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="formula-box" style={{ marginTop: 14 }}>
              <div className="formula-note">
                <strong style={{ color: "var(--glow)" }}>
                  Relevansi BACKBURNER:
                </strong>{" "}
                Kertas &amp; karton menyumbang <strong>11,27%</strong> dari
                total sampah Indonesia (≈ 25.038.955,77 × 11,27% ≈{" "}
                <strong>2,82 juta ton/tahun</strong>). Ini bahan baku utama
                briquette BACKBURNER. Plastik (20,57%) dan Kayu/Ranting (13,21%)
                lebih besar, namun kertas/karton merupakan yang paling mudah
                diolah menjadi briquette melalui proses basah (pulp).
                Kertas/karton adalah komponen sampah terbesar ke-4 di Indonesia.
              </div>
            </div>
          </div>
        )}

        {/* CHART 2: Per Provinsi */}
        {activeChart === "provinsi" && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "var(--smoke)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              10 Provinsi Timbulan Sampah Terbesar (ton/hari)
            </div>
            {TIMBULAN_PROVINSI.map((p, i) => (
              <div key={p.provinsi} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 12,
                      color:
                        p.provinsi === "DKI Jakarta"
                          ? "var(--ember)"
                          : "var(--char)",
                    }}
                  >
                    {i + 1}. {p.provinsi}{" "}
                    {p.provinsi === "DKI Jakarta" && "← lokasi Labschool"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 18,
                      color: "var(--glow)",
                      letterSpacing: 1,
                    }}
                  >
                    {p.ton.toLocaleString()} ton
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: "#3a3028",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(p.ton / maxTon) * 100}%`,
                      background:
                        p.provinsi === "DKI Jakarta"
                          ? "var(--ember)"
                          : "var(--glow)",
                      borderRadius: 5,
                      transition: "width .6s",
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="formula-box" style={{ marginTop: 14 }}>
              <div className="formula-note">
                <strong style={{ color: "var(--char)" }}>
                  Interpretasi distribusi:
                </strong>{" "}
                Sesuai BAB II laporan,{" "}
                <strong>Jawa Timur menempati peringkat pertama</strong>{" "}
                nasional. Data sangat tidak merata (right-skewed) — 3 provinsi
                teratas (Jatim, Jabar, Jateng) mendominasi lebih dari separuh
                timbulan dari 10 provinsi terbesar ini. DKI Jakarta (3.862
                ton/hari) adalah kota dengan kepadatan timbulan tertinggi per
                km², menjadikannya prioritas utama program pengelolaan seperti
                BACKBURNER.
              </div>
            </div>
          </div>
        )}

        {/* CHART 3: Tren Tahunan */}
        {activeChart === "tren" && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "var(--smoke)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Tren Timbulan Sampah Nasional 2019–2025 (ribu ton/hari)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 140,
                padding: "0 4px",
                marginBottom: 8,
              }}
            >
              {TIMBULAN_TAHUNAN.map((d) => (
                <div
                  key={d.tahun}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 10,
                      color: "var(--glow)",
                    }}
                  >
                    {d.total}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: `${(d.total / maxTahunan) * 110}px`,
                      background:
                        d.tahun === 2020 ? "var(--smoke)" : "var(--ember)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height .5s",
                      position: "relative",
                    }}
                  >
                    {d.tahun === 2020 && (
                      <div
                        style={{
                          position: "absolute",
                          top: -18,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 8,
                          color: "var(--smoke)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Covid-19
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 10,
                      color: "var(--smoke)",
                    }}
                  >
                    {d.tahun}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {[
                {
                  label: "Mean (x̄)",
                  val: stTahunan.mean.toFixed(1) + " rb ton/hari",
                  color: "var(--glow)",
                },
                {
                  label: "Std. Dev (σ)",
                  val: stTahunan.sd.toFixed(2) + " rb ton/hari",
                  color: "var(--mod)",
                },
                {
                  label: "Tren 2019–2025",
                  val: "↑ Naik",
                  color: "var(--warn)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "var(--coal)",
                    border: "1px solid #3a3028",
                    borderRadius: 8,
                    padding: 10,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: 16,
                      color: s.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 9,
                      color: "var(--smoke)",
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="formula-box" style={{ marginTop: 14 }}>
              <div className="formula-note">
                <strong style={{ color: "var(--char)" }}>Interpretasi:</strong>{" "}
                Tren umum meningkat kecuali 2020 (turun akibat Covid-19). Sesuai
                laporan BAB II, total 2025 = <strong>68.599,88 ton/hari</strong>{" "}
                atau <strong>25.038.955,77 ton/tahun</strong>. Mean ={" "}
                {stTahunan.mean.toFixed(1)} rb ton/hari, σ ={" "}
                {stTahunan.sd.toFixed(2)} — menunjukkan relatif stabil pasca
                pandemi. Tren naik ini memperkuat urgensi solusi pengelolaan
                seperti BACKBURNER.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dampak BACKBURNER ── */}
      <div className="card">
        <div className="card-title">
          🔗 Dampak Solusi STEAM: BACKBURNER vs Data
        </div>
        <div className="formula-box">
          <div className="formula-line">
            Apakah program pengelolaan sampah berdampak nyata secara statistik?
          </div>
          <div className="formula-note" style={{ marginTop: 8 }}>
            Dari data BAB IV eksperimen BACKBURNER, sisa abu setelah pembakaran
            hanya <strong>1,4–3,2 g</strong> dari bahan baku 19–35 g. Artinya{" "}
            <strong>efisiensi konversi mencapai 83–92%</strong> (massa
            terkonversi jadi energi panas).
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
            gap: 10,
            marginTop: 16,
          }}
        >
          {[
            {
              icon: "📄",
              title: "Potensi Pengurangan",
              body: "Kertas/karton = 11,27% dari 25.038.955 ton/tahun = ±2,82 juta ton/tahun. Jika 1% saja diolah jadi briquette → ±28.200 ton/tahun dialihkan dari TPA.",
              color: "var(--valid)",
            },
            {
              icon: "🔥",
              title: "Nilai Energi",
              body: "Briquette Minyak: 38,24 menit/35g. Estimasi energi ≈ 14–16 MJ/kg — setara dengan briket batu bara kelas menengah.",
              color: "var(--glow)",
            },
            {
              icon: "🏭",
              title: "Dampak Statistik",
              body: "Perbandingan waktu bakar: Polos < Oli < Minyak (konsisten di kedua ukuran). Pola ini secara statistik mendukung hipotesis bahwa penambahan minyak meningkatkan performa.",
              color: "var(--mod)",
            },
            {
              icon: "🌿",
              title: "Ekonomi Sirkular",
              body: "Limbah → Energi. BACKBURNER menerapkan prinsip circular economy: sampah kertas/kardus yang tidak dapat didaur ulang biasa dapat dijadikan bahan bakar alternatif.",
              color: "var(--ember)",
            },
          ].map((d) => (
            <div
              key={d.title}
              style={{
                background: "var(--coal)",
                border: `1px solid #3a3028`,
                borderLeft: `3px solid ${d.color}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{d.icon}</div>
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 16,
                  letterSpacing: 2,
                  color: d.color,
                  marginBottom: 6,
                }}
              >
                {d.title}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 11,
                  color: "var(--smoke)",
                  lineHeight: 1.7,
                }}
              >
                {d.body}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: "#4a3e35",
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          Sumber: SIPSN KLHK 2025 (68.599,88 ton/hari · 25.038.955,77 ton/tahun)
          · BPS 2023 (278 juta jiwa) · Diagram BAB II Laporan BACKBURNER
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("strength");
  const [log, setLog] = useState([]);

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="logo-flame">🔥</div>
          <div className="logo-title">BACKBURNER</div>
          <div className="logo-sub">
            Bringing Paper Waste Back to the Burner · Analisis Proyek STEAM ·
            SMA Labschool Jakarta 2026
          </div>
        </header>

        <nav className="nav" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <button
            className={`nav-btn ${tab === "strength" ? "active" : ""}`}
            onClick={() => setTab("strength")}
          >
            Bagian A<br />
            Kalkulator Kekuatan
          </button>
          <button
            className={`nav-btn ${tab === "density" ? "active" : ""}`}
            onClick={() => setTab("density")}
          >
            Bagian B<br />
            Kalkulator Densitas
          </button>
          <button
            className={`nav-btn ${tab === "experiment" ? "active" : ""}`}
            onClick={() => setTab("experiment")}
          >
            Bagian C<br />
            Hasil Eksperimen
          </button>
          <button
            className={`nav-btn ${tab === "waste" ? "active" : ""}`}
            onClick={() => setTab("waste")}
          >
            Bagian D<br />
            Data Sampah 🗑️
          </button>
        </nav>

        {tab === "strength" && (
          <StrengthPanel onLog={(e) => setLog((p) => [...p, e])} />
        )}
        {tab === "density" && (
          <DensityPanel onLog={(e) => setLog((p) => [...p, e])} />
        )}
        {tab === "experiment" && <ExperimentPanel />}
        {tab === "waste" && <WasteDataPanel />}

        {(tab === "strength" || tab === "density") && (
          <LogPanel entries={log} onClear={() => setLog([])} />
        )}
      </div>
    </>
  );
}
