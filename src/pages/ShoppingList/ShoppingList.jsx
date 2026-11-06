import { EmptyState, ErrorState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useRef, useState } from "react";
import {
  createItem,
  createList,
  duplicateList,
  finishList,
  formatDate,
  formatMoney,
  formatQuantity,
  getTotals,
  itemTotal,
  normalizeState,
  parseDecimal,
  readState,
  saveState,
  toInputValue,
} from "./shoppingList";

const EMPTY_ITEM = { description: "", quantity: "1", price: "" };

function Totals({ items }) {
  const totals = getTotals(items);
  return (
    <div className="stats-grid shopping-list__totals">
      <div className="stat-card">
        <span className="stat-card__label">No carrinho</span>
        <strong className="stat-card__value">{formatMoney(totals.cart)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-card__label">Total previsto</span>
        <strong className="stat-card__value">{formatMoney(totals.expected)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-card__label">Itens pegos</span>
        <strong className="stat-card__value">{totals.picked}/{items.length}</strong>
      </div>
    </div>
  );
}

function ItemSummary({ item }) {
  return (
    <div className="shopping-list__info">
      <strong className="shopping-list__name">{item.description}</strong>
      <span className="muted">
        {formatQuantity(item.quantity)} × {item.price === null ? "sem valor" : formatMoney(item.price)}
        {item.price !== null && <> = <strong>{formatMoney(itemTotal(item))}</strong></>}
      </span>
    </div>
  );
}

export default function ShoppingList({ title = "Lista de compras" }) {
  const [data, setData] = useState(readState);
  const [listName, setListName] = useState("");
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [editingId, setEditingId] = useState(null);
  const [picking, setPicking] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [err, setErr] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const itemFormRef = useRef(null);
  const importRef = useRef(null);

  const active = data.active;
  const viewing = data.history.find((list) => list.id === viewingId);
  const sortedItems = active ? [...active.items.filter((item) => !item.picked), ...active.items.filter((item) => item.picked)] : [];

  useEffect(() => {
    setSaveFailed(!saveState(data));
  }, [data]);

  function updateActive(update) {
    setData((current) => ({ ...current, active: { ...current.active, ...update(current.active) } }));
  }

  function resetItemForm() {
    setItemForm(EMPTY_ITEM);
    setEditingId(null);
  }

  function handleStart(event) {
    event.preventDefault();
    setData((current) => ({ ...current, active: createList(listName) }));
    setListName("");
    setViewingId(null);
    setErr("");
  }

  function handleItemChange(event) {
    setItemForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSaveItem(event) {
    event.preventDefault();
    const description = itemForm.description.trim();
    const quantity = parseDecimal(itemForm.quantity);
    const price = parseDecimal(itemForm.price);

    if (!description) return setErr("Informe a descrição do item.");
    if (!quantity) return setErr("Informe uma quantidade válida.");
    if (itemForm.price.trim() && price === null) return setErr("Informe um valor válido.");

    updateActive((list) => ({
      items: editingId
        ? list.items.map((item) => item.id === editingId ? { ...item, description, quantity, price } : item)
        : [...list.items, createItem(description, quantity, price)],
    }));
    resetItemForm();
    setErr("");
  }

  function handleEditItem(item) {
    setEditingId(item.id);
    setPicking(null);
    setItemForm({ description: item.description, quantity: toInputValue(item.quantity), price: toInputValue(item.price) });
    itemFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleRemoveItem(id) {
    updateActive((list) => ({ items: list.items.filter((item) => item.id !== id) }));
    if (editingId === id) resetItemForm();
    if (picking?.id === id) setPicking(null);
  }

  function handleConfirmPick(event) {
    event.preventDefault();
    const quantity = parseDecimal(picking.quantity);
    const price = parseDecimal(picking.price);

    if (!quantity) return setErr("Informe uma quantidade válida.");
    if (picking.price.trim() && price === null) return setErr("Informe um valor válido.");

    updateActive((list) => ({
      items: list.items.map((item) => item.id === picking.id ? { ...item, quantity, price, picked: true } : item),
    }));
    setPicking(null);
    setErr("");
  }

  function handleUnpick(id) {
    updateActive((list) => ({ items: list.items.map((item) => item.id === id ? { ...item, picked: false } : item) }));
  }

  function handleFinish() {
    if (!window.confirm("Finalizar a lista? Ela ficará somente leitura no histórico.")) return;
    setData((current) => ({ active: null, history: [finishList(current.active), ...current.history] }));
    resetItemForm();
    setPicking(null);
    setErr("");
  }

  function handleDiscard() {
    if (!window.confirm("Descartar a lista atual? Ela não irá para o histórico.")) return;
    setData((current) => ({ ...current, active: null }));
    resetItemForm();
    setPicking(null);
  }

  function handleDuplicate(list) {
    if (active?.items.length && !window.confirm("Substituir a lista atual pela cópia?")) return;
    setData((current) => ({ ...current, active: duplicateList(list) }));
    setViewingId(null);
    resetItemForm();
    setPicking(null);
  }

  function handleDeleteHistory(id) {
    if (!window.confirm("Excluir esta lista do histórico?")) return;
    setData((current) => ({ ...current, history: current.history.filter((list) => list.id !== id) }));
    if (viewingId === id) setViewingId(null);
  }

  function handleExport() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `lista-de-compras-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = normalizeState(JSON.parse(await file.text()));
      if (!window.confirm("Importar o backup? A lista atual e o histórico serão substituídos.")) return;
      setData(imported);
      setViewingId(null);
      resetItemForm();
      setPicking(null);
      setErr("");
    } catch {
      setErr("Não foi possível ler o arquivo de backup.");
    }
  }

  return (
    <section className="verify shopping-list">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Monte a lista em casa e vá marcando os itens no mercado. Tudo fica
            salvo apenas neste navegador, sem login.
          </>} actions={<>
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={handleExport}>
              Exportar backup
            </Button>
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => importRef.current?.click()}>
              Importar backup
            </Button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
          </>} />

      {saveFailed && <ErrorState>Não foi possível salvar no navegador. Exporte um backup para não perder a lista.</ErrorState>}
      {err && <ErrorState>{err}</ErrorState>}

      {viewing ? (
        <section className="panel" aria-live="polite">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Finalizada em {formatDate(viewing.finishedAt)}</p>
              <h2 className="panel__title">{viewing.name}</h2>
            </div>
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setViewingId(null)}>
              Fechar
            </Button>
          </div>
          <Totals items={viewing.items} />
          {viewing.items.length ? (
            <ul className="shopping-list__items">
              {viewing.items.map((item) => (
                <li key={item.id} className={`shopping-list__item${item.picked ? " is-picked" : ""}`}>
                  <ItemSummary item={item} />
                  {!item.picked && <span className="pill">Não pego</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Esta lista não tem itens.</EmptyState>
          )}
          <div className="form__row">
            <Button className="btn" type="button" onClick={() => handleDuplicate(viewing)}>
              Duplicar como nova
            </Button>
            <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={() => handleDeleteHistory(viewing.id)}>
              Excluir
            </Button>
          </div>
        </section>
      ) : active ? (
        <>
          <Totals items={active.items} />

          <Form className="form" onSubmit={handleSaveItem} ref={itemFormRef}>
            <div className="form__group">
              <label htmlFor="shopping-list-name">Nome da lista</label>
              <Form.Control
                id="shopping-list-name"
                className="input"
                type="text"
                value={active.name}
                onChange={(event) => updateActive(() => ({ name: event.target.value }))}
                autoComplete="off"
              />
            </div>

            <div className="form__group">
              <label htmlFor="shopping-item-description">{editingId ? "Editar item" : "Novo item"}</label>
              <Form.Control
                id="shopping-item-description"
                name="description"
                className="input"
                type="text"
                placeholder="Arroz 5kg"
                value={itemForm.description}
                onChange={handleItemChange}
                autoComplete="off"
              />
            </div>

            <div className="shopping-list__fields">
              <div className="form__group">
                <label htmlFor="shopping-item-quantity">Quantidade</label>
                <Form.Control
                  id="shopping-item-quantity"
                  name="quantity"
                  className="input"
                  type="text"
                  inputMode="decimal"
                  value={itemForm.quantity}
                  onChange={handleItemChange}
                  autoComplete="off"
                />
              </div>
              <div className="form__group">
                <label htmlFor="shopping-item-price">Valor unitário (R$)</label>
                <Form.Control
                  id="shopping-item-price"
                  name="price"
                  className="input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={itemForm.price}
                  onChange={handleItemChange}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form__row">
              <Button className="btn" type="submit">
                {editingId ? "Salvar item" : "Adicionar item"}
              </Button>
              {editingId && (
                <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={resetItemForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </Form>

          <section className="panel" aria-live="polite">
            <div className="panel__head">
              <div>
                <p className="eyebrow">Lista ativa</p>
                <h2 className="panel__title">{active.name || "Lista de compras"}</h2>
              </div>
            </div>

            {sortedItems.length ? (
              <ul className="shopping-list__items">
                {sortedItems.map((item) => (
                  <li key={item.id} className={`shopping-list__item${item.picked ? " is-picked" : ""}`}>
                    {picking?.id === item.id ? (
                      <Form className="shopping-list__pick" onSubmit={handleConfirmPick}>
                        <strong className="shopping-list__name">{item.description}</strong>
                        <div className="shopping-list__fields">
                          <div className="form__group">
                            <label htmlFor="shopping-pick-quantity">Quantidade</label>
                            <Form.Control
                              id="shopping-pick-quantity"
                              className="input"
                              type="text"
                              inputMode="decimal"
                              value={picking.quantity}
                              onChange={(event) => setPicking((current) => ({ ...current, quantity: event.target.value }))}
                              autoComplete="off"
                            />
                          </div>
                          <div className="form__group">
                            <label htmlFor="shopping-pick-price">Valor unitário (R$)</label>
                            <Form.Control
                              id="shopping-pick-price"
                              className="input"
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              value={picking.price}
                              onChange={(event) => setPicking((current) => ({ ...current, price: event.target.value }))}
                              autoComplete="off"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="form__row">
                          <Button className="btn" type="submit">Confirmar</Button>
                          <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setPicking(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <>
                        <ItemSummary item={item} />
                        <div className="form__row">
                          {item.picked ? (
                            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => handleUnpick(item.id)}>
                              Desfazer
                            </Button>
                          ) : (
                            <Button
                              className="btn"
                              type="button"
                              onClick={() => setPicking({ id: item.id, quantity: toInputValue(item.quantity), price: toInputValue(item.price) })}
                            >
                              Peguei
                            </Button>
                          )}
                          <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => handleEditItem(item)}>
                            Editar
                          </Button>
                          <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={() => handleRemoveItem(item.id)}>
                            Remover
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>Adicione os itens que você precisa comprar.</EmptyState>
            )}

            <div className="form__row">
              <Button className="btn" type="button" onClick={handleFinish}>
                Finalizar lista
              </Button>
              <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={handleDiscard}>
                Descartar lista
              </Button>
            </div>
          </section>
        </>
      ) : (
        <Form className="form" onSubmit={handleStart}>
          <div className="form__group">
            <label htmlFor="shopping-new-list">Nome da lista</label>
            <Form.Control
              id="shopping-new-list"
              className="input"
              type="text"
              placeholder={`Mercado – ${new Date().toLocaleDateString("pt-BR").slice(0, 5)}`}
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="form__row">
            <Button className="btn" type="submit">
              Começar lista
            </Button>
          </div>
        </Form>
      )}

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Histórico</p>
            <h2 className="panel__title">Listas finalizadas</h2>
          </div>
        </div>
        {data.history.length ? (
          <ul className="shopping-list__items">
            {data.history.map((list) => (
              <li key={list.id} className="shopping-list__item">
                <div className="shopping-list__info">
                  <strong className="shopping-list__name">{list.name}</strong>
                  <span className="muted">
                    {formatDate(list.finishedAt)} · {list.items.length} {list.items.length === 1 ? "item" : "itens"} · <strong>{formatMoney(list.total)}</strong>
                  </span>
                </div>
                <div className="form__row">
                  <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setViewingId(list.id)}>
                    Abrir
                  </Button>
                  <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => handleDuplicate(list)}>
                    Duplicar
                  </Button>
                  <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={() => handleDeleteHistory(list.id)}>
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhuma lista finalizada">As listas finalizadas aparecerão aqui.</EmptyState>
        )}
      </section>
    </section>
  );
}
