//myself

// export const Typography = {
//   title: 22,
//   subtitle: 16,
//   body: 14,
//   small: 12,
// };

// app/constants/typography.ts
import type { TextStyle } from "react-native";

type TypographyKey = "title" | "subtitle" | "body" | "small";

export const Typography: Record<TypographyKey, TextStyle> = {
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
  },
  small: {
    fontSize: 12,
    fontWeight: "400",
  },
};
