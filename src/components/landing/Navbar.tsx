"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavigationItem {
  name: string;
  href: string;
}

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    return currentPath === href || (href !== "/" && currentPath.startsWith(href));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: NavigationItem[] = [
    { name: "Courses", href: "/courses" },
    { name: "Live Classes", href: "/live-classes" },
    { name: "Tutors", href: "/tutors" },
    { name: "Community", href: "/community" },
    { name: "About Us", href: "/about-us" },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-white py-4"} border-b border-gray-100 font-sans`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-1 group">
            <Image 
              src="/logo/ed3hub_logo.png" 
              alt="Ed3hub Logo" 
              width={150} 
              height={40} 
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group/link">
                <Link 
                  href={link.href} 
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href) ? "text-[#075985]" : "text-gray-600 hover:text-[#0ea5e9]"
                  }`}
                >
                  {link.name}
                </Link>
                {isActive(link.href) && (
                  <div className="absolute -bottom-[22px] left-0 w-full h-[2px] bg-[#075985]" />
                )}
              </div>
            ))}
          </div>

          {/* Right Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/sign-in" className="text-[#075985] hover:text-[#0ea5e9] text-sm font-semibold transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <button className="bg-[#0077b6] hover:bg-[#0ea5e9] text-white px-6 py-2 rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95">
                Sign Up
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      <div
        className={`md:hidden absolute w-full bg-white border-b transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-[500px] opacity-100 py-6" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col items-center gap-6 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-lg font-medium transition-colors ${
                isActive(link.href) ? "text-[#0ea5e9]" : "text-gray-700 hover:text-[#0ea5e9]"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="w-full flex flex-col gap-4 mt-2">
            <Link href="/sign-in" className="w-full">
              <button className="w-full text-center py-3 border border-gray-200 rounded-xl font-semibold text-[#075985]">
                Sign In
              </button>
            </Link>
            <Link href="/sign-up" className="w-full">
              <button className="w-full bg-[#0077b6] text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-100">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
