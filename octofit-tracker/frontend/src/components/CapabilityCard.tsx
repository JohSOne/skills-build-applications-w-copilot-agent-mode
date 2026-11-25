import { useEffect, useState, type ReactNode } from 'react';

type Props<Item> = {
  title: string;
  description: string;
  emptyMessage: string;
  loadItems: () => Promise<Item[]>;
  renderItem: (item: Item) => ReactNode;
};

export function CapabilityCard<Item>({ title, description, emptyMessage, loadItems, renderItem }: Props<Item>) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadItems()
      .then((loadedItems) => {
        if (active) setItems(loadedItems);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      });

    return () => {
      active = false;
    };
  }, [loadItems]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error !== null
      ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : items === null
        ? <p role="status">Loading {title.toLowerCase()}...</p>
        : items.length === 0
          ? <p>{emptyMessage}</p>
          : <ul className="list-group">{items.map((item, index) => <li className="list-group-item" key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
