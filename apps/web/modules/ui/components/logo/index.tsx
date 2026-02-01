export const Logo = (props: any) => {
  return (
    <svg viewBox="0 0 697 150" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* University Building Icon - Graduation Cap Top */}
      <path d="M21 35H84L80 43H25L21 35Z" fill="url(#paint2_linear_uni)" />

      {/* Building Columns Base */}
      <path d="M25 47H80V59H25V47Z" fill="url(#paint1_linear_uni)" />

      {/* Column Details */}
      <rect x="28" y="63" width="8" height="41" rx="1" fill="url(#paint1_linear_uni)" />
      <rect x="40" y="63" width="8" height="41" rx="1" fill="url(#paint1_linear_uni)" />
      <rect x="52" y="63" width="8" height="41" rx="1" fill="url(#paint1_linear_uni)" />
      <rect x="64" y="63" width="8" height="41" rx="1" fill="url(#paint1_linear_uni)" />

      {/* Base Foundation */}
      <path d="M21 108H84V119H21V108Z" fill="url(#paint0_linear_uni)" />
      <mask
        id="mask0_uni"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="21"
        y="35"
        width="63"
        height="84">
        <path d="M21 35H84L80 43H25L21 35Z" fill="url(#paint5_linear_uni)" />
        <path d="M25 47H80V59H25V47Z" fill="url(#paint4_linear_uni)" />
        <rect x="28" y="63" width="8" height="41" rx="1" fill="url(#paint4_linear_uni)" />
        <rect x="40" y="63" width="8" height="41" rx="1" fill="url(#paint4_linear_uni)" />
        <rect x="52" y="63" width="8" height="41" rx="1" fill="url(#paint4_linear_uni)" />
        <rect x="64" y="63" width="8" height="41" rx="1" fill="url(#paint4_linear_uni)" />
        <path d="M21 108H84V119H21V108Z" fill="url(#paint3_linear_uni)" />
      </mask>
      <g mask="url(#mask0_uni)">
        <g filter="url(#filter0_d_uni)">
          <mask
            id="mask1_uni"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="21"
            y="35"
            width="63"
            height="84">
            <path d="M21 35H84L80 43H25L21 35Z" fill="black" fillOpacity="0.1" />
            <path d="M25 47H80V59H25V47Z" fill="black" fillOpacity="0.1" />
            <rect x="28" y="63" width="8" height="41" rx="1" fill="black" fillOpacity="0.1" />
            <rect x="40" y="63" width="8" height="41" rx="1" fill="black" fillOpacity="0.1" />
            <rect x="52" y="63" width="8" height="41" rx="1" fill="black" fillOpacity="0.1" />
            <rect x="64" y="63" width="8" height="41" rx="1" fill="black" fillOpacity="0.1" />
            <path d="M21 108H84V119H21V108Z" fill="black" fillOpacity="0.1" />
          </mask>
          <g mask="url(#mask1_uni)">
            <path
              d="M22.3303 13.158C32.2638 3.46307 57.4526 13.158 57.4526 13.158H22.3303C19.8905 15.5391 18.3709 19.09 18.3709 24.2415C18.3709 50.3672 46.6715 59.8676 46.6715 78.0764C46.6715 95.9014 19.5515 106.898 18.4081 131.119H57.4526C57.4526 131.119 18.3709 158.037 18.3709 132.703C18.3709 132.169 18.3835 131.641 18.4081 131.119H1.18848L4.55759 13.158H22.3303Z"
              fill="black"
              fillOpacity="0.1"
            />
          </g>
        </g>
        <g filter="url(#filter1_f_uni)">
          <circle cx="52.5" cy="107.906" r="23.7736" fill="#C8A544" />
        </g>
        <g filter="url(#filter2_f_uni)">
          <circle cx="52.5" cy="47.6793" r="23.7736" fill="#C8A544" />
        </g>
      </g>
      <line x1="123.75" y1="33" x2="123.75" y2="120" stroke="#CBD5E1" strokeWidth="1.5" />

      {/* NUST Forms Builder Text */}
      <text
        x="167"
        y="90"
        fontFamily="Arial, sans-serif"
        fontSize="56"
        fontWeight="700"
        fill="#0F172A"
        letterSpacing="-1">
        NUST Forms Builder
      </text>

      <defs>
        <filter
          id="filter0_d_uni"
          x="19"
          y="23"
          width="60.4526"
          height="108"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="10" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_uni" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_uni" result="shape" />
        </filter>
        <filter
          id="filter1_f_uni"
          x="8.72638"
          y="64.1321"
          width="87.5471"
          height="87.5471"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10" result="effect1_foregroundBlur_uni" />
        </filter>
        <filter
          id="filter2_f_uni"
          x="8.72638"
          y="3.90576"
          width="87.5471"
          height="87.5471"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10" result="effect1_foregroundBlur_uni" />
        </filter>
        <linearGradient
          id="paint0_linear_uni"
          x1="46.4688"
          y1="105.861"
          x2="20.9978"
          y2="105.964"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_uni"
          x1="84.6719"
          y1="76.5407"
          x2="21"
          y2="77.1838"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_uni"
          x1="84.6719"
          y1="47.2199"
          x2="21"
          y2="47.863"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_uni"
          x1="46.4688"
          y1="105.861"
          x2="20.9978"
          y2="105.964"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4E5A8" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_uni"
          x1="84.6719"
          y1="76.5407"
          x2="21"
          y2="77.1838"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4E5A8" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_uni"
          x1="84.6719"
          y1="47.2199"
          x2="21"
          y2="47.863"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4E5A8" />
          <stop offset="1" stopColor="#C8A544" />
        </linearGradient>
      </defs>
    </svg>
  );
};
