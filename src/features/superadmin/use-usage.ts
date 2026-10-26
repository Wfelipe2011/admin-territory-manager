"use client";
import { useEffect, useState } from 'react';
import { useResource } from './use-resource';
import { usageQuery, type TenantOption, type Usage, type UsageFilters } from './types';

export function useUsage(initial: UsageFilters) {
  const [filters, setFilters] = useState(initial), [paused, setPaused] = useState(false);
  const [options, setOptions] = useState<TenantOption[]>([]);
  const query = usageQuery(filters);
  const resource = useResource<Usage>(query ? `dashboard/usage?${query}` : null, paused);
  useEffect(() => { if (resource.data) setOptions(resource.data.options); }, [resource.data]);
  const change = (value: UsageFilters) => {
    setFilters(value);
    const params = new URLSearchParams(window.location.search);
    for (const [key, content] of Object.entries(value)) { if (content) params.set(key, content); else params.delete(key); }
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  };
  return { ...resource, filters, change, paused, setPaused, options, invalid: !query };
}
