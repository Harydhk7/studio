import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FolderOpen, Package, ShoppingBag, SendToBack, Users, UserCircle, LogOut, Loader2, Menu, FileText, FileSpreadsheet, SlidersHorizontal, Palette, Ruler, Sparkles, Truck } from "lucide-react";

const navItems: Array<{
  title: string;
  url: string;
  icon: any;
  children?: Array<{ title: string; url: string; icon: any }>;
}> = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Categories", url: "/admin/categories", icon: FolderOpen },
  { title: "Products", url: "/admin/products", icon: Package },
  {
    title: "Product Attributes",
    url: "/admin/attributes",
    icon: SlidersHorizontal,
    children: [
      { title: "Colors", url: "/admin/attributes/colors", icon: Palette },
      { title: "Size", url: "/admin/attributes/size", icon: Ruler },
      { title: "Product decoration", url: "/admin/attributes/decoration", icon: Sparkles },
      { title: "Shipping charge", url: "/admin/attributes/shipping-charge", icon: Truck },
    ],
  },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Invoice Template", url: "/admin/invoice-template", icon: FileText },
  { title: "Reports", url: "/admin/reports", icon: FileSpreadsheet },
  { title: "Theme Config", url: "/admin/theme-config", icon: Palette },
  { title: "Custom Requests", url: "/admin/requests", icon: SendToBack },
  { title: "Customers", url: "/admin/customers", icon: UserCircle },
];

function AdminSidebarNav({
  location,
  logout,
  superAdmin,
  username,
}: {
  location: string;
  logout: () => void;
  superAdmin: boolean;
  username: string;
}) {
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);
  const items = [
    ...navItems,
    ...(superAdmin
      ? [
          { title: "Admins", url: "/admin/admins", icon: Users },
        ]
      : []),
  ];

  return (
    <>
      <SidebarHeader className="h-16 flex flex-col items-stretch justify-center px-6 border-b border-border/50 gap-0.5">
        <span className="font-bold tracking-tight text-lg">SOZOLEN 3D Admin</span>
        <span className="text-xs text-muted-foreground">Logged in as <span className="font-medium text-foreground">{username}</span></span>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarMenu className="mt-4">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.url === "/admin/attributes"
                      ? location === item.url || location.startsWith("/admin/attributes/")
                      : location === item.url
                  }
                >
                  <Link href={item.url} className="h-11 text-[15px] font-medium px-4 flex items-center" onClick={closeMobile}>
                    <item.icon className="w-5 h-5 mr-3 shrink-0" />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.children && (
                  <SidebarMenuSub>
                    {item.children.map((child) => (
                      <SidebarMenuSubItem key={child.url}>
                        <SidebarMenuSubButton asChild isActive={location === child.url}>
                          <Link href={child.url} onClick={closeMobile}>
                            <child.icon className="w-4 h-4 mr-2 shrink-0" />
                            {child.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  closeMobile();
                  logout();
                }}
                className="h-11 text-[15px] text-destructive hover:text-destructive font-medium px-4"
              >
                <LogOut className="w-5 h-5 mr-3 shrink-0" />
                Logout
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isError, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      setLocation("/admin/login");
    }
  }, [isLoading, isError, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-[#fbfbfd] dark:bg-[#0a0a0a]">
        <Sidebar>
          <AdminSidebarNav
            location={location}
            logout={() =>
              logout.mutate(undefined, {
                onSuccess: () => setLocation("/admin/login"),
              })
            }
            superAdmin={user.role === "super_admin"}
            username={user.username}
          />
        </Sidebar>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/50 bg-[#fbfbfd] dark:bg-[#0a0a0a] px-4">
            <SidebarTrigger aria-label="Toggle sidebar">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <span className="font-semibold tracking-tight">SOZOLEN 3D Admin</span>
            <span className="text-sm text-muted-foreground ml-auto">{user.username}</span>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
