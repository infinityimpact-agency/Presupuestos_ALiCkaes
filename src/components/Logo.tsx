type LogoProps = {
  variant?: "app" | "quote";
};

export default function Logo({ variant = "app" }: LogoProps) {
  const className = variant === "quote" ? "logo-img logo-img-quote" : "logo-img logo-img-app";
  const src = variant === "quote" ? "/logo-alicakes-transparent.png" : "/logo-alicakes.png";
  return (
    <img
      className={className}
      src={src}
      alt="AliCakes. Tu idea, convertida en torta"
    />
  );
}
