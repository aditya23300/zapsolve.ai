document.addEventListener("DOMContentLoaded", () => {
  //coding for hamburger
  // Get the hamburger menu and nav list elements
  const hamburger = document.getElementById("hamburger");
  const navList = document.getElementById("nav-list");

  // Toggle the active class on the nav list when the hamburger is clicked
  hamburger.addEventListener("click", () => {
    navList.classList.toggle("active");
  });
});
