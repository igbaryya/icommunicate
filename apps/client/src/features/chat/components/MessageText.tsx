const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

export function MessageText({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
      {text.split(URL_PATTERN).map((part, index) =>
        index % 2 ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}
