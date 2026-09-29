import { useState } from "react";

const PASSWORD_TYPES = {
  numeric: {
    label: "Numeros",
    chars: "0123456789",
  },
  letters: {
    label: "Letras",
    chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  special: {
    label: "Caracteres especiais",
    chars: "!@#$%&*_-+=?/",
  },
};

function randomCharacter(chars) {
  const randomValue = new Uint32Array(1);
  window.crypto.getRandomValues(randomValue);
  return chars[randomValue[0] % chars.length];
}

function generatePassword(length, characterSets) {
  const allCharacters = characterSets.join("");
  const password = characterSets.map(randomCharacter);

  while (password.length < length) {
    password.push(randomCharacter(allCharacters));
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    const target = randomValue[0] % (index + 1);
    [password[index], password[target]] = [password[target], password[index]];
  }

  return password.join("");
}

export default function PasswordGenerator({ title = "Gerador de senhas" }) {
  const [length, setLength] = useState(8);
  const [types, setTypes] = useState(["numeric", "letters"]);
  const [passwords, setPasswords] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  function handleTypeChange(type) {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }

  function handleGenerate(event) {
    event.preventDefault();

    if (!types.length) return;

    const safeLength = Math.max(types.length, Number(length) || 8);
    const password = generatePassword(
      safeLength,
      types.map((type) => PASSWORD_TYPES[type].chars),
    );

    setLength(safeLength);
    setPasswords((current) => [
      {
        id: window.crypto.randomUUID(),
        value: password,
        types,
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
                type="checkbox"
                name="password-type"
                value={key}
                checked={types.includes(key)}
                onChange={() => handleTypeChange(key)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="form__row">
          <button className="btn" type="submit" disabled={!types.length}>
            Gerar senha
          </button>
          {!types.length && (
            <span className="hint">Selecione pelo menos uma opcao.</span>
          )}
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
                    {password.types
                      .map((type) => PASSWORD_TYPES[type].label)
                      .join(" + ")} - {password.length} caracteres
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
