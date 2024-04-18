const isProduction = process.env.NODE_ENV === 'production';

const UnauthenticatedEntitlements = {
  nameGenerations: 3,
  domainLookups: 0,
  npmNameLookups: 0,
  onePagerGenerations: 0,
  trademarkChecks: 0,
  logoGenerations: 0,
  support: "Basic email",
};

const ProductionEntitlements = {
  FreePlan: {
    id: "prod_PvLmfOlOtEttwO",
    link: "https://buy.stripe.com/cN200gaSn0pR9dm6oo",
    nameGenerations: 10,
    domainLookups: 5,
    npmNameLookups: 5,
    onePagerGenerations: 3,
    trademarkChecks: 1,
    logoGenerations: 1,
    support: "AI-assisted",
  },
  ProPlan: {
    id: "prod_PvLmq1eHNyevNA",
    link: "https://buy.stripe.com/3cscN2aSn2xZ89i001",
    nameGenerations: 100,
    domainLookups: 50,
    npmNameLookups: 50,
    onePagerGenerations: 25,
    trademarkChecks: 5,
    logoGenerations: 5,
    support: "Basic email",
  },
  BusinessPlan: {
    id: "prod_PvLnkxRgVJSg8r",
    link: "https://buy.stripe.com/bIY5kA7GbfkLcpy6oq",
    nameGenerations: 500,
    domainLookups: 250,
    npmNameLookups: 250,
    onePagerGenerations: 100,
    trademarkChecks: 50,
    logoGenerations: 50,
    support: "Advanced email & phone",
  }
};

const TestEntitlements = {
  FreePlan: {
    id: "prod_PvM7LGWvLnNuzK",
    link: "https://buy.stripe.com/test_9AQ6oz67kfZMbdK6oq",
    nameGenerations: 10,
    domainLookups: 5,
    npmNameLookups: 5,
    onePagerGenerations: 3,
    trademarkChecks: 1,
    logoGenerations: 1,
    support: "AI-assisted",
  },
  ProPlan: {
    id: "prod_PvtDU3xjPKMZJs",
    link: "https://buy.stripe.com/test_6oE8wHbrE3d0chO289",
    nameGenerations: 100,
    domainLookups: 50,
    npmNameLookups: 50,
    onePagerGenerations: 25,
    trademarkChecks: 5,
    logoGenerations: 5,
    support: "Basic email",
  },
  BusinessPlan: {
    id: "prod_PvtHmSih9tqrAU",
    link: "https://buy.stripe.com/test_fZe3cn7boaFs6Xu5kn",
    nameGenerations: 500,
    domainLookups: 250,
    npmNameLookups: 250,
    onePagerGenerations: 100,
    trademarkChecks: 25,
    logoGenerations: 25,
    support: "Advanced email & phone",
  }
};

const TestCustomerPortal = "https://billing.stripe.com/p/login/test_28odSDbJHg6MfDy144";
const CustomerPortal = "https://billing.stripe.com/p/login/bIY9BZ71t1uu7cscMM";
export const PortalLink = isProduction ? CustomerPortal : TestCustomerPortal;

export const baseUrl = isProduction ? 'https://branded.ai' : 'http://127.0.0.1:3000';

export const FreePlanEntitlements = isProduction ? ProductionEntitlements.FreePlan : TestEntitlements.FreePlan;
export const ProPlanEntitlements = isProduction ? ProductionEntitlements.ProPlan : TestEntitlements.ProPlan;
export const BusinessPlanEntitlements = isProduction ? ProductionEntitlements.BusinessPlan : TestEntitlements.BusinessPlan;
export { UnauthenticatedEntitlements };

