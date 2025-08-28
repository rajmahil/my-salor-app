// pages/api/products/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient, gql } from "graphql-request";

// ⬅️ Reuse your project’s APL instance (FileAPL, VercelKVAPL, etc.)
import { apl } from "@/lib/apl"; // make sure this exports an APL instance

const PRODUCT_QUERY = gql/* GraphQL */ `
  query ProductById($id: ID!, $channel: String) {
    product(id: $id, channel: $channel) {
      id
      name
      slug
      description
      media {
        url
        alt
      }
      variants {
        id
        name
        sku
      }
      # Optional channel-aware pricing/availability
      pricing {
        priceRange {
          start {
            gross {
              amount
              currency
            }
          }
          stop {
            gross {
              amount
              currency
            }
          }
        }
      }
      isAvailable
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) Get the Saleor domain from the AppBridge-powered request
    const saleorDomain = (req.headers["saleor-domain"] || req.headers["x-saleor-domain"]) as
      | string
      | undefined;
    if (!saleorDomain) {
      return res.status(400).json({ error: "Missing saleor-domain header" });
    }

    // 2) Get app auth for this domain from APL (token, api URL, appId, etc.)
    const authData = await apl.get(saleorDomain);
    if (!authData) {
      return res.status(401).json({ error: "App is not authenticated for this Saleor domain" });
    }

    const { saleorApiUrl, token } = authData;

    // 3) Resolve the product ID + optional channel
    const id = (req.query.id as string) || (req.body?.id as string);
    const channel = (req.query.channel as string) || (req.body?.channel as string) || null;

    if (!id) {
      return res
        .status(400)
        .json({ error: "Missing product id (Relay ID, e.g. UHJvZHVjdDo1NQ==)" });
    }

    // 4) GraphQL client to Saleor’s /graphql
    const endpoint = new URL("/graphql/", saleorApiUrl).toString();
    const client = new GraphQLClient(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 5) Query the product
    const data = await client.request(PRODUCT_QUERY, { id, channel });

    return res.status(200).json({ ok: true, data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", details: err?.message });
  }
}
