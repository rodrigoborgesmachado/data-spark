import { EmptyState } from "../../components/Feedback";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { CATEGORIES, ROUTES } from "../../routes/config";
import ToolCard from "../../components/ToolCard";
import PageHeader from "../../components/PageHeader";

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const tools = ROUTES.filter((route) => route.path !== "/" && (category === "all" || route.category === category) && normalize(`${route.label} ${route.description} ${route.path} ${CATEGORIES.find((item) => item.key === route.category)?.label}`).includes(normalize(search.trim())));
  return <section className="catalog">
    <PageHeader eyebrow="Explore o Data Spark" title="Menos trabalho. Mais possibilidades." description="Consulte informações, gere dados e simplifique as tarefas do dia a dia. Todas as suas ferramentas, em um só lugar." />
    <div className="catalog-toolbar">
      <InputGroup className="catalog-search">
        <InputGroup.Text><i className="bi bi-search" aria-hidden="true" /></InputGroup.Text>
        <Form.Control type="search" aria-label="Buscar ferramentas" placeholder="Buscar uma ferramenta…" value={search} onChange={(event) => setSearch(event.target.value)} />
      </InputGroup>
      <span className="catalog-count" role="status">{tools.length} ferramentas</span>
    </div>
    <div className="category-filters" role="group" aria-label="Filtrar por categoria">
      {[{ key: "all", label: "Todas", icon: "grid" }, ...CATEGORIES].map((item) => <Button key={item.key} variant="outline-secondary" className={category === item.key ? "is-selected" : ""} aria-pressed={category === item.key} onClick={() => setCategory(item.key)}><i className={`bi bi-${item.icon}`} aria-hidden="true" />{item.label}</Button>)}
    </div>
    {tools.length ? CATEGORIES.map((group) => {
      const items = tools.filter((tool) => tool.category === group.key);
      return items.length ? <section key={group.key} className="catalog-group" aria-labelledby={`category-${group.key}`}>
        <div className="catalog-group__header"><div><h2 id={`category-${group.key}`}>{group.label}<span>{items.length}</span></h2><p>{group.description}</p></div></div>
        <div className="tool-grid">{items.map((tool) => <ToolCard key={tool.path} tool={tool} />)}</div>
      </section> : null;
    }) : <EmptyState title="Nenhuma ferramenta encontrada">Tente outro termo ou categoria. <Button variant="link" onClick={() => { setSearch(""); setCategory("all"); }}>Limpar filtros</Button></EmptyState>}
    <div className="catalog-note"><i className="bi bi-lightning-charge" aria-hidden="true" /><span>Ferramentas simples. Resultados úteis. Sem complicação.</span></div>
  </section>;
}
