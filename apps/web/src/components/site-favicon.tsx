import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL, getStoredToken } from '../lib/api';
import { cn } from '../lib/utils';

export function SiteFavicon({ siteId, className }: { siteId: string; className?: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setObjectUrl(null);

    async function load() {
      try {
        const token = getStoredToken();
        const headers = new Headers();
        if (token) headers.set('Authorization', `Bearer ${token}`);

        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/favicon`, { headers });
        if (!response.ok) return;

        const blob = await response.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch {
        // sem favicon disponível — mantém o ícone genérico
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [siteId]);

  if (!objectUrl) {
    return <Globe className={cn('h-4 w-4 text-slate-400 dark:text-zinc-500', className)} />;
  }

  return <img src={objectUrl} alt="" className={cn('h-4 w-4 rounded-sm object-contain', className)} />;
}
