const isProduction = process.env.NODE_ENV === "production";

const UnauthenticatedEntitlements = {
  nameGenerations: 0,
  domainLookups: 0,
  npmNameLookups: 0,
  onePagerGenerations: 0,
  trademarkChecks: 0,
  logoGenerations: 0,
  support: "GitHub issues",
};

const ProductionEntitlements = {
  FreePlan: {
    link: "/new",
    nameGenerations: 10,
    domainLookups: 5,
    npmNameLookups: 5,
    onePagerGenerations: 3,
    trademarkChecks: 1,
    logoGenerations: 1,
    support: "GitHub issues",
  },
  ProPlan: {
    link: "/checkout?plan=pro",
    nameGenerations: 100,
    domainLookups: 50,
    npmNameLookups: 50,
    onePagerGenerations: 25,
    trademarkChecks: 5,
    logoGenerations: 5,
    support: "GitHub issues",
  },
  BusinessPlan: {
    link: "/checkout?plan=business",
    nameGenerations: 500,
    domainLookups: 250,
    npmNameLookups: 250,
    onePagerGenerations: 100,
    trademarkChecks: 50,
    logoGenerations: 50,
    support: "GitHub issues",
  },
};

const TestEntitlements = {
  FreePlan: {
    link: "/new",
    nameGenerations: 10,
    domainLookups: 5,
    npmNameLookups: 5,
    onePagerGenerations: 3,
    trademarkChecks: 1,
    logoGenerations: 1,
    support: "GitHub issues",
  },
  ProPlan: {
    link: "/checkout?plan=pro",
    nameGenerations: 100,
    domainLookups: 50,
    npmNameLookups: 50,
    onePagerGenerations: 25,
    trademarkChecks: 5,
    logoGenerations: 5,
    support: "GitHub issues",
  },
  BusinessPlan: {
    link: "/checkout?plan=business",
    nameGenerations: 500,
    domainLookups: 250,
    npmNameLookups: 250,
    onePagerGenerations: 100,
    trademarkChecks: 25,
    logoGenerations: 25,
    support: "GitHub issues",
  },
};

const TestCustomerPortal =
  "https://billing.stripe.com/p/login/test_28odSDbJHg6MfDy144";
const CustomerPortal = "https://billing.stripe.com/p/login/bIY9BZ71t1uu7cscMM";
export const PortalLink = isProduction ? CustomerPortal : TestCustomerPortal;

export const baseUrl = isProduction
  ? "https://www.branded.ai"
  : "http://127.0.0.1:3000";

export const FreePlanEntitlements = isProduction
  ? ProductionEntitlements.FreePlan
  : TestEntitlements.FreePlan;
export const ProPlanEntitlements = isProduction
  ? ProductionEntitlements.ProPlan
  : TestEntitlements.ProPlan;
export const BusinessPlanEntitlements = isProduction
  ? ProductionEntitlements.BusinessPlan
  : TestEntitlements.BusinessPlan;
export { UnauthenticatedEntitlements };
