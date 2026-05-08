export const handleImageError = (event: Event) => {
  const imgElement = event?.target as HTMLImageElement;
  imgElement.src = "assets/no_image_500x500.png";
}