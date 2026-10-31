export function Botanical({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "botanical small" : "botanical"}
      viewBox="0 0 600 650"
      role="img"
      aria-label="Illustration of a crop plant with detailed leaf veins"
    >
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#9ebd5e" />
          <stop offset=".45" stopColor="#487b43" />
          <stop offset="1" stopColor="#173f30" />
        </linearGradient>
        <linearGradient id="leaf2">
          <stop stopColor="#244b30" />
          <stop offset=".6" stopColor="#6b9951" />
          <stop offset="1" stopColor="#b5ce77" />
        </linearGradient>
        <radialGradient id="sun">
          <stop stopColor="#edf3d6" />
          <stop offset="1" stopColor="#e3e8d7" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>
      <circle cx="320" cy="280" r="280" fill="url(#sun)" />
      <ellipse
        cx="300"
        cy="578"
        rx="140"
        ry="18"
        fill="#193e2b"
        opacity=".17"
        filter="url(#shadow)"
      />
      <g fill="none" stroke="#49643a" strokeWidth="7" strokeLinecap="round">
        <path d="M290 588Q330 450 299 153" />
        <path d="M309 417Q223 376 183 316M314 332Q389 304 425 224M300 219Q254 184 234 132" />
      </g>
      <g fill="url(#leaf)" stroke="#547746" strokeWidth="1">
        <path d="M305 368C189 386 119 309 102 212C206 211 293 239 305 368Z" />
        <path d="M301 248C212 251 176 178 184 75C266 100 314 155 301 248Z" />
        <path d="M306 478C211 498 156 455 125 390C223 367 285 402 306 478Z" />
      </g>
      <g fill="url(#leaf2)" stroke="#547746">
        <path d="M310 331C308 222 379 133 500 124C487 247 421 322 310 331Z" />
        <path d="M314 432C349 346 423 325 515 344C469 429 405 462 314 432Z" />
        <path d="M297 193C277 115 314 60 367 32C395 107 369 167 297 193Z" />
      </g>
      <g fill="none" stroke="#c4d88c" strokeWidth="1.7" opacity=".65">
        <path d="M303 365Q213 298 107 216M299 246Q248 166 188 79M306 476Q222 418 131 394M312 330Q406 249 496 128M316 432Q412 377 509 347M297 190Q331 114 366 37" />
        <path d="m229 308-12-63m12 63-69-7m39-15-14-54m14 54-65-13m128 61 3-70m-3 70-70 5m184-64 4-78m-4 78 80-5m-49-28 1-73m-1 73 73-11m-18-42 1-53m1 53 53-12m-244-34-7-48m7 48 39-13m-63-20 0-44m0 44 36-10m-9 292-13-43m13 43-53 3m153-26 16-42m-16 42 50 6m-17-24 16-39m-16 39 47 4" />
      </g>
      <g fill="#bed181" opacity=".25">
        <circle cx="203" cy="264" r="3" />
        <circle cx="223" cy="290" r="4" />
        <circle cx="400" cy="219" r="4" />
        <circle cx="426" cy="197" r="3" />
      </g>
    </svg>
  );
}
