export const handleImageError = (event: Event) => {
  const imgElement = event?.target as HTMLImageElement;
  imgElement.src = "assets/no_image_500x500.png";
}

export const computeDiscountPrice = (price: number, discountPercentage: number): number => {
  return price * (1 - discountPercentage / 100);
}

export const computeVat = (price: number, vatPercentage: number = 22): number => {
  const subtotal = price / (1.0 + vatPercentage / 100);
  return price - subtotal;
}