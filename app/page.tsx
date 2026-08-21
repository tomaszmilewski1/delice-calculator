function Dashboard({
  onNavigate,
  email,
}: {
  onNavigate: (panel: ActivePanel) => void;
  email?: string;
}) {
  const [stats, setStats] = useState({
    activeOrdersCount: 0,
    activeOrdersValue: 0,
    recipesCount: 0,
    productsCount: 0,
    clientsCount: 0,
    realizedRevenue: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [ordersRes, recipesRes, productsRes, clientsRes] = await Promise.all([
          supabase.from("orders").select("total_price, status"),
          supabase.from("recipes").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("clients").select("id", { count: "exact", head: true }),
        ]);

        const allOrders = ordersRes.data || [];
        
        const parsePrice = (v: any) => {
          if (!v) return 0;
          const num = typeof v === "number" ? v : Number(String(v).replace(",", "."));
          return Number.isFinite(num) ? num : 0;
        };

        const active = allOrders.filter(
          (o) => o.status === "nowe" || o.status === "w_trakcie"
        );
        const activeVal = active.reduce(
          (sum, o) => sum + parsePrice(o.total_price),
          0
        );
        const realizedVal = allOrders
          .filter((o) => o.status === "zrealizowane")
          .reduce((sum, o) => sum + parsePrice(o.total_price), 0);

        setStats({
          activeOrdersCount: active.length,
          activeOrdersValue: activeVal,
          recipesCount: recipesRes.count || 0,
          productsCount: productsRes.count || 0,
          clientsCount: clientsRes.count || 0,
          realizedRevenue: realizedVal,
          loading: false,
        });
      } catch (e) {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    void loadStats();
  }, []);

  function formatMoney(val: number) {
    if (!Number.isFinite(val)) return "0,00 zł";
    return `${val.toFixed(2).replace(".", ",")} zł`;
  }

  return (
    <section>
      <div style={dashboardWelcomeStyle}>
        <div>
          <div style={dashboardEyebrowStyle}>CENTRUM ZARZĄDZANIA</div>
          <h2 style={dashboardTitleStyle}>Witaj w pracowni Délice</h2>
          <p style={dashboardDescriptionStyle}>
            Bieżące podsumowanie zamówień, wycen, bazy surowców i rentowności.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("new-cake")}
          style={dashboardPrimaryButtonStyle}
        >
          + Nowy tort
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div style={{ ...dashboardCardStyle, borderLeft: "4px solid #8a6d4b" }}>
          <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700 }}>
            ZAMÓWIENIA W TOKU
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#292522", marginTop: 4 }}>
            {stats.loading ? "..." : `${stats.activeOrdersCount} szt.`}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Wartość: {stats.loading ? "..." : formatMoney(stats.activeOrdersValue)}
          </div>
        </div>

        <div style={{ ...dashboardCardStyle, borderLeft: "4px solid #047857" }}>
          <div style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>
            PRZYCHÓD ZE ZREALIZOWANYCH
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#047857", marginTop: 4 }}>
            {stats.loading ? "..." : formatMoney(stats.realizedRevenue)}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Zakończone torty
          </div>
        </div>

        <div style={{ ...dashboardCardStyle, borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700 }}>
            BAZA KLIENTÓW
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#292522", marginTop: 4 }}>
            {stats.loading ? "..." : `${stats.clientsCount} os.`}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Zapisane kontakty
          </div>
        </div>

        <div style={{ ...dashboardCardStyle, borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>
            BAZA RECEPTUR I SKŁADNIKÓW
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#292522", marginTop: 4 }}>
            {stats.loading ? "..." : `${stats.recipesCount} / ${stats.productsCount}`}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Receptury / Produkty
          </div>
        </div>
      </div>

      <div style={dashboardGridStyle}>
        <DashboardCard
          icon="R"
          title="Receptury"
          description={`Zarządzaj ${stats.recipesCount} recepturami i kosztami składników.`}
          action="Otwórz receptury"
          onClick={() => onNavigate("recipes")}
        />

        <DashboardCard
          icon="P"
          title="Produkty"
          description={`Katalog ${stats.productsCount} surowców z aktualnymi cenami.`}
          action="Otwórz produkty"
          onClick={() => onNavigate("products")}
        />

        <DashboardCard
          icon="O"
          title="Zamówienia"
          description={`Obsługuj ${stats.activeOrdersCount} aktywnych zleceń i harmonogram wydań.`}
          action="Zamówienia"
          onClick={() => onNavigate("orders")}
        />

        <DashboardCard
          icon="K"
          title="Klienci"
          description={`Książka ${stats.clientsCount} klientów z preferencjami i alergiami.`}
          action="Klienci"
          onClick={() => onNavigate("clients")}
        />
      </div>

      <div style={quickStartStyle}>
        <div style={quickStartIconStyle}>D</div>
        <div>
          <strong style={quickStartTitleStyle}>Zalogowano jako</strong>
          <p style={quickStartTextStyle}>{email || "Użytkownik"}</p>
        </div>
      </div>
    </section>
  );
}
