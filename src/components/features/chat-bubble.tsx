export function ChatBubble({ role, children }: { role: "user" | "ai" | "me"; children: React.ReactNode }) {
  const isUser = role === "user" || role === "me";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
