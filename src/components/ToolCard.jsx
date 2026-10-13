import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";

export default function ToolCard({ tool }) {
  return <Card as={Link} to={tool.path} className="tool-card">
    <span className="tool-icon"><i className={`bi bi-${tool.icon}`} aria-hidden="true" /></span>
    <div><h3>{tool.label}</h3><p>{tool.description}</p></div>
    <i className="bi bi-arrow-up-right tool-arrow" aria-hidden="true" />
  </Card>;
}
