export function Footer() {
  return (
    <footer className="mt-32">
      <div className="page-container py-10 border-t border-border">
        <p className="text-xs text-text-tertiary">
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
