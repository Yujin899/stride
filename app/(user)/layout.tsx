"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Basic redirect if definitely not logged in and not loading
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role || "user");
            setStreak(data.streak || 0);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
    };
    fetchUserData();
  }, [user?.id]);

  // Global Scroll to Top on Navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

    if (isLoading || (!user && !pathname.includes("/login"))) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center relative z-[100]">
          <div className="animate-pulse text-primary font-display font-bold">Loading Stride...</div>
        </div>
      );
    }
  
    if (!user) return null;
  
    return (
      <div className="min-h-screen bg-background relative">
        {/* Desktop Sidebar */}
        <Sidebar user={user} role={role} streak={streak} />
  
        {/* Mobile Header */}
        <Header user={user} streak={streak} />
  
        {/* Main Content Area */}
        <main className="ml-0 lg:ml-[240px] pt-0 lg:pt-0 pb-[72px] lg:pb-0 transition-all duration-300 relative z-10">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
  
        {/* Mobile Bottom Nav */}
        <BottomNav role={role} />
      </div>
    );
  }
