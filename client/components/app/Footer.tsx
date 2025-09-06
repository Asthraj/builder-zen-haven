export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t bg-background/60">
      <div className="mx-auto max-w-screen-md px-4 py-6 text-center text-sm text-muted-foreground">
        © <span>{new Date().getFullYear()}</span> KrishiAI · Smart Crop Advisor
      </div>
    </footer>
  );
}
