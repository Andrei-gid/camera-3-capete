import type { MouseEvent, ReactNode } from "react";
import { Loader2, Zap } from "lucide-react";
import "./BigOrderButton.css";

type Props = {
  price: number | string;
  sub?: ReactNode;
  label?: string;
  href?: string;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
};

/** Full-width order button with a big price block on the right. */
const BigOrderButton = ({ price, sub = "Plată la livrare · fără avans", label = "Comandă acum", href, type = "button", loading, disabled, className, onClick }: Props) => {
  const inner = (
    <>
      <span className="obtn-l">
        <b>{loading ? <Loader2 className="animate-spin" /> : <Zap />}{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className="obtn-p" aria-label={`${price} lei`}><b>{price}</b><small>lei</small></span>
    </>
  );
  const cls = "obtn" + (className ? " " + className : "");
  return href ? (
    <a className={cls} href={href} onClick={onClick}>{inner}</a>
  ) : (
    <button className={cls} type={type} onClick={onClick} disabled={disabled || loading}>{inner}</button>
  );
};

export default BigOrderButton;
