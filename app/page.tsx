export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        color: "#292522",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#8a6d4b",
              marginBottom: "8px",
            }}
          >
            Délice
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: 0,
              fontWeight: 700,
            }}
          >
            Kalkulator tortów
          </h1>

          <p
            style={{
              color: "#716b65",
              fontSize: "17px",
              marginTop: "12px",
            }}
          >
            Zarządzaj recepturami, kosztami i zamówieniami w jednym miejscu.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <DashboardCard
            title="Nowy tort"
            description="Oblicz składniki, koszt i cenę sprzedaży."
          />

          <DashboardCard
            title="Produkty"
            description="Zarządzaj produktami i ich aktualnymi cenami."
          />

          <DashboardCard
            title="Receptury"
            description="Twórz i przeliczaj własne receptury."
          />

          <DashboardCard
            title="Zamówienia"
            description="Kontroluj zamówienia i terminy odbioru."
          />
        </section>

        <section
          style={{
            marginTop: "40px",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            border: "1px solid #e9e2da",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "24px",
            }}
          >
            Podsumowanie
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
            }}
          >
            <Stat title="Zamówienia" value="0" />
            <Stat title="Torty" value="0" />
            <Stat title="Sprzedaż" value="0,00 zł" />
            <Stat title="Zysk" value="0,00 zł" />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "26px",
        minHeight: "150px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "10px",
          fontSize: "21px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#716b65",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#8a6d4b",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "26px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
