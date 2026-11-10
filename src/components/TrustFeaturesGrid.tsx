import { useContent } from "@/hooks/useContent";
import { iconFor } from "@/lib/icons";

const TrustFeaturesGrid = () => {
  const trustFeatures = useContent().trust.map((t) => ({ icon: iconFor(t.icon), text: t.text }));
  return (
    <section className="trust-features-section">
      <div className="trust-features-grid">
        {trustFeatures.map((feature, index) => (
          <div key={index} className="trust-feature-card">
            <feature.icon className="trust-feature-icon" />
            <span className="trust-feature-text">{feature.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustFeaturesGrid;
