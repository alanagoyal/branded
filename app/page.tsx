import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";

export default async function Home() {
  const sections = [
    {
      title: "Startup Names",
      subtitle: `"Deel", "Lattice", "Samsara"—we love 'em, but we don't know how to choose 'em. Namebase helps you go from idea to startup name in one click.`,
    },
    {
      title: "Domain Availability",
      subtitle: `Tired of being stuck with a crappy, unmemorable domain name? Secure the perfect domain name for your startup in seconds with our AI-assisted domain availability lookup.`,
    },
    {
      title: "Branded Content",
      subtitle: `Use Namebase to generate custom branded content—including logos and one-pagers—for your startup without the headaches.`,
    },
  ];

  const customerQuotes = [
    {
      avatar: "guillermo.jpeg",
      name: "Guillermo Rauch",
      companyUrl: "https://vercel.com",
      companyName: "Vercel",
      role: "Founder",
      quote: (
        <div className="flex flex-row items-stretch">
          <div className="flex w-2/3 items-center justify-center">
            &quot;I used @alanaagoyal&apos;s AI-based brand generation tool and
            it&apos;s shockingly good.
            <br />
            <br />
            It coined &apos;brainy&apos; and generated this cool logo in a
            couple seconds 😁. Quite the head-start to get your idea into the
            world.&quot;
          </div>
          <div
            className="flex w-1/3 items-center justify-center mx-4"
            style={{ marginTop: "-20px" }}
          >
            <img
              src="brainy.png"
              alt="Brainy"
              className="object-cover w-44 h-44 rounded-md"
            />
          </div>
        </div>
      ),
    },
    {
      avatar: "paul.jpeg",
      name: "Paul Dornier",
      companyUrl: "https://alpharun.com",
      companyName: "Alpharun",
      role: "Co-Founder",
      quote: (
        <>
          &quot;Using Namebase was a game-changer for my startup. When my
          brother and I decided to start a new company, we didn&apos;t want to
          deal with the headaches of coming up with a name or logo—we wanted to
          focus on building a great product for our customers. Thanks to
          Namebase, we could do just that. With a few clicks, we had a great
          name and logo in no time.
          <br />
          <br />
          The process was seamless, and the results were beyond my expectations.
          Highly recommend!&quot;
        </>
      ),
    },
    {
      avatar: "jordan.jpeg",
      name: "Jordan Singer",
      companyUrl: "https://diagram.com",
      companyName: "Diagram",
      role: "Founder",
      quote: (
        <>
          &quot;I love how Alana builds tools that not only her portfolio
          companies but anyone can use. Namebase is a great example of a simple
          idea to help come up with one of the most critical parts of your
          company: its name. 
          <br />
          <br />
          Namestorming with AI gives you lots of interesting
          ideas, and you can make a logo and get your domain too!&quot;
        </>
      ),
    },
  ];

  return (
    <div className="w-full pt-10 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl font-extrabold leading-tight">
          Transform your idea into a{" "}
          <span style={{ color: "#C850C0" }}>billion-dollar brand</span>
        </h1>
        <p className="pt-6 max-w-2xl text-xl">
          Namebase helps founders name their startup, secure the domain, and
          brand it—all in one place.
        </p>
        <div className="flex pt-6 space-x-2">
          <Link href="/new">
            <Button
              className="text-lg"
              style={{
                background:
                  "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
                padding: "2px 30px",
              }}
            >
              Get Started
            </Button>
          </Link>
          <Link
            href="https://github.com/alanagoyal/namebase"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost">View on GitHub</Button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row justify-around items-stretch mt-20">
          {sections.map((section, index) => (
            <Card
              key={index}
              className={`flex flex-col w-full md:w-1/3 p-4 shadow-lg rounded-lg ${
                index === 1 ? "md:mx-4 my-4 md:my-0" : "my-4 md:my-0"
              }`}
            >
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{section.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-20 flex justify-center w-full">
          <Carousel className="w-2/3 justify-center">
            <CarouselContent>
              {customerQuotes.map((customerQuote, index) => (
                <CarouselItem key={index}>
                    <Card className="p-4 shadow-lg rounded-lg">
                      <CardContent>
                        <a
                          href={customerQuote.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center"
                        >
                          <img
                            src={customerQuote.avatar}
                            alt="Customer avatar"
                            className="w-16 h-16 rounded-full mr-4"
                          />
                          <div className="flex flex-col">
                            <h3 className="text-xl font-bold">
                              {customerQuote.name}
                            </h3>
                            <p className="text-sm">
                              {customerQuote.role}, {customerQuote.companyName}
                            </p>
                          </div>
                        </a>
                        <div className="mt-4 text-sm">
                          {customerQuote.quote}
                        </div>
                      </CardContent>
                    </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
