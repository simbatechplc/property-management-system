import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import MobileTab from "@/components/shared/mobile-tab";
import ClientFooterProvider from "@/providers/footer-provider";
import { Outlet } from "react-router-dom";
import { ChatWidget } from "@/components/shared/chat-widget";
// import { ChatBotContainer } from "@/components/shared/chatbot";

const MainLayout = () => {
  return (
    <div>
      <Header />

      <main className="min-h-screen pb-10">
        <Outlet />
        <MobileTab className="md:hidden" />
      </main>

      <ClientFooterProvider
        blackListPathNames={[
          "/checkout",
          "/account",
          "/bookings",
          "/account/setting",
          "/account/bookings",
        ]}
      >
        <Footer />
      </ClientFooterProvider>

      {/* Floating action buttons — stacked vertically, same size, same position */}
      {/* On mobile: raised above the 70px bottom tab bar. On desktop: bottom-6 */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        <ChatWidget />
        {/* <ChatBotContainer /> */}
      </div>
    </div>
  );
};

export default MainLayout;
