/* =====================================================
   Scroll Menu
   ===================================================== */
let header = document.querySelector("header");
let logo = document.querySelector("header .logo");
let hamburgerMenu = document.querySelectorAll(".hamburger-menu path");
const btnScrolltoTop = document.querySelector(".scroll-to-top");

function scrollMenu() {
  if (document.documentElement.scrollTop > 50) {
    header.classList.add("scroll");
    btnScrolltoTop.classList.add("active");
  } else {
    header.classList.remove("scroll");
    btnScrolltoTop.classList.remove("active");
  }
}

document.addEventListener("scroll", scrollMenu);
btnScrolltoTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // helper functions
  const MathUtils = {
    // map number x from range [a, b] to [c, d]
    map: (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c,
    // linear interpolation
    lerp: (a, b, n) => (1 - n) * a + n * b,
    // Random float
    getRandomFloat: (min, max) =>
      (Math.random() * (max - min) + min).toFixed(2),
  };

  // body element
  const body = document.body;

  // calculate the viewport size
  let winsize;
  const calcWinsize = () =>
    (winsize = { width: window.innerWidth, height: window.innerHeight });
  calcWinsize();
  // and recalculate on resize
  window.addEventListener("resize", calcWinsize);

  // scroll position
  let docScroll;
  // for scroll speed calculation
  let lastScroll;
  let scrollingSpeed = 0;
  // scroll position update function
  const getPageYScroll = () =>
    (docScroll = window.pageYOffset || document.documentElement.scrollTop);
  window.addEventListener("scroll", getPageYScroll);

  // Item
  class Item {
    constructor(el) {
      // the .item element
      this.DOM = { el: el };
      // the inner image
      this.DOM.image = this.DOM.el.querySelector(".image");
      this.renderedStyles = {
        // here we define which property will change as we scroll the page and the item is inside the viewport
        // in this case we will be:
        // - scaling the inner image
        // - translating the item's title
        // we interpolate between the previous and current value to achieve a smooth effect
        imageScale: {
          // interpolated value
          previous: 0,
          // current value
          current: 0,
          // amount to interpolate
          ease: 0.1,
          // current value setter
          setValue: () => {
            const toValue = 1.25;
            const fromValue = 1;
            const val = MathUtils.map(
              this.props.top - docScroll,
              winsize.height,
              -1 * this.props.height,
              fromValue,
              toValue
            );
            return Math.max(Math.min(val, toValue), fromValue);
          },
        },
        titleTranslationY: {
          previous: 0,
          current: 0,
          ease: 0.1,
          fromValue: Number(MathUtils.getRandomFloat(30, 400)),
          setValue: () => {
            const fromValue = this.renderedStyles.titleTranslationY.fromValue;
            const toValue = -1 * fromValue;
            const val = MathUtils.map(
              this.props.top - docScroll,
              winsize.height,
              -1 * this.props.height,
              fromValue,
              toValue
            );
            return fromValue < 0
              ? Math.min(Math.max(val, fromValue), toValue)
              : Math.max(Math.min(val, fromValue), toValue);
          },
        },
      };
      // gets the item's height and top (relative to the document)
      this.getSize();
      // set the initial values
      this.update();
      // use the IntersectionObserver API to check when the element is inside the viewport
      // only then the element styles will be updated
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(
          (entry) => (this.isVisible = entry.intersectionRatio > 0)
        );
      });
      this.observer.observe(this.DOM.el);
      // init/bind events
      this.initEvents();
    }

    update() {
      // sets the initial value (no interpolation)
      for (const key in this.renderedStyles) {
        this.renderedStyles[key].current = this.renderedStyles[key].previous =
          this.renderedStyles[key].setValue();
      }
      // apply changes/styles
      this.layout();
    }

    getSize() {
      const rect = this.DOM.el.getBoundingClientRect();
      this.props = {
        // item's height
        height: rect.height,
        // offset top relative to the document
        top: docScroll + rect.top,
      };
    }

    initEvents() {
      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      // gets the item's height and top (relative to the document)
      this.getSize();
      // on resize reset sizes and update styles
      this.update();
    }

    render() {
      // update the current and interpolated values
      for (const key in this.renderedStyles) {
        this.renderedStyles[key].current = this.renderedStyles[key].setValue();
        this.renderedStyles[key].previous = MathUtils.lerp(
          this.renderedStyles[key].previous,
          this.renderedStyles[key].current,
          this.renderedStyles[key].ease
        );
      }

      // and apply changes
      this.layout();
    }

    layout() {
      // scale the image
      this.DOM.image.style.transform = `scale3d(${this.renderedStyles.imageScale.previous},${this.renderedStyles.imageScale.previous},1)`;
      // translate the title
    }
  }

  /* =====================================================
       SmoothScroll
       ===================================================== */
  let smoothScroll = document.querySelector("div[data-scroll]");

  if (smoothScroll) {
    class SmoothScroll {
      constructor() {
        // the <main> element
        this.DOM = { main: document.querySelector("main") };
        // the scrollable element
        // we translate this element when scrolling (y-axis)
        this.DOM.scrollable = this.DOM.main.querySelector("div[data-scroll]");
        // the items on the page
        this.items = [];
        this.DOM.content = this.DOM.main.querySelector(".content");
        [...this.DOM.content.querySelectorAll(".image-wrapper")].forEach(
          (item) => this.items.push(new Item(item))
        );
        // here we define which property will change as we scroll the page
        // in this case we will be translating on the y-axis
        // we interpolate between the previous and current value to achieve the smooth scrolling effect
        this.renderedStyles = {
          translationY: {
            // interpolated value
            previous: 0,
            // current value
            current: 0,
            // amount to interpolate
            ease: 0.1,
            // current value setter
            // in this case the value of the translation will be the same like the document scroll
            setValue: () => docScroll,
          },
        };
        // set the body's height
        this.setSize();
        // set the initial values
        this.update();
        // the <main> element's style needs to be modified
        this.style();
        // init/bind events
        this.initEvents();
        // start the render loop
        requestAnimationFrame(() => this.render());
      }

      update() {
        // sets the initial value (no interpolation) - translate the scroll value
        for (const key in this.renderedStyles) {
          this.renderedStyles[key].current = this.renderedStyles[key].previous =
            this.renderedStyles[key].setValue();
        }
        // translate the scrollable element
        this.layout();
      }

      layout() {
        this.DOM.scrollable.style.transform = `translate3d(0,${
          -1 * this.renderedStyles.translationY.previous
        }px,0)`;
      }

      setSize() {
        // set the heigh of the body in order to keep the scrollbar on the page
        body.style.height = `${this.DOM.scrollable.scrollHeight}px`;
      }

      style() {
        // the <main> needs to "stick" to the screen and not scroll
        // for that we set it to position fixed and overflow hidden
        this.DOM.main.style.position = "fixed";
        this.DOM.main.style.width = this.DOM.main.style.height = "100%";
        this.DOM.main.style.top = this.DOM.main.style.left = 0;
        this.DOM.main.style.overflow = "hidden";
      }

      initEvents() {
        // on resize reset the body's height
        window.addEventListener("resize", () => this.setSize());
        window.addEventListener("click", () => this.setSize());
      }

      render() {
        // Get scrolling speed
        // Update lastScroll
        scrollingSpeed = Math.abs(docScroll - lastScroll);
        lastScroll = docScroll;

        // update the current and interpolated values
        for (const key in this.renderedStyles) {
          this.renderedStyles[key].current =
            this.renderedStyles[key].setValue();
          this.renderedStyles[key].previous = MathUtils.lerp(
            this.renderedStyles[key].previous,
            this.renderedStyles[key].current,
            this.renderedStyles[key].ease
          );
        }
        // and translate the scrollable element
        this.layout();

        // for every item
        for (const item of this.items) {
          // if the item is inside the viewport call it's render function
          // this will update item's styles, based on the document scroll value and the item's position on the viewport
          if (item.isVisible) {
            if (item.insideViewport) {
              item.render();
            } else {
              item.insideViewport = true;
              item.update();
            }
          } else {
            item.insideViewport = false;
          }
        }

        // loop..
        requestAnimationFrame(() => this.render());
      }
    }

    /***********************************/
    /********** Preload stuff **********/

    // Preload images
    const preloadImages = () => {
      return new Promise((resolve, reject) => {
        imagesLoaded(
          document.querySelectorAll(".slide"),
          { background: true },
          resolve
        );
      });
    };

    // And then..
    preloadImages().then(() => {
      // Remove the loader
      document.body.classList.remove("loading");
      // Get the scroll position and update the lastScroll variable
      getPageYScroll();
      lastScroll = docScroll;
      // Initialize the Smooth Scrolling

      new SmoothScroll();
    });
  }

  /***********************************/
  /********** Preload stuff **********/

  // Preload images
  const preloadImages = () => {
    return new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll(".slide"),
        { background: true },
        resolve
      );
    });
  };

  // And then..
  preloadImages().then(() => {
    // Remove the loader
    document.body.classList.remove("loading");
    // Get the scroll position and update the lastScroll variable
    getPageYScroll();
    lastScroll = docScroll;
    // Initialize the Smooth Scrolling
  });


  
  /* =====================================================
       Text Spilitting Animation
       ===================================================== */
  var textWrapper = document.querySelectorAll('.js-splitted-text');

  textWrapper.forEach(text => {
    text.innerHTML = text.textContent.replace(/./g, "<span>$&</span>");

    const letters = text.querySelectorAll("span")

    letters.forEach((letter, index) => {
      letter.style.animationDelay = `${index * 40}ms`
    })
  })

  /* =====================================================
       Menu Trigger & Image/Text Reveal Effects
       ===================================================== */
  const main = document.querySelector(".main");
  const sections = document.querySelectorAll("section");
  const footer = document.querySelector("footer");

  if (main) {
    document.addEventListener("scroll", () => {

      let currentScrollTop = document.documentElement.scrollTop; // 현재 스크롤바 위치
      sections.forEach((section) => {
        if (currentScrollTop >= section.offsetTop - 800) {
          section.style.opacity = "1";
          section.classList.add("active");
        }
      });

      if (document.documentElement.scrollTop >= footer.offsetTop - 800) {
        footer.style.opacity = "1";
      }

      
      let windowHeight = window.innerHeight; // 스크린 창
      let fullHeight = document.body.scrollHeight; //  margin 값은 포함 x

      if (matchMedia("(min-width: 768px)").matches) {
        if (currentScrollTop + windowHeight >= fullHeight - 100) {
          let footer = document.querySelector("footer");
          footer.style.opacity = "1";
        }
      }

    });

    sections.forEach((section) => {
      if (document.documentElement.scrollTop >= section.offsetTop - 800) {
        section.style.opacity = "1";
      }
    });

  }

  /* =====================================================
       Tab Menu
       ===================================================== */
  const tabMenus = document.querySelectorAll(".tabs li");
  const tabContents = document.querySelectorAll(".tab-content > div");

  const activeSection = (e) => {
    e.stopPropagation();

    let menuIndex = [...tabMenus].indexOf(e.target);

    tabMenus.forEach((menu) => {
      [...tabMenus].indexOf(menu) === menuIndex
        ? menu.classList.add("active")
        : menu.classList.remove("active");
    });

    tabContents.forEach((content) => {
      [...tabContents].indexOf(content) === menuIndex
        ? content.classList.add("active")
        : content.classList.remove("active");
    });
  };

  if (tabMenus) {
    tabMenus.forEach((menu) => {
      [...tabMenus][0].classList.add("active");
      [...tabContents][0].classList.add("active");
      menu.addEventListener("click", activeSection);
    });
  }

  if (matchMedia("screen and (max-width: 767px").matches) {
    if (smoothScroll) {
      smoothScroll.removeAttribute("data-scroll");
    }
  }
});
