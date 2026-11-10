import { useContent } from "@/hooks/useContent";
import { ProductRenderShowcase } from "@/components/effects/ProductRender";

/** Floating product render with callouts (image set in /admin → Photos). */
const TechnicalSpecsSection = () => {
  const image = useContent().media.specsImage;
  if (!image) return null;
  return <ProductRenderShowcase image={image} />;
};

export default TechnicalSpecsSection;
