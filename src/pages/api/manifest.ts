import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppExtension, AppManifest } from "@saleor/app-sdk/types";

import packageJson from "@/package.json";

import { orderCreatedWebhook } from "./webhooks/order-created";
import { orderFilterShippingMethodsWebhook } from "./webhooks/order-filter-shipping-methods";

/**
 * App SDK helps with the valid Saleor App Manifest creation. Read more:
 * https://github.com/saleor/saleor-app-sdk/blob/main/docs/api-handlers.md#manifest-handler-factory
 */
export default createManifestHandler({
  async manifestFactory({ appBaseUrl, request, schemaVersion }) {
    /**
     * Allow to overwrite default app base url, to enable Docker support.
     *
     * See docs: https://docs.saleor.io/docs/3.x/developer/extending/apps/local-app-development
     */
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;
    const BASE = process.env.APP_URL || "https://31c9a1734314.ngrok-free.app";

    const extensionsForSaleor3_22: AppExtension[] = [
      {
        url: "/api/server-widget",
        permissions: [],
        mount: "PRODUCT_OVERVIEW_CREATE",
        label: "Product Timestamps",
        target: "POPUP",
        // options: {
        //   widgetTarget: {
        //     method: "POST",
        //   },
        // },
      },
      {
        url: "/client-widget",
        permissions: [],
        mount: "PRODUCT_OVERVIEW_CREATE",
        label: "Order widget example",
        target: "POPUP",
        // options: {
        //   widgetTarget: {
        //     method: "GET",
        //   },
        // },
      },
      {
        label: "Sanity Product Sync",
        mount: "PRODUCT_DETAILS_MORE_ACTIONS",
        target: "POPUP",
        permissions: ["MANAGE_PRODUCTS"],
        url: "/widgets/product",
      },
    ];

    const saleorMajor = schemaVersion && schemaVersion[0];
    const saleorMinor = schemaVersion && schemaVersion[1];

    const is3_22 = saleorMajor === 3 && saleorMinor === 22;

    const extensions = is3_22 ? extensionsForSaleor3_22 : [];

    const manifest: AppManifest = {
      name: "Sanity Sync",
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      appUrl: iframeBaseUrl,
      /**
       * Set permissions for app if needed
       * https://docs.saleor.io/docs/3.x/developer/permissions
       */
      permissions: [
        /**
         * Add permission to allow "ORDER_CREATED" / "ORDER_FILTER_SHIPPING_METHODS" webhooks registration.
         *
         * This can be removed
         */
        "MANAGE_ORDERS",
        "MANAGE_SETTINGS", // needed for NAVIGATION_CONFIGURATION tab
        "MANAGE_PRODUCTS", // if you also mount product widgets
      ],
      id: "saleor.app",
      version: packageJson.version,
      /**
       * Configure webhooks here. They will be created in Saleor during installation
       * Read more
       * https://docs.saleor.io/docs/3.x/developer/api-reference/webhooks/objects/webhook
       *
       * Easiest way to create webhook is to use app-sdk
       * https://github.com/saleor/saleor-app-sdk/blob/main/docs/saleor-webhook.md
       */
      webhooks: [
        orderCreatedWebhook.getWebhookManifest(apiBaseURL),
        orderFilterShippingMethodsWebhook.getWebhookManifest(apiBaseURL),
      ],
      /**
       * Optionally, extend Dashboard with custom UIs
       * https://docs.saleor.io/docs/3.x/developer/extending/apps/extending-dashboard-with-apps
       */
      extensions: extensionsForSaleor3_22,

      author: "306 Technologies",
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
    };

    return manifest;
  },
});
