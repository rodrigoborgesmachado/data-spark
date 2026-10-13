import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

export function ErrorState({ children }) {
  return <Alert variant="danger" role="alert" className="error"><i className="bi bi-exclamation-circle" aria-hidden="true" />{children}</Alert>;
}
export function LoadingState({ children = "Carregando…" }) {
  return <div className="loading-state" role="status"><Spinner size="sm" animation="border" aria-hidden="true" />{children}</div>;
}
export function EmptyState({ children = "Preencha os campos para começar.", title = "Tudo pronto para começar" }) {
  return <div className="empty-state" role="status"><i className="bi bi-inbox" aria-hidden="true" /><div><strong>{title}</strong><p>{children}</p></div></div>;
}
