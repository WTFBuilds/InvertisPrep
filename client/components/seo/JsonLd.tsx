/**
 * Renders JSON-LD schemas as <script type="application/ld+json"> tags.
 * Server-component only — place inside a server layout or page.
 */
export default function JsonLd({
  schemas,
}: {
  schemas: Record<string, unknown>[];
}) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" so user-supplied strings can never close the tag early.
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
