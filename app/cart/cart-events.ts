export const openCartModal = () => {
  window.dispatchEvent(new Event("cart:open"));
};
