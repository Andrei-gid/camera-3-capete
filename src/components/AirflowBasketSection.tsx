import { useContent } from "@/hooks/useContent";
import { ModuleCloseup } from "@/components/effects/ProductRender";

/** Close-up of the lower PTZ module (image and caption set in /admin → Photos). */
const AirflowBasketSection = () => {
  const { rotationImage, moduleTitle, moduleSubtitle } = useContent().media;
  if (!rotationImage) return null;
  return <ModuleCloseup image={rotationImage} title={moduleTitle} subtitle={moduleSubtitle} />;
};

export default AirflowBasketSection;
