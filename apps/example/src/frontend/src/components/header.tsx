const navigation = [
  { name: "Home", href: "/" },
  { name: "Feeds", href: "https://app.curate.fun/feed" },
];

export default function Header() {
  return (
    <div className="flex px-16 py-4 border-b border-neutral-300 gap-2.5 justify-between items-center">
      <div className="flex gap-16 items-center">
        <div className="flex gap-2 items-center justify-center">
          <img src="/logo.png" alt="Curate.fun Logo" className="h-8 w-8 " />
          <h1 className="text-3xl leading-7">Curate.fun Plugins</h1>
        </div>
        <div className="flex items-center justify-center gap-3 ">
          {navigation.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium leading-6 min-w-[64px]"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
