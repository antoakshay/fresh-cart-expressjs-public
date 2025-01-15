const { response } = require("express");

fetch("https://placehold.co/400?text=A\nPlaceholder image&font=opensans").then((response) =>
  console.log(response)
);
