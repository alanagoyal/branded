import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "./icons";
import Link from "next/link";

const freePlanDetails = {
  title: "Free",
  price: "$0",
  description: "Free forever",
  link: "https://buy.stripe.com/cN200gaSn0pR9dm6oo",  
  features: [
    "10 name generations",
    "5 domain lookups",
    "5 npm name lookups",
    "3 one-pager generations",
    "1 trademark checks",
    "1 logo generation",
    "AI-assisted support",
  ],
};

const proPlanDetails = {
  title: "Pro",
  price: "$4.99",
  description: "/ month",
  badge: "Popular",
  link: "https://buy.stripe.com/test_4gw5kv7bo4h44Pm144",
  features: [
    "100 name generations",
    "50 domain lookups",
    "50 npm name lookups",
    "25 one-pager generations",
    "5 trademark checks",
    "5 logo generations",
    "Basic email support",
  ],
};

const businessPlanDetails = {
  title: "Business",
  price: "$19.99",
  description: "/ month",
  link: "https://buy.stripe.com/bIY5kA7GbfkLcpy6oq",
  features: [
    "500 name generations",
    "250 domain lookups",
    "250 npm name lookups",
    "100 one-pager generations",
    "25 trademark checks",
    "25 logo generations",
    "Advanced email & phone support",
  ],
};

export default function Pricing() {
  return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Straightforward, affordable pricing</h1>
          <p className="mt-4 text-lg">Find a plan that fits your needs. Start for free, no credit card required.</p>

        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border p-4 shadow-sm rounded-lg">
            <PlanDetails {...freePlanDetails} />
          </Card>
          <Card className="border p-4 shadow-sm rounded-lg relative">
            {proPlanDetails.badge && (
              <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-[#C850C0] px-3 py-1 rounded-full text-sm text-white">
               {proPlanDetails.badge}
              </div>
            )}
            <PlanDetails {...proPlanDetails} buttonColor="bg-[#C850C0]" />
          </Card>
          <Card className="border p-4 shadow-sm rounded-lg">
            <PlanDetails {...businessPlanDetails} buttonColor="" />
          </Card>
        </div>
      </div>
  )
}

interface PlanDetailsProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonColor?: string;
  badge?: string;
  link: string; // Added link property to interface
}

function PlanDetails({ title, price, description, features, buttonColor, link }: PlanDetailsProps) {
  return (
    <>
      <div className="text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-4xl font-bold">{price}</p>
        <p className="text-gray-500">{description}</p>
        <Link href={link}>
        <Button className={`mt-4 ${buttonColor} min-w-[200px]`}>Get started with {title}</Button>
        </Link>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">What&apos;s included:</h3>
        <ul className="mt-2 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-1">
              <Icons.checkmark className="inline-block" /> <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
