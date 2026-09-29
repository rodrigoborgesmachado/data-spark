import { useState } from "react";

const PASSWORD_TYPES = {
  numeric: {
    label: "Numeros",
    chars: "0123456789",
  },
  alphanumeric: {
    label: "Alfanumericos",
    chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  },
  special: {
    label: "Caracteres especiais",
    chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_-+=?/",
  },
};

function generatePassword(length, chars) {
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => chars[value % chars.length]).join("");
}

export default function PasswordGenerator({ title = "Gerador de senhas" }) {
  const [length, setLength] = useState(8);
  const [type, setType] = useState("alphanumeric");
  const [passwords, setPasswords] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  function handleGenerate(event) {
    event.preventDefault();

    const safeLength = Math.max(1, Number(length) || 8);
    const password = generatePassword(safeLength, PASSWORD_TYPES[type].chars);

    setLength(safeLength);
    setPasswords((current) => [
      {
        id: window.crypto.randomUUID(),
        value: password,
        type,
        length: safeLength,
      },
      ...current,
    ]);
    setCopiedId(null);
  }

  async function handleCopy(password) {
    await navigator.clipboard.writeText(password.value);
    setCopiedId(password.id);
  }

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Utilidades</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Defina o tamanho, escolha o tipo de caracteres e gere senhas
            temporarias.
          </p>
        </div>
      </header>

      <form className="form" onSubmit={handleGenerate}>
        <div className="form__group">
          <label htmlFor="password-length">Tamanho</label>
          <input
            id="password-length"
            name="password-length"
            className="input"
            type="number"
            min="1"
            value={length}
            onChange={(event) => setLength(event.target.value)}
          />
        </div>

        <fieldset className="password-options">
          <legend>Caracteres</legend>
          {Object.entries(PASSWORD_TYPES).map(([key, option]) => (
            <label key={key} className="password-options__item">
              <input
                type="radio"
                name="password-type"
                value={key}
                checked={type === key}
                onChange={(event) => setType(event.target.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="form__row">
          <button className="btn" type="submit">
            Gerar senha
          </button>
        </div>
      </form>

      <section className="panel" aria-live="polite">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Senhas geradas</p>
            <h2 className="panel__title">Lista temporaria</h2>
          </div>
        </div>

        {passwords.length ? (
          <ul className="password-list">
            {passwords.map((password) => (
              <li key={password.id} className="password-list__item">
                <div>
                  <strong className="password-list__value">{password.value}</strong>
                  <p className="hint">
                    {PASSWORD_TYPES[password.type].label} - {password.length} caracteres
                  </p>
                </div>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => handleCopy(password)}
                >
                  {copiedId === password.id ? "Copiado" : "Copiar"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">As senhas geradas aparecerao aqui.</p>
        )}
      </section>
    </section>
  );
}
