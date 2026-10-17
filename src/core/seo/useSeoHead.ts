import { useEffect } from 'react';
import { SEO_META_BY_TAB } from './seo.config';

const BASE_URL = 'https://trustlens.fr';

export function useSeoHead(activeTab: string) {
  useEffect(() => {
    const meta = SEO_META_BY_TAB[activeTab] || SEO_META_BY_TAB.scan;

    document.title = meta.title;

    const updateMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    updateMeta('meta[name="title"]', 'content', meta.title);
    updateMeta('meta[name="description"]', 'content', meta.description);
    updateMeta('meta[property="og:title"]', 'content', meta.title);
    updateMeta('meta[property="og:description"]', 'content', meta.description);
    updateMeta('meta[property="og:url"]', 'content', `${BASE_URL}${meta.canonicalPath}`);
    updateMeta('meta[name="twitter:title"]', 'content', meta.title);
    updateMeta('meta[name="twitter:description"]', 'content', meta.description);
    updateMeta('link[rel="canonical"]', 'href', `${BASE_URL}${meta.canonicalPath}`);

    const url = new URL(window.location.href);
    if (activeTab === 'scan') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);
}
