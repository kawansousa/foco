import { FoAvatar } from "@/components/avatar/fo-avatar";

export function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <FoAvatar size={24} animate={false} />
          Foco
        </div>
        <nav className="flex gap-6">
          <a href="#recursos" className="hover:text-foreground">Recursos</a>
          <a href="#trofeus" className="hover:text-foreground">Troféus</a>
          <a href="#fo" className="hover:text-foreground">Fô</a>
        </nav>
        <p>© {new Date().getFullYear()} Foco. Um passo por vez.</p>
      </div>
    </footer>
  );
}
