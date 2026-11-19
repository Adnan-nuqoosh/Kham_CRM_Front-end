export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs normal-case tracking-normal text-red-800/90" role="alert">
      {message}
    </p>
  );
}
