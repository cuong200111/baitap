"use client";

import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface PerformanceSettings {
  performance: {
    optimize_images: boolean;
    enable_critical_css: boolean;
    defer_non_critical_js: boolean;
    preload_critical_resources: boolean;
    lazy_load_threshold: number;
  };
  technical: {
    lazy_load_images: boolean;
    minify_html: boolean;
    minify_css: boolean;
    minify_js: boolean;
  };
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

interface LazyComponentProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
}

// Optimized Image Component with WebP support and lazy loading
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);

          // Convert to WebP if optimization is enabled
          if (
            result.data.performance?.optimize_images &&
            !src.includes(".webp")
          ) {
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
            setImgSrc(webpSrc);
          }
          return;
        }
      }

      // If backend call fails, use fallback settings
      throw new Error("Backend not available");
    } catch (error) {
      console.warn(
        "Performance settings not available from backend, using defaults:",
        error.message,
      );
      // Set fallback settings
      setSettings({
        performance: {
          optimize_images: false,
          enable_critical_css: false,
          defer_non_critical_js: false,
          preload_critical_resources: false,
          lazy_load_threshold: 200,
        },
        technical: {
          lazy_load_images: true,
        },
      });
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    // Fallback to original format if WebP fails
    if (imgSrc.includes(".webp")) {
      setImgSrc(src);
    }
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!settings?.performance.optimize_images) return undefined;

    const baseSrc = imgSrc.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    const ext = imgSrc.split(".").pop();

    return `
      ${baseSrc}_480w.${ext} 480w,
      ${baseSrc}_768w.${ext} 768w,
      ${baseSrc}_1024w.${ext} 1024w,
      ${baseSrc}_1920w.${ext} 1920w
    `;
  };

  const shouldLazyLoad = settings?.technical.lazy_load_images && !priority;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && placeholder === "blur" && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(5px)",
          }}
        />
      )}

      {/* Main image */}
      <img
        src={hasError ? src : imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={shouldLazyLoad ? "lazy" : "eager"}
        srcSet={generateSrcSet()}
        sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1920px"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}

// Lazy Loading Component
export function LazyComponent({
  children,
  threshold = 0.1,
  rootMargin = "50px",
  fallback,
}: LazyComponentProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  return (
    <div ref={ref}>
      {isIntersecting
        ? children
        : fallback || <div className="h-48 bg-gray-100 animate-pulse" />}
    </div>
  );
}

// Critical CSS Inliner
export function CriticalCSS() {
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
          return;
        }
      }

      // If backend call fails, use fallback settings
      throw new Error("Backend not available");
    } catch (error) {
      console.warn(
        "Performance settings not available from backend, using defaults:",
        error.message,
      );
      // Set fallback settings
      setSettings({
        performance: {
          enable_critical_css: false,
        },
      });
    }
  };

  useEffect(() => {
    if (!settings?.performance.enable_critical_css) return;

    // Inline critical CSS for above-the-fold content
    const criticalCSS = `
      /* Critical CSS for above-the-fold content */
      .header, .nav, .hero, .above-fold {
        display: block;
      }
      
      /* Optimize font loading */
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: local('Inter'), url('/fonts/inter-v12-latin-regular.woff2') format('woff2');
      }
      
      /* Critical layout styles */
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      /* Loading states */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;

    // Create and inject critical CSS
    const styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.innerHTML = criticalCSS;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [settings]);

  return null;
}

// Script Deferrer for non-critical JavaScript
export function ScriptDeferrer() {
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
          return;
        }
      }

      // If backend call fails, use fallback settings
      throw new Error("Backend not available");
    } catch (error) {
      console.warn(
        "Performance settings not available from backend, using defaults:",
        error.message,
      );
      // Set fallback settings
      setSettings({
        performance: {
          defer_non_critical_js: false,
        },
      });
    }
  };

  useEffect(() => {
    if (!settings?.performance.defer_non_critical_js) return;

    // Defer non-critical scripts
    const deferScript = (src: string, async = true) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = async;
      script.defer = true;
      document.body.appendChild(script);
    };

    // List of non-critical scripts to defer
    const nonCriticalScripts = [
      "/js/chat-widget.js",
      "/js/social-sharing.js",
      "/js/analytics-enhanced.js",
      "/js/marketing-tools.js",
    ];

    // Defer scripts after page load
    window.addEventListener("load", () => {
      setTimeout(() => {
        nonCriticalScripts.forEach((script) => deferScript(script));
      }, 1000);
    });
  }, [settings]);

  return null;
}

// Resource Preloader
export function ResourcePreloader() {
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to fetch from backend server (port 4000)
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/seo/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
          return;
        }
      }

      // If backend call fails, use fallback settings
      throw new Error("Backend not available");
    } catch (error) {
      console.warn(
        "Performance settings not available from backend, using defaults:",
        error.message,
      );
      // Set fallback settings
      setSettings({
        performance: {
          preload_critical_resources: false,
        },
      });
    }
  };

  useEffect(() => {
    if (!settings?.performance.preload_critical_resources) return;

    // Preload critical resources
    const preloadResource = (href: string, as: string, type?: string) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      document.head.appendChild(link);
    };

    // Critical resources to preload
    const criticalResources = [
      {
        href: "/fonts/inter-v12-latin-regular.woff2",
        as: "font",
        type: "font/woff2",
      },
      { href: "/css/critical.css", as: "style" },
      { href: "/images/hero-bg.webp", as: "image" },
      { href: "/images/logo.webp", as: "image" },
    ];

    criticalResources.forEach((resource) => {
      preloadResource(resource.href, resource.as, resource.type);
    });
  }, [settings]);

  return null;
}

// Main Performance Optimizer Component
export default function PerformanceOptimizer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CriticalCSS />
      <ScriptDeferrer />
      <ResourcePreloader />
      {children}
    </>
  );
}
