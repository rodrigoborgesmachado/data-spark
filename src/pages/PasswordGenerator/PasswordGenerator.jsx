import { EmptyState, ErrorState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
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
  const [copyError, setCopyError] = useState("");
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
    try {
      await navigator.clipboard.writeText(password.value);
      setCopiedId(password.id);
      setCopyError("");
    } catch {
      setCopyError("Não foi possível copiar. Selecione a senha e copie manualmente.");
    }
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Defina o tamanho, escolha o tipo de caracteres e gere senhas
            temporarias.
          </>} />

      <Form className="form" onSubmit={handleGenerate}>
        <div className="form__group">
          <label htmlFor="password-length">Tamanho</label>
          <Form.Control
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
              <Form.Check.Input
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
          <Button className="btn" type="submit" disabled={!types.length}>
            Gerar senha
          </Button>
          {!types.length && (
            <span className="hint">Selecione pelo menos uma opcao.</span>
          )}
        </div>
      </Form>

      {copyError && <ErrorState>{copyError}</ErrorState>}
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
                <Button variant="outline-secondary"
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => handleCopy(password)}
                >
                  {copiedId === password.id ? "Copiado" : "Copiar"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>As senhas geradas aparecerão aqui.</EmptyState>
        )}
      </section>
    </section>
  );
}
