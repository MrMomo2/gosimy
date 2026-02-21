export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type GtagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, any>;
};

type PurchaseEvent = {
  transactionId: string;
  value: number;
  currency: string;
  tax?: number;
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
    itemCategory?: string;
  }>;
};

type EcommerceEvent = 
  | { type: 'view_item'; item: { itemId: string; itemName: string; price: number; itemCategory?: string } }
  | { type: 'add_to_cart'; item: { itemId: string; itemName: string; price: number; quantity: number; itemCategory?: string } }
  | { type: 'remove_from_cart'; item: { itemId: string; itemName: string; price: number; quantity: number } }
  | { type: 'begin_checkout'; items: Array<{ itemId: string; itemName: string; price: number; quantity: number }>; value: number; currency: string }
  | { type: 'purchase'; data: PurchaseEvent };

export function trackEvent(event: GtagEvent) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.params,
  });
}

export function trackEcommerce(event: EcommerceEvent) {
  if (typeof window === 'undefined' || !window.gtag) return;

  switch (event.type) {
    case 'view_item':
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: event.item.price,
        items: [{
          item_id: event.item.itemId,
          item_name: event.item.itemName,
          price: event.item.price,
          item_category: event.item.itemCategory,
        }],
      });
      break;

    case 'add_to_cart':
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: event.item.price * event.item.quantity,
        items: [{
          item_id: event.item.itemId,
          item_name: event.item.itemName,
          price: event.item.price,
          quantity: event.item.quantity,
          item_category: event.item.itemCategory,
        }],
      });
      break;

    case 'remove_from_cart':
      window.gtag('event', 'remove_from_cart', {
        currency: 'USD',
        value: event.item.price * event.item.quantity,
        items: [{
          item_id: event.item.itemId,
          item_name: event.item.itemName,
          price: event.item.price,
          quantity: event.item.quantity,
        }],
      });
      break;

    case 'begin_checkout':
      window.gtag('event', 'begin_checkout', {
        currency: event.currency,
        value: event.value,
        items: event.items.map(item => ({
          item_id: item.itemId,
          item_name: item.itemName,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      break;

    case 'purchase':
      window.gtag('event', 'purchase', {
        transaction_id: event.data.transactionId,
        value: event.data.value,
        currency: event.data.currency,
        tax: event.data.tax,
        items: event.data.items.map(item => ({
          item_id: item.itemId,
          item_name: item.itemName,
          price: item.price,
          quantity: item.quantity,
          item_category: item.itemCategory,
        })),
      });
      break;
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

export function getGoogleAnalyticsScript(): string | null {
  if (!GA_MEASUREMENT_ID) return null;

  return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
    </script>
  `;
}
