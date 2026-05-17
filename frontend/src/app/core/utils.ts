export const handleImageError = (event: Event) => {
  const imgElement = event?.target as HTMLImageElement;
  imgElement.src = "assets/no_image_500x500.png";
}

export const computeDiscountPrice = (price: number, discountPercentage: number): number => {
  return price * (1 - discountPercentage / 100);
}