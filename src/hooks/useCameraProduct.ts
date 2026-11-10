import { useContent } from "@/hooks/useContent";

// Product summary used by the hero and all order forms.
// Values come from /admin (Product + Photos sections).
export const useCameraProduct = () => {
  const c = useContent();
  return {
    title: c.product.title,
    price: c.product.price,
    compareAtPrice: c.product.oldPrice,
    images: c.gallery,
  };
};

export type CameraProduct = ReturnType<typeof useCameraProduct>;
