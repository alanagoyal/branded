import { Button } from "@/components/ui/button";
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
      subtitle: `"Deel", "Lattice", "Samsara" - we love 'em, but we don't know how to choose them. Namebase helps you go from idea to startup name in one click.`,
    },
    {
      title: "Domain Availability",
      subtitle: `Tired of being stuck with a crappy, unmemorable domain name? Secure the perfect domain name for your startup in seconds with our AI-assisted domain availability lookup.`,
    },
    {
      title: "Branded Content",
      subtitle: `Use Namebase to generate custom branded content - including logos and one-pagers - for your startup without the headaches.`,
    },
  ];

  const customerQuotes = [
    {
      avatar: "paul.jpeg",
      name: "Paul Dornier",
      companyUrl: "https://alpharun.com",
      companyName: "Alpharun",
      role: "Co-Founder",
      quote: (
        <>
          "Using Namebase was a game-changer for my startup. When my brother and
          I decided to start a new company, we didn't want to deal with the
          headaches of coming up with a name or logo - we wanted to focus on
          building a great product for our customers. Thanks to Namebase, we
          could do just that. With a few clicks, we had a great name and logo in
          no time.
          <br />
          <br />
          The process was seamless, and the results were beyond my expectations.
          Highly recommend!"
        </>
      ),
    },
    {
      avatar: "ankur.jpeg",
      name: "Ankur Goyal",
      companyUrl: "https://braintrustdata.com",
      companyName: "Braintrust",
      role: "Founder",
      quote: (
        <>
          "Namebase is the product I wish I had when I was starting my company.
          It's such a challenge to find a good name, and once you do, the domain
          name may not even be available. Namebase solves this and more by
          letting founders generate a name and domain name in one click."
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
          "Startups live and die by their brand identity. When starting Diagram,
          we knew we wanted to build a brand that people loved. Namebase is the
          perfect tool for founders who want to do the same without spending
          days or weeks brainstorming, searching for available domains, and then
          breaking the bank on a professional logo. I'm a huge fan of Namebase
          and will definitely be using it for side projects."
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
        <p className="mt-4 max-w-2xl text-xl">
          Namebase helps founders name their startup, secure the domain, and
          brand it - all in one place.
        </p>
        <div className="flex pt-4">
          <Link href="/new">
            <Button
              className="mt-4 text-lg"
              style={{
                background:
                  "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
                padding: "2px 30px",
              }}
            >
              Get Started
            </Button>
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
                  <div className="p-1">
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
                        <p className="mt-4 text-sm">{customerQuote.quote}</p>
                      </CardContent>
                    </Card>
                  </div>
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
