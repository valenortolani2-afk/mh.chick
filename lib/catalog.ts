export const categories = ["Polainas", "Gorros", "Mitones", "Ponchos"] as const;

export type Category = (typeof categories)[number];

export type ProductImage = {
  category: Category;
  pathname: string;
  uploadedAt: string;
  url: string;
};

export function isCategory(value: string): value is Category {
  return categories.some((category) => category === value);
}
