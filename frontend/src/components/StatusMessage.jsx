export default function StatusMessage({ message, type }) {
  if (!message) {
    return <div className="status-message" />;
  }

  return <div className={`status-message is-visible is-${type}`}>{message}</div>;
}
