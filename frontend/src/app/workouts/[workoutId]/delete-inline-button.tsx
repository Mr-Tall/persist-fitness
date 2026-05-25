"use client";

type DeleteInlineButtonProps = {
  label?: string;
  confirmMessage: string;
};

export function DeleteInlineButton({
  label = "Delete",
  confirmMessage,
}: DeleteInlineButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
    >
      {label}
    </button>
  );
}