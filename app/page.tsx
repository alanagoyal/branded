import Description from "@/components/description";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


export default async function Home() {
  const sections = [
    {
      title: "Startup Names",
      subtitle: `Naming your startup is the first big decision you have to make as a founder. With Branded, go from idea to iconic name in one click and get back to building.`,
      image: "names.gif",
    },
    {
      title: "Domain Availability",
      subtitle: `Secure the perfect domain name for your startup in seconds with our AI-assisted domain availability lookup—purpose-built to help you secure a memorable domain.`,
      image: "domain_availability.png",
    },
    {
      title: "Branded Content",
      subtitle: `Use Branded to generate custom branded content—including logos and one-pagers—for your startup without the headaches.`,
      image: "branded_content.png",
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
          <div className="flex w-full sm:w-2/3 items-center justify-center">
            &quot;I used @alanaagoyal&apos;s AI-based brand generation tool and
            it&apos;s shockingly good.
            <br />
            <br />
            It coined &apos;brainy&apos; and generated this cool logo in a
            couple seconds 😁. Quite the head-start to get your idea into the
            world.&quot;
          </div>
          <div
            className="flex sm:w-1/3 items-center justify-center mx-4 hidden sm:flex"
            style={{ marginTop: "-20px" }}
          >
            <img
              src="brainy.png"
              alt="Brainy"
              className="object-cover w-40 h-40 rounded-md"
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
          &quot;When we started our company we knew we needed a simple,
          memorable name that built trust with our customers. Before Branded,
          we spent hours coming up with names and looking up domain
          availability. With Branded we found alpharun.com with a click, and
          haven&apos;t looked back since.
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
          companies but anyone can use. Branded is a great example of a simple
          idea to help come up with one of the most critical parts of your
          company: its name.
          <br />
          <br />
          Namestorming with AI gives you lots of interesting ideas, and you can
          make a logo and get your domain too!&quot;
        </>
      ),
    },
  ];

  return (
    <div className="w-full pt-10 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl font-extrabold leading-tight">
          Transform your idea into a{" "}
          <span style={{ color: "#BB58BC" }}>billion-dollar brand</span>
        </h1>
        <p className="pt-6 max-w-2xl text-xl">
          Branded helps founders name their startup, secure the domain, and
          brand it—all in one place.
        </p>
        <div className="flex pt-6 space-x-2">
          <Description />
        </div>
        <div className="flex flex-col md:flex-row justify-around items-stretch mt-20">
          {sections.map((section, index) => (
            <Card
              key={index}
              className={`flex flex-col w-full md:w-1/3 shadow-lg rounded-lg ${
                index === 1 ? "md:mx-4 my-2 md:my-0" : "my-4 md:my-0"
              }`}
            >
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-full p-0">
                <p className="text-sm p-4 overflow-hidden">
                  {section.subtitle}
                </p>
                <img
                  src={section.image}
                  alt={section.title}
                  className="mt-4 w-full h-auto rounded-b-md"
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-20 flex justify-center w-full">
          <Carousel className="w-4/5 justify-center">
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
                      <div className="mt-4 text-sm">{customerQuote.quote}</div>
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
