import { useAppBridge } from "@saleor/app-sdk/app-bridge";

export default function CompliancePage() {
  const { appBridgeState } = useAppBridge();

  return (
    <main style={{ padding: 24 }}>
      <h1>Compliance (Apps)</h1>
      <p>Saleor API: {appBridgeState?.saleorApiUrl}</p>
      <p>User token present: {appBridgeState?.token ? "yes" : "no"}</p>
      <p>This page opened via NAVIGATION_CATALOG → APP_PAGE.</p>
    </main>
  );
}
