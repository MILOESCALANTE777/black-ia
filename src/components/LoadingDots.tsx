export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-white font-medium">Analyzing Chart</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-white animate-bounce-dots"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}
