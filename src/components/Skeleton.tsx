import { FC, HTMLProps } from "react";

const Skeleton: FC<HTMLProps<HTMLDivElement>> = ({ className, ...others }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-dark-lighten ${className}`}
      {...others}
    ></div>
  );
};

export default Skeleton;
