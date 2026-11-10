import { CSSProperties, FC } from "react";

interface SpinnerProps {
  size?: number | string;
  color?: string;
  className?: string;
}

export const Spinner: FC<SpinnerProps> = ({
  size = 35,
  color = "var(--primary-color)",
  className = "",
}) => (
  <span
    role="status"
    aria-label="Loading"
    className={`spinner ${className}`}
    style={{ width: size, height: size, color } as CSSProperties}
  />
);

export const BarWave: FC<{ color?: string }> = ({
  color = "var(--primary-color)",
}) => (
  <span role="status" aria-label="Loading" className="bar-wave" style={{ color }}>
    <span />
    <span />
    <span />
    <span />
  </span>
);
