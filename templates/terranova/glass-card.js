/* The card is a window onto a refracted duplicate of the background video.
   Every frame the duplicate is re-aligned to the viewport and redrawn, and the
   SVG filter refracts it on composite. */

const DUP_PIXEL_RATIO = 1;

const video = document.getElementById('bg-video');
const container = document.getElementById('dup-video-container');
const canvas = document.getElementById('dup-image');
const card = document.querySelector('[data-glass-card]');

if (video && container && canvas && card) {
  const ctx = canvas.getContext('2d');

  function frame() {
    const rect = card.getBoundingClientRect();

    if (rect.width && rect.height && video.videoWidth && video.videoHeight) {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;

      /* Sizing the duplicate to the viewport rather than to the card is
         deliberate. The filter shifts each colour channel by a different
         amount, so the filtered element's own leading edges show hard
         channel-separation bands. At viewport size those bands fall outside
         the card and only clean refraction shows. */
      container.style.left = `${-rect.left}px`;
      container.style.top = `${-rect.top}px`;
      container.style.width = `${vw}px`;
      container.style.height = `${vh}px`;

      /* The duplicate stays at 1× even on retina: the SVG filter's cost scales
         with pixel count, and what shows through is a soft refraction where 4×
         the filter work buys nothing. */
      const w = Math.round(vw * DUP_PIXEL_RATIO);
      const h = Math.round(vh * DUP_PIXEL_RATIO);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      /* Reproduce object-fit: cover against the video's intrinsic size. */
      const cover = Math.max(vw / video.videoWidth, vh / video.videoHeight);
      const sw = vw / cover;
      const sh = vh / cover;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;

      try {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
      } catch (e) {
        /* a frame may not be decodable yet */
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
