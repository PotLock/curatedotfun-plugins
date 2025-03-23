import { ArrowDown } from "lucide-react";
import { Button } from "./ui/button";

interface HeroProps {
  title: string;
  description: string;
}

export default function Hero({ title, description }: HeroProps) {
  return (
    <div className="flex min-h-80 items-center justify-center border border-neutral-300 bg-[url('/bg-hero.jpg')] bg-cover bg-center">
      <div className="text-center flex flex-col items-center justify-center h-full gap-2">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-xl">{description}</p>
        <Button
          variant="ghost"
          className="rounded-full h-10 w-8 cursor-pointer border border-neutral-500"
        >
          <ArrowDown className="h-5 w-5  " />
        </Button>
      </div>
    </div>
  );
}
