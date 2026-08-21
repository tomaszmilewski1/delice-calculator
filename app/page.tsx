"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Recipes from "../components/Recipes";
import Products from "../components/Products";
import CakeCalculator from "../components/CakeCalculator";
import Orders from "../components/Orders";
import Clients from "../components/Clients";
import Costs from "../components/Costs";

type ActivePanel =
  | "dashboard"
  | "new-cake"
  | "products"
  | "recipes"
  | "orders"
  | "clients"
  | "costs";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activePanel, setActivePanel] = useState<ActivePanel>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);
    setLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");

    if (!email.trim()) {
      setLoginError("Podaj adres e-mail.");
      return;
    }

    if (!password) {
      setLoginError("Podaj hasło.");
      return;
    }

    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError("Nie udało się zalogować. Sprawdź e-mail i hasło.");
      setLoginLoading(false);
      return;
    }

    setLoginLoading(false);
    setActivePanel("dashboard");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActivePanel("dashboard");
  }

  function handleNavigate(panel: ActivePanel) {
    setActivePanel(panel);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPanel() {
    switch (activePanel) {
      case "products":
        return <Products />;
      case "recipes":
        return <Recipes />;
      case "new-cake":
        return <CakeCalculator />;
      case "orders":
        return <Orders />;
      case "clients":
        return <Clients />;
      case "costs":
        return <Costs />;
      case "dashboard":
      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            email={session?.user?.email}
          />
        );
    }
  }

  if (loading) {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <div style={loginLogoStyle}>D</div>
          <strong>Délice</strong>
          <span>Ładowanie aplikacji...</span>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={loginPageStyle}>
        <div style={loginWrapperStyle}>
          <div style={loginBrandStyle}>
            <div style={loginLogoStyle}>D</div>
            <div>
              <div style={loginBrandNameStyle}>Délice</div>
              <div style={loginBrandSubtitleStyle}>Kalkulator tortów</div>
            </div>
          </div>

          <div style={loginCardStyle}>
            <div style={loginHeaderStyle}>
              <div style={loginEyebrowStyle}>PANEL ADMINISTRACYJNY</div>
              <h1 style={loginTitleStyle}>Zaloguj się</h1>
              <p style={loginDescriptionStyle}>
                Zaloguj się, aby korzystać z kalkulatora tortów, receptur i bazy produktów.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <label style={loginLabelStyle}>
                <span style={loginLabelTextStyle}>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="twoj@email.pl"
                  autoComplete="email"
                  disabled={loginLoading}
                  style={loginInputStyle}
                />
              </label>

              <label style={loginLabelStyle}>
                <span style={loginLabelTextStyle}>Hasło</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loginLoading}
                  style={loginInputStyle}
                />
              </label>

              {loginError && <div style={loginErrorStyle}>{loginError}</div>}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  ...loginButtonStyle,
                  opacity: loginLoading ? 0.7 : 1,
                  cursor: loginLoading ? "not-allowed" : "pointer",
                }}
              >
                {loginLoading ? "Logowanie..." : "Zaloguj się"}
              </button>
            </form>
          </div>

          <div style={loginFooterStyle}>Délice by Milewska</div>
        </div>
      </main>
    );
  }

  return (
    <main style={appPageStyle}>
      <style>{`
        @media (max-width: 900px) {
          .delice-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 0 0 25px rgba(0,0,0,0.15);
          }
          .delice-sidebar.mobile-open {
            transform: translateX(0);
          }
          .delice-mobile-toggle {
            display: flex !important;
          }
          .delice-content-container {
            padding: 16px !important;
          }
          .delice-backdrop {
            display: block !important;
          }
        }
        @media (min-width: 901px) {
          .delice-sidebar {
            transform: none !important;
          }
          .delice-mobile-toggle {
            display: none !important;
          }
          .delice-backdrop {
            display: none !important;
          }
        }
      `}</style>

      {/* Tło przyciemniające przy otwartym menu na smartfonie */}
      {isMobileMenuOpen && (
        <div
          className="delice-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
        />
      )}

      <div style={appShellStyle}>
        <aside
          className={`delice-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}
          style={sidebarStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={brandStyle}>
              <div style={brandLogoStyle}>D</div>
              <div>
                <div style={brandNameStyle}>Délice</div>
                <div style={brandSubtitleStyle}>Kalkulator tortów</div>
              </div>
            </div>

            <button
              type="button"
              className="delice-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                border: "none",
                background: "#f4f0ec",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#716b65",
              }}
            >
              ✕
            </button>
          </div>

          <nav style={navStyle}>
            <NavButton
              active={activePanel === "dashboard"}
              onClick={() => handleNavigate("dashboard")}
              icon="⌂"
              label="Dashboard"
            />

            <NavButton
              active={activePanel === "new-cake"}
              onClick={() => handleNavigate("new-cake")}
              icon="+"
              label="Nowy tort"
              primary
            />

            <div style={navSectionStyle}>KALKULATOR</div>

            <NavButton
              active={activePanel === "recipes"}
              onClick={() => handleNavigate("recipes")}
              icon="R"
              label="Receptury"
            />

            <NavButton
              active={activePanel === "products"}
              onClick={() => handleNavigate("products")}
              icon="P"
              label="Produkty"
            />

            <div style={navSectionStyle}>ZARZĄDZANIE</div>

            <NavButton
              active={activePanel === "orders"}
              onClick={() => handleNavigate("orders")}
              icon="O"
              label="Zamówienia"
            />

            <NavButton
              active={activePanel === "clients"}
              onClick={() => handleNavigate("clients")}
              icon="K"
              label="Klienci"
            />

            <NavButton
              active={activePanel === "costs"}
              onClick={() => handleNavigate("costs")}
              icon="Z"
              label="Koszty"
            />
          </nav>

          <div style={sidebarBottomStyle}>
            <div style={userCardStyle}>
              <div style={userAvatarStyle}>
                {session?.user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div style={userInfoStyle}>
                <strong style={userEmailStyle}>
                  {session?.user?.email || "Użytkownik"}
                </strong>
                <span style={userRoleStyle}>Administrator</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={logoutButtonStyle}
            >
              <span>↪</span>
              Wyloguj się
            </button>
          </div>
        </aside>

        <section style={mainContentStyle}>
          <header className="delice-no-print" style={topbarStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                className="delice-mobile-toggle"
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                  border: "1px solid #ddd3c9",
                  background: "#ffffff",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#292522",
                }}
              >
                ☰
              </button>

              <div>
                <div style={topbarEyebrowStyle}>DÉLICE</div>
                <h1 style={topbarTitleStyle}>{getPanelTitle(activePanel)}</h1>
              </div>
            </div>

            <div style={topbarRightStyle}>
              <div style={statusIndicatorStyle}>
                <span style={statusDotStyle} />
                System aktywny
              </div>
            </div>
          </header>

          <div className="delice-content-container" style={contentStyle}>
            {renderPanel()}
          </div>
        </section>
      </div>
    </main>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  primary = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...navButtonStyle,
        ...(active ? navButtonActiveStyle : {}),
        ...(primary ? navPrimaryButtonStyle : {}),
      }}
    >
      <span
        style={{
          ...navIconStyle,
          ...(active ? navIconActiveStyle : {}),
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function Dashboard({
  onNavigate,
  email,
}: {
  onNavigate: (panel: ActivePanel) => void;
  email?: string;
}) {
  return (
    <section>
      <div style={dashboardWelcomeStyle}>
        <div>
          <div style={dashboardEyebrowStyle}>PANEL GŁÓWNY</div>
          <h2 style={dashboardTitleStyle}>Witaj w kalkulatorze Délice</h2>
          <p style={dashboardDescriptionStyle}>
            Zarządzaj recepturami, produktami i przygotowuj kalkulacje tortów w jednym miejscu.
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

      <div style={dashboardGridStyle}>
        <DashboardCard
          icon="R"
          title="Receptury"
          description="Twórz receptury i automatycznie wyliczaj ich koszt."
          action="Otwórz receptury"
          onClick={() => onNavigate("recipes")}
        />

        <DashboardCard
          icon="P"
          title="Produkty"
          description="Zarządzaj bazą produktów, opakowaniami i cenami."
          action="Otwórz produkty"
          onClick={() => onNavigate("products")}
        />

        <DashboardCard
          icon="O"
          title="Zamówienia"
          description="Przygotuj moduł do obsługi zamówień klientów."
          action="Zamówienia"
          onClick={() => onNavigate("orders")}
        />

        <DashboardCard
          icon="K"
          title="Klienci"
          description="Baza klientów i historia realizowanych zamówień."
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

function DashboardCard({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div style={dashboardCardStyle}>
      <div style={dashboardCardIconStyle}>{icon}</div>
      <h3 style={dashboardCardTitleStyle}>{title}</h3>
      <p style={dashboardCardDescriptionStyle}>{description}</p>
      <button
        type="button"
        onClick={onClick}
        style={dashboardCardButtonStyle}
      >
        {action} →
      </button>
    </div>
  );
}

function getPanelTitle(panel: ActivePanel) {
  switch (panel) {
    case "dashboard":
      return "Dashboard";
    case "new-cake":
      return "Nowy tort";
    case "products":
      return "Produkty";
    case "recipes":
      return "Receptury";
    case "orders":
      return "Zamówienia";
    case "clients":
      return "Klienci";
    case "costs":
      return "Koszty";
    default:
      return "Délice";
  }
}

/* =========================
   STYLE
========================= */

const loginPageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f7f4f1 0%, #eee6dd 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box" as const,
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loginWrapperStyle = {
  width: "100%",
  maxWidth: "430px",
};

const loginBrandStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "13px",
  marginBottom: "24px",
};

const loginLogoStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#8a6d4b",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 700,
};

const loginBrandNameStyle = {
  color: "#292522",
  fontSize: "22px",
  fontWeight: 700,
};

const loginBrandSubtitleStyle = {
  color: "#8a837d",
  fontSize: "11px",
  marginTop: "2px",
};

const loginCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "28px 24px",
  boxShadow: "0 15px 50px rgba(80, 60, 40, 0.08)",
};

const loginHeaderStyle = {
  marginBottom: "24px",
};

const loginEyebrowStyle = {
  color: "#8a6d4b",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "2px",
  marginBottom: "8px",
};

const loginTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "26px",
};

const loginDescriptionStyle = {
  color: "#716b65",
  fontSize: "13px",
  lineHeight: 1.6,
  margin: "8px 0 0",
};

const loginLabelStyle = {
  display: "block",
  marginBottom: "16px",
};

const loginLabelTextStyle = {
  display: "block",
  color: "#514b46",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "7px",
};

const loginInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #ddd3c9",
  borderRadius: "10px",
  padding: "12px 13px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
  outline: "none",
};

const loginErrorStyle = {
  background: "#fff1f0",
  border: "1px solid #e7b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "14px",
  fontSize: "13px",
};

const loginButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  padding: "13px",
  background: "#8a6d4b",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
};

const loginFooterStyle = {
  textAlign: "center" as const,
  color: "#9a928b",
  fontSize: "11px",
  marginTop: "18px",
};

const appPageStyle = {
  minHeight: "100vh",
  background: "#f7f4f1",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const appShellStyle = {
  minHeight: "100vh",
  display: "flex",
};

const sidebarStyle = {
  width: "250px",
  minHeight: "100vh",
  background: "#ffffff",
  borderRight: "1px solid #e9e2da",
  display: "flex",
  flexDirection: "column" as const,
  boxSizing: "border-box" as const,
  padding: "22px 15px",
  flexShrink: 0,
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  padding: "4px 9px 20px",
};

const brandLogoStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#8a6d4b",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "21px",
};

const brandNameStyle = {
  color: "#292522",
  fontSize: "18px",
  fontWeight: 700,
};

const brandSubtitleStyle = {
  color: "#9a928b",
  fontSize: "10px",
  marginTop: "2px",
};

const navStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
};

const navSectionStyle = {
  color: "#aaa19a",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  margin: "18px 10px 5px",
};

const navButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  background: "transparent",
  color: "#716b65",
  padding: "10px 11px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textAlign: "left" as const,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const navButtonActiveStyle = {
  background: "#f2ebe4",
  color: "#8a6d4b",
};

const navPrimaryButtonStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  marginBottom: "5px",
};

const navIconStyle = {
  width: "27px",
  height: "27px",
  borderRadius: "8px",
  background: "#f4f0ec",
  color: "#8a837d",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
  flexShrink: 0,
};

const navIconActiveStyle = {
  background: "#ffffff",
  color: "#8a6d4b",
};

const sidebarBottomStyle = {
  marginTop: "auto",
  paddingTop: "20px",
  borderTop: "1px solid #eee7e0",
};

const userCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "8px 5px",
  marginBottom: "7px",
};

const userAvatarStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "13px",
  flexShrink: 0,
};

const userInfoStyle = {
  minWidth: 0,
};

const userEmailStyle = {
  display: "block",
  color: "#514b46",
  fontSize: "11px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  maxWidth: "175px",
};

const userRoleStyle = {
  display: "block",
  color: "#aaa19a",
  fontSize: "10px",
  marginTop: "2px",
};

const logoutButtonStyle = {
  width: "100%",
  border: "1px solid #e9e2da",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#716b65",
  padding: "9px 11px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  fontSize: "12px",
};

const mainContentStyle = {
  flex: 1,
  minWidth: 0,
};

const topbarStyle = {
  height: "76px",
  background: "#ffffff",
  borderBottom: "1px solid #e9e2da",
  padding: "0 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box" as const,
};

const topbarEyebrowStyle = {
  color: "#aaa19a",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  marginBottom: "3px",
};

const topbarTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "20px",
};

const topbarRightStyle = {
  display: "flex",
  alignItems: "center",
};

const statusIndicatorStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#716b65",
  fontSize: "11px",
};

const statusDotStyle = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#477451",
};

const contentStyle = {
  padding: "30px",
  boxSizing: "border-box" as const,
  maxWidth: "1600px",
};

const dashboardWelcomeStyle = {
  background: "linear-gradient(135deg, #ffffff 0%, #fbf8f5 100%)",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
};

const dashboardEyebrowStyle = {
  color: "#8a6d4b",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "2px",
  marginBottom: "7px",
};

const dashboardTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "24px",
};

const dashboardDescriptionStyle = {
  margin: "8px 0 0",
  color: "#716b65",
  fontSize: "13px",
  lineHeight: 1.6,
  maxWidth: "650px",
};

const dashboardPrimaryButtonStyle = {
  border: "none",
  borderRadius: "10px",
  background: "#8a6d4b",
  color: "#ffffff",
  padding: "12px 18px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const dashboardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "15px",
};

const dashboardCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "16px",
  padding: "20px",
};

const dashboardCardIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "11px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "14px",
  marginBottom: "14px",
};

const dashboardCardTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "16px",
};

const dashboardCardDescriptionStyle = {
  color: "#8a837d",
  fontSize: "12px",
  lineHeight: 1.5,
  minHeight: "44px",
};

const dashboardCardButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#8a6d4b",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const quickStartStyle = {
  marginTop: "20px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "16px",
  padding: "18px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const quickStartIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "11px",
  background: "#f0f8f2",
  color: "#477451",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

const quickStartTitleStyle = {
  display: "block",
  color: "#514b46",
  fontSize: "12px",
};

const quickStartTextStyle = {
  margin: "3px 0 0",
  color: "#8a837d",
  fontSize: "12px",
};

const loadingPageStyle = {
  minHeight: "100vh",
  background: "#f7f4f1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "16px",
  padding: "30px 40px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "8px",
  color: "#716b65",
  fontSize: "13px",
};
