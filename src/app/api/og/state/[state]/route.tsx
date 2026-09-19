import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getStateSurveyPreviewData } from "@/lib/state-survey-preview";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ state: string }> }
) {
  const { state: stateSlug } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") === "en" ? "en" : "hi";

  const data = await getStateSurveyPreviewData(stateSlug, locale);

  if (!data) {
    return new Response("State not found", { status: 404 });
  }

  const isHindi = locale === "hi";
  const stateTitle = data.stateNameLocalized;
  const subtitle = isHindi ? "वर्तमान सर्वे स्थिति" : "Current Survey Status";
  const totalResponsesLabel = isHindi ? "कुल प्रतिक्रियाएं" : "Total Responses";
  const partyPrefLabel = isHindi ? "पार्टी पसंद" : "Party Preference";
  const noDataNotice = isHindi
    ? "अभी पर्याप्त सार्वजनिक प्रतिक्रियाएं उपलब्ध नहीं हैं।"
    : "Not enough public responses recorded yet.";
  const brandName = "votersurvey.in";
  const brandTagline = isHindi
    ? "स्वतंत्र एवं निष्पक्ष जनमत सर्वेक्षण"
    : "Independent & Transparent Public Opinion Survey";

  const topParties = data.partyDistribution.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b0f19",
          backgroundImage:
            "radial-gradient(circle at 90% 10%, rgba(255, 87, 34, 0.18), transparent 45%), radial-gradient(circle at 10% 90%, rgba(37, 99, 235, 0.2), transparent 50%)",
          padding: "48px 56px",
          color: "#ffffff",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar: Brand & Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "5px",
                height: "28px",
              }}
            >
              <div style={{ width: "8px", height: "18px", backgroundColor: "#ff5722", borderRadius: "3px" }} />
              <div style={{ width: "8px", height: "28px", backgroundColor: "#10b981", borderRadius: "3px" }} />
              <div style={{ width: "8px", height: "14px", backgroundColor: "#3b82f6", borderRadius: "3px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", color: "#ffffff" }}>
                {brandName}
              </span>
              <span style={{ fontSize: "13px", color: "#94a3b8", marginTop: "-2px" }}>
                {brandTagline}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "999px",
              padding: "8px 18px",
            }}
          >
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "0.5px" }}>
              {isHindi ? "लाइव जनमत सर्वे" : "LIVE PUBLIC SURVEY"}
            </span>
          </div>
        </div>

        {/* Center content: State Heading & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "58px",
                  fontWeight: "900",
                  lineHeight: "1.1",
                  margin: "0",
                  color: "#ffffff",
                  letterSpacing: "-1px",
                }}
              >
                {stateTitle}
              </h1>
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  color: "#ff7a21",
                  margin: "0",
                }}
              >
                — {subtitle}
              </span>
            </div>
            <p style={{ fontSize: "16px", color: "#94a3b8", margin: "8px 0 0 0" }}>
              {isHindi
                ? "राज्य भर के नागरिकों की स्वैच्छिक एवं सत्यापित राय पर आधारित"
                : "Aggregated from verified voluntary responses across the state"}
            </p>
          </div>

          {/* Aggregate Stats Area */}
          {data.hasSufficientData ? (
            <div style={{ display: "flex", gap: "28px", width: "100%", alignItems: "stretch" }}>
              {/* Total Responses Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "20px",
                  padding: "24px 32px",
                  minWidth: "250px",
                }}
              >
                <span style={{ fontSize: "15px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {totalResponsesLabel}
                </span>
                <span style={{ fontSize: "52px", fontWeight: "900", color: "#ffffff", marginTop: "4px", lineHeight: "1" }}>
                  {data.totalResponses.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "13px", color: "#10b981", fontWeight: "600", marginTop: "8px" }}>
                  {isHindi ? "✓ सत्यापित प्रतिक्रियाएं" : "✓ Verified Responses"}
                </span>
              </div>

              {/* Party Preference Breakdown Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "20px",
                  padding: "20px 28px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "15px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {partyPrefLabel}
                  </span>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    {isHindi ? "शीर्ष दल" : "Top Parties"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topParties.map((party, idx) => {
                    const partyName = (isHindi ? party.nameHindi : null) || party.label;
                    const barColor = party.colorHex || (idx === 0 ? "#ff5722" : idx === 1 ? "#3b82f6" : "#10b981");
                    return (
                      <div
                        key={party.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          borderRadius: "12px",
                          padding: "8px 14px",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "4px",
                              backgroundColor: barColor,
                            }}
                          />
                          <span style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>
                            {partyName}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff" }}>
                            {party.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px dashed rgba(255, 255, 255, 0.16)",
                borderRadius: "20px",
                padding: "36px 28px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#f1f5f9", margin: "0" }}>
                {noDataNotice}
              </p>
              <p style={{ fontSize: "16px", color: "#94a3b8", margin: "10px 0 0 0" }}>
                {isHindi
                  ? "सर्वे में भाग लें और अपने विधानसभा क्षेत्र की स्थिति दर्ज कराएं।"
                  : "Participate in the survey and help represent your constituency."}
              </p>
            </div>
          )}
        </div>

        {/* Bottom footer bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "18px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "14px", color: "#94a3b8" }}>
            {isHindi
              ? "स्वैच्छिक ऑनलाइन जनमत सर्वे • यह कोई आधिकारिक चुनाव परिणाम या एग्जिट पोल नहीं है"
              : "Voluntary Public Opinion Survey • Not an official election result or exit poll"}
          </span>
          <span
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: "#ff7a21",
              backgroundColor: "rgba(255, 87, 34, 0.1)",
              border: "1px solid rgba(255, 87, 34, 0.25)",
              borderRadius: "8px",
              padding: "4px 12px",
            }}
          >
            votersurvey.in
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}