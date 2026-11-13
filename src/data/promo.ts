// Limited-time promo for ONE camera: free microSD card + free courier delivery.
// The price stays the same (800 lei). The promo is shown in a pop-up after the
// visitor has spent some time on the page, and is applied in every order form
// whenever 1 camera is ordered while the promo runs.
//
// To run a new promo: change the dates (Chișinău time) and, if needed, the texts.

export const PROMO = {
  id: "2026-11-13_20", // change for a new promo so returning visitors see the pop-up again
  start: new Date("2026-11-13T00:00:00+02:00").getTime(),
  end: new Date("2026-11-21T00:00:00+02:00").getTime(), // runs through 20 November, 23:59
  qty: 1, // the promo is for orders of exactly this many cameras
  giftAddonId: "microsd", // accessory given for free (must exist in content.addons)
  freeDelivery: true, // courier to the door at 0 lei
  popupDelayMs: 25_000, // time the visitor must spend on the page (tab visible)
  datesLabel: "13 – 20 noiembrie",
};

/** True while the promo runs. `?promo=preview` forces it on (for checking the design). */
export const promoActive = (now = Date.now()): boolean => {
  if (promoPreview()) return true;
  return now >= PROMO.start && now < PROMO.end;
};

/** True when an order of `qty` cameras gets the promo right now. */
export const promoFor = (qty: number, now = Date.now()) => promoActive(now) && qty === PROMO.qty;

export const promoPreview = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get("promo") === "preview";
  } catch {
    return false;
  }
};

/** Event asking the order form to select a package (sent by the pop-up button). */
export const SELECT_PACKAGE_EVENT = "luxcam:select-package";
