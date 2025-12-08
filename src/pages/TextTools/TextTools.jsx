import { useMemo, useState } from "react";

const LETTER_REGEX = /[a-zA-ZÀ-ÿ]/g;
const VOWEL_REGEX = /[aeiouáàâãéêíóôõúü]/gi;

function countMatches(text, regex) {
  if (!text) return 0;
  return (text.match(regex) || []).length;
}

export default function TextTools({ title = "Ferramentas de texto" }) {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const base = text || "";
    const letters = countMatches(base, LETTER_REGEX);
    const vowels = countMatches(base, VOWEL_REGEX);
    const consonants = Math.max(letters - vowels, 0);

    return {
      letters,
      vowels,
      consonants,
      charactersWithSpaces: base.length,
      charactersWithoutSpaces: base.replace(/\s/g, "").length,
      words: base.trim() ? base.trim().split(/\s+/).length : 0,
      lines: base === "" ? 0 : base.split(/\r?\n/).length,
    };
  }, [text]);

  const cards = [
    { key: "letters", label: "Letras", value: stats.letters },
    { key: "vowels", label: "Vogais", value: stats.vowels },
    { key: "consonants", label: "Consoantes", value: stats.consonants },
    {
      key: "charactersWithSpaces",
      label: "Caracteres (com espacos)",
      value: stats.charactersWithSpaces,
    },
    {
      key: "charactersWithoutSpaces",
      label: "Caracteres (sem espacos)",
      value: stats.charactersWithoutSpaces,
    },
    { key: "words", label: "Palavras", value: stats.words },
    { key: "lines", label: "Linhas", value: stats.lines },
  ];

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Ferramentas</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Cole ou digite um texto e veja as contagens atualizadas em tempo
            real.
          </p>
        </div>
      </header>

      <div className="form">
        <div className="form__group">
          <label htmlFor="texto">Texto</label>
          <textarea
            id="texto"
            name="texto"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole ou escreva qualquer texto aqui..."
            autoComplete="off"
          />
          <p className="hint">
            Consideramos acentos como letras. Vogais contam para letras; as
            consoantes são a diferenca entre letras e vogais.
          </p>
        </div>

        <div className="form__row">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setText("")}
            disabled={!text}
          >
            Limpar texto
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Contadores</p>
            <h2 className="panel__title">Resumo rapido</h2>
          </div>
        </div>

        <div className="stats-grid">
          {cards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-card__value">
                {card.value.toLocaleString("pt-BR")}
              </div>
              <div className="stat-card__label">{card.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
