import { Box } from "@mui/material";
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  FoundersSection,
  CTASection,
  FooterSection,
} from "./landing";

interface HomePageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: HomePageProps) {
  return (
    <Box>
      <HeroSection onGetStarted={onGetStarted} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onGetStarted={onGetStarted} />
      <FoundersSection />
      <CTASection onGetStarted={onGetStarted} />
      <FooterSection />
    </Box>
  );
}
