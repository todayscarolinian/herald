import { Facebook, Globe, Instagram, Mail,Twitter } from "lucide-react";

const socialLinks = [
  { href: "", label: "Website", icon: Globe },
  { href: "https://facebook.com/todayscarolinian", label: "Facebook", icon: Facebook },
  { href: "https://www.instagram.com/todaysusc", label: "Instagram", icon: Instagram },
  { href: "https://x.com/todaysusc", label: "Twitter", icon: Twitter },
  { href: "", label: "Email", icon: Mail }
];

export function Footer() {
  return (
    <footer className="bg-tc_primary-500 py-3 text-tc_white md:py-5">
      <div className="mx-auto flex w-full flex-col items-center gap-3 px-[48px] text-center lg:flex-row lg:justify-between">
        <p className="text-[14px] md:text-lg">
          © 2026 Today&apos;s Carolinian. All Rights Reserved.
        </p>
        <div className="flex items-center gap-[24px] md:gap-[52px]">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="hover:opacity-75 transition-opacity"
            >
              <Icon className="size-4 md:size-6" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
