import { useEffect } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Text } from "@saleor/macaw-ui";

const MyComponent = () => {
  const { appBridgeState, appBridge } = useAppBridge();

  useEffect(() => {
    if (!appBridgeState?.ready || !appBridge) return;

    const state = appBridge.getState();

    const productId = "UHJvZHVjdDoxNjA"; // ✅ Relay GID, e.g. "UHJvZHVjdDo1NQ=="
    const saleorApiUrl = state?.saleorApiUrl; // e.g. "http://localhost:8000"
    if (!productId || !saleorApiUrl) return;

    console.log("Widget domain", saleorApiUrl, saleorApiUrl, productId);

    fetch("/api/server-widget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "saleor-domain": saleorApiUrl, // server will APL.get(domain)
        "saleor-api-url": saleorApiUrl, // nice-to-have fallback
      },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => console.log("Sync response:", data))
      .catch((e) => console.error(e));
  }, [appBridgeState?.ready, appBridge]);

  if (!appBridgeState?.ready || !appBridge) {
    return <Text>Loading widget...</Text>;
  }

  return <Text>Ready to sync</Text>;
};

export default MyComponent;
