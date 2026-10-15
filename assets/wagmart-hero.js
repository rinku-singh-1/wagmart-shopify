(() => {
  if (customElements.get('wagmart-hero')) return;

  class WagmartHero extends HTMLElement {
    connectedCallback() {
      if (this.initialized) {
        this.startTimer();
        return;
      }
      this.initialized = true;
      this.slides = Array.from(this.querySelectorAll('[data-wagmart-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-wagmart-dot]'));
      this.pauseButton = this.querySelector('[data-wagmart-pause]');
      this.activeIndex = Math.max(0, this.slides.findIndex((slide) => slide.classList.contains('is-active')));
      this.paused = false;
      this.timer = null;

      this.querySelector('[data-wagmart-previous]')?.addEventListener('click', () => this.show(this.activeIndex - 1, true));
      this.querySelector('[data-wagmart-next]')?.addEventListener('click', () => this.show(this.activeIndex + 1, true));
      this.dots.forEach((dot) => dot.addEventListener('click', () => this.show(Number(dot.dataset.wagmartDot), true)));
      this.pauseButton?.addEventListener('click', () => this.togglePause());

      this.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.show(this.activeIndex - 1, true);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.show(this.activeIndex + 1, true);
        }
      });

      this.addEventListener('pointerdown', (event) => { this.pointerStartX = event.clientX; }, { passive: true });
      this.addEventListener('pointerup', (event) => {
        if (this.pointerStartX === undefined) return;
        const distance = event.clientX - this.pointerStartX;
        if (Math.abs(distance) > 48) this.show(this.activeIndex + (distance < 0 ? 1 : -1), true);
        this.pointerStartX = undefined;
      }, { passive: true });

      this.addEventListener('mouseenter', () => this.stopTimer());
      this.addEventListener('mouseleave', () => this.startTimer());
      this.addEventListener('focusin', () => this.stopTimer());
      this.addEventListener('focusout', (event) => {
        if (!this.contains(event.relatedTarget)) this.startTimer();
      });

      this.startTimer();
    }

    disconnectedCallback() {
      this.stopTimer();
    }

    show(index, restartTimer = false) {
      if (!this.slides?.length) return;
      const nextIndex = (index + this.slides.length) % this.slides.length;
      this.activeIndex = nextIndex;

      this.slides.forEach((slide, slideIndex) => {
        const active = slideIndex === nextIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });

      this.dots.forEach((dot, dotIndex) => {
        const active = dotIndex === nextIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', String(active));
      });

      if (restartTimer) this.startTimer();
    }

    togglePause() {
      this.paused = !this.paused;
      this.pauseButton?.classList.toggle('is-paused', this.paused);
      this.pauseButton?.setAttribute('aria-label', this.paused ? 'Play slideshow' : 'Pause slideshow');
      this.paused ? this.stopTimer() : this.startTimer();
    }

    startTimer() {
      this.stopTimer();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.dataset.autoplay !== 'true' || this.paused || reduceMotion || this.slides?.length < 2) return;
      this.timer = window.setTimeout(() => {
        this.show(this.activeIndex + 1);
        this.startTimer();
      }, Number(this.dataset.autoplayDelay) || 6000);
    }

    stopTimer() {
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  customElements.define('wagmart-hero', WagmartHero);
})();
