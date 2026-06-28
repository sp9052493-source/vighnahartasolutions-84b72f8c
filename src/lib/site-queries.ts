import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings, getSitePage } from "./site.functions";

export function useSiteSettings() {
  const fn = useServerFn(getSiteSettings);
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
}

export function useSitePage(slug: string) {
  const fn = useServerFn(getSitePage);
  return useQuery({
    queryKey: ["site-page", slug],
    queryFn: () => fn({ data: { slug } }),
    staleTime: 60_000,
  });
}
