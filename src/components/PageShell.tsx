/**
 * Shared page shell that centers content and scales nicely
 * from mobile → tablet → desktop.
 */
const PageShell = ({
  children,
  className = "",
  noPadBottom = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadBottom?: boolean;
}) => (
  <div
    className={`mx-auto min-h-screen w-full max-w-2xl bg-background ${
      noPadBottom ? "" : "pb-24"
    } ${className}`}
  >
    {children}
  </div>
);

export default PageShell;
