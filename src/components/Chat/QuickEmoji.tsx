// The default like follows the chat accent; other choices keep their emoji art.
export default function QuickEmoji({ emoji = "👍" }: { emoji?: string }) {
  return emoji === "👍" ? (
    <i className="bx bxs-like text-primary" aria-hidden="true" />
  ) : (
    <span aria-hidden="true">{emoji}</span>
  );
}
