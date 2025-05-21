import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faGithub,
  faTelegram,
} from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./ui/button";
import { useHistory } from "react-router-dom";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Feeds", href: "https://app.curate.fun/feed" },
  { name: "Leaderboard", href: "https://app.curate.fun/leaderboard" },
];

const socials = [
  {
    name: "Twitter",
    icon: faTwitter,
    href: "https://twitter.com/curatedotfun",
  },
  {
    name: "Docs",
    icon: faBook,
    href: "https://docs.curate.fun/",
  },
  {
    name: "GitHub",
    icon: faGithub,
    href: "https://github.com/PotLock/curatedotfun-plugins",
  },
  {
    name: "Telegram",
    icon: faTelegram,
    href: "https://t.me/+UM70lvMnofk3YTVh",
  },
];

export default function Header() {
  const history = useHistory();
  return (
    <div className="flex px-16 py-4 border-b-4 border-black gap-2.5 justify-between items-center w-full">
      {/* Left side: Logo + Navigation */}
      <div className="flex gap-16 items-center">
        <div className="flex gap-2 items-center justify-center">
          <img src="/logo.png" alt="Curate.fun Logo" className="h-8 w-8" />
          <h1 className="text-3xl leading-7">Curate.fun Plugins</h1>
        </div>
        <div className="flex items-center justify-center gap-3">
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

      {/* Right side: Social Icons */}
      <div className="flex items-center gap-5">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="text-black hover:text-blue-500"
          >
            <FontAwesomeIcon icon={social.icon} size="lg" />
          </a>
        ))}
        <Button onClick={() => history.push("/plugin-registry")}>
          Plugin Registry
        </Button>
        <Button onClick={() => history.push("/source-query")}>
          Source Query
        </Button>
      </div>
    </div>
  );
}
