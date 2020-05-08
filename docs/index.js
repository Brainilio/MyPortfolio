
// Modal opener
const modalProject = () => {
    const modalButton = document.querySelectorAll('#readLink');
    const modalBg = document.querySelector('.modal-bg');
    const modalClose = document.querySelector('.closeModal');

    modalButton.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index == 0) {
                modalBg.classList.add('bg-active');
            }
        })
    })

    modalClose.addEventListener('click', () => {
        modalBg.classList.remove('bg-active');
    })
}


// Navigation
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li')

    // Toggle nav
    burger.addEventListener('click', () => {
        // Add new nav-active class for drawing nav out
        nav.classList.toggle('nav-active');
        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.5}s`
            }
        })
        // Add new burger icon class 
        burger.classList.toggle('toggledBurger');
    })
}




// ParticlesJS Librarys
particlesJS.load('particles-js', 'libs/particles/particles.json', function () {
    console.log('callback - particles.js config loaded')
});


// // Smooth Scroll lib 
// var scroll = new SmoothScroll('a[href*="#"]', {
//     speed: 500
// });




const app = () => {
    navSlide();
    modalProject();

}


// Call main function for all functions
app();