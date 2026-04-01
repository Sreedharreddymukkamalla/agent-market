import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-semibold text-foreground",
  variants: {
    color: {
      violet: "",
      yellow: "",
      blue: "",
      cyan: "",
      green: "",
      pink: "",
      foreground: "",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
    color: "foreground",
  },
});

export const subtitle = tv({
  base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-muted-foreground block max-w-full",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});
