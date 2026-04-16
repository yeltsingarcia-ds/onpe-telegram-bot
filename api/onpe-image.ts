import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          fontSize: 40,
        }}
      >
        TEST IMAGE OK
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
