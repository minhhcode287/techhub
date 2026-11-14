import React, { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = "TechHub - Hệ Thống Bán Lẻ Công Nghệ & Thuê Máy Ảnh Cao Cấp",
  description = "TechHub cung cấp thiết bị công nghệ chính hãng (Laptop, Smartphone, Audio) và dịch vụ cho thuê máy ảnh, ống kính chuyên nghiệp hàng đầu tại Việt Nam.",
  keywords = "TechHub, mua laptop, mua iphone, thuê máy ảnh, thuê lens sony, canon eos, macbook pro, phụ kiện công nghệ",
  image = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80",
  url = window.location.href,
  type = "website",
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes("TechHub") ? title : `${title} | TechHub`;
    document.title = formattedTitle;

    // Helper to update or create meta tag
    const updateMeta = (nameAttr: "name" | "property", key: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(nameAttr, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Standard Meta Tags
    updateMeta("name", "title", formattedTitle);
    updateMeta("name", "description", description);
    updateMeta("name", "keywords", keywords);

    // 3. Open Graph Tags
    updateMeta("property", "og:title", formattedTitle);
    updateMeta("property", "og:description", description);
    updateMeta("property", "og:image", image);
    updateMeta("property", "og:url", url);
    updateMeta("property", "og:type", type);

    // 4. Twitter Card Tags
    updateMeta("name", "twitter:title", formattedTitle);
    updateMeta("name", "twitter:description", description);
    updateMeta("name", "twitter:image", image);
    updateMeta("name", "twitter:url", url);
    updateMeta("name", "twitter:card", "summary_large_image");

    // 5. Canonical Link
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, keywords, image, url, type]);

  return null;
};

export default SEO;
