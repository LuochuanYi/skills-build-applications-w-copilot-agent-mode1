import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'success'; items: T[] }
  | { status: 'error'; message: string };

type Props<T> = {
  title: string;
  description: string;
  path: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<Record<string, T[]>>(path)
      .then((payload) => {
        const items = payload[dataKey];
        if (!Array.isArray(items)) throw new Error('Unexpected response format');
        if (active) setState({ status: 'success', items });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
      });
    return () => { active = false; };
  }, [dataKey, path, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && state.items.length === 0 && <p role="status">{emptyMessage}</p>}
        {state.status === 'success' && state.items.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.items.map((item, index) => <li className="list-group-item" key={index}>{renderItem(item)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
